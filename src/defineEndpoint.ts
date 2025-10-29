import type { EndpointConfig, EndpointFunction, ValidatedEndpointConfig, ParameterConfig } from "./types";
import { getConfig, isDevelopment } from "./config";
import { computeSchemaHash, getCachedTemplate, setCachedTemplate } from "./cache";
import { generateWithAI } from "./aiProvider";
import { generateWithFaker } from "./fakerGenerator";
import { trackUsage } from "./tracking";
import { validateResponseType } from "./validator";
import { schemaToTypeDescription } from "./schema";
import { IS_DEBUG } from "./env";

// Use a global registry to share endpoints across all module instances
// This is necessary when loading TypeScript files dynamically via tsx
const globalKey = Symbol.for('@@mockend/registeredEndpoints');
if (!(globalThis as any)[globalKey]) {
  (globalThis as any)[globalKey] = new Map<string, EndpointConfig<any>>();
}
const registeredEndpoints: Map<string, EndpointConfig<any>> = (globalThis as any)[globalKey];

// Global context for current file being loaded
const currentFileKey = Symbol.for('@@mockend/currentFile');
if (!(globalThis as any)[currentFileKey]) {
  (globalThis as any)[currentFileKey] = null;
}

/**
 * Set the current file being loaded (called by loadEndpoints)
 */
export function setCurrentFile(filename: string | null) {
  (globalThis as any)[currentFileKey] = filename;
}

/**
 * Get the current file being loaded
 */
function getCurrentFile(): string {
  return (globalThis as any)[currentFileKey] || 'unknown';
}

/**
 * Validate that all required parameters are provided
 */
function validateParameters(
  config: EndpointConfig<any>,
  params?: Record<string, any>
): void {
  if (!config.params || config.params.length === 0) {
    return; // No parameters defined, skip validation
  }

  const providedParams = params || {};
  const missingParams: string[] = [];

  for (const param of config.params) {
    // Skip validation for path parameters (they're extracted from URL)
    if (param.location === "path") {
      continue;
    }

    if (param.required !== false && !(param.name in providedParams)) {
      missingParams.push(`${param.name} (${param.location})`);
    }
  }

  if (missingParams.length > 0) {
    throw new Error(
      `[Symulate] Missing required parameters for ${config.method} ${config.path}: ${missingParams.join(", ")}`
    );
  }
}

// Overload 1: With readonly params array (enables validation)
export function defineEndpoint<
  T,
  Path extends string,
  Params extends readonly ParameterConfig[]
>(
  config: ValidatedEndpointConfig<T, Path, Params>
): EndpointFunction<T>;

// Overload 2: With regular params array (no validation, backwards compatible)
export function defineEndpoint<T>(
  config: EndpointConfig<T>
): EndpointFunction<T>;

// Implementation
export function defineEndpoint<T>(
  config: EndpointConfig<T>
): EndpointFunction<T> {
  const endpointKey = `${config.method} ${config.path}`;

  // Get the filename of the file currently being loaded
  const filename = getCurrentFile();
  const configWithFilename = { ...config, __filename: filename };

  registeredEndpoints.set(endpointKey, configWithFilename);

  if (IS_DEBUG) {
    console.log(`[Symulate] Endpoint registered: ${endpointKey} from ${filename} (total: ${registeredEndpoints.size})`);
  }

  return async (params?: Record<string, any>): Promise<T> => {
    // Validate parameters before processing
    validateParameters(config, params);

    // Check if endpoint has a mode override, otherwise fall back to global environment
    const shouldUseMock = config.mode === "mock"
      ? true
      : config.mode === "production"
        ? false
        : isDevelopment(); // Use global environment if no mode specified

    if (shouldUseMock) {
      return generateMockData<T>(config, params);
    } else {
      return callRealBackend<T>(config, params);
    }
  };
}

/**
 * Interpolates variables in a string template
 * Supports {{variable}} syntax
 */
function interpolateVariables(template: string, params: Record<string, any>): string {
  if (!params) return template;

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match;
  });
}

async function generateMockData<T>(config: EndpointConfig<T>, params?: Record<string, any>): Promise<T> {
  const globalConfig = getConfig();

  // Check if any error has failNow flag set to true
  const failNowError = config.errors?.find(error => error.failNow === true);
  if (failNowError) {
    console.log(`[Symulate] ⚠️ Simulating error response (${failNowError.code}) due to failNow flag`);

    // Generate error data if schema provided, otherwise use a default error
    let errorData: any;
    if (failNowError.schema) {
      const generateMode = globalConfig.generateMode || "auto";

      if (generateMode === "faker" || generateMode === "auto") {
        errorData = generateWithFaker(failNowError.schema, 1);
      } else {
        try {
          errorData = await generateWithAI({
            schema: failNowError.schema,
            instruction: failNowError.description || `Generate error response for ${failNowError.code}`,
            typeDescription: schemaToTypeDescription(failNowError.schema),
          });
        } catch (error) {
          // Fallback to Faker if AI fails
          errorData = generateWithFaker(failNowError.schema, 1);
        }
      }
    } else {
      // Default error structure
      errorData = {
        error: {
          message: failNowError.description || `Error ${failNowError.code}`,
          code: failNowError.code.toString(),
        },
      };
    }

    // Create an error object that includes the generated error data
    const error = new Error(`[Symulate Mock] HTTP ${failNowError.code}: ${failNowError.description || 'Error'}`);
    (error as any).status = failNowError.code;
    (error as any).data = errorData;
    throw error;
  }

  // API key is required for all modes (even Faker mode for user tracking and quota management)
  if (!globalConfig.symulateApiKey) {
    throw new Error(
      `[Symulate] API key required for all generation modes (including Faker). ` +
      `Get your free API key at https://platform.symulate.dev\n\n` +
      `Free tier includes:\n` +
      `  • Unlimited Faker.js mode (CI/CD)\n` +
      `  • 100 AI calls/month (try realistic data)\n\n` +
      `Add to your config:\n` +
      `configureSymulate({ symulateApiKey: "sym_live_xxx" })`
    );
  }

  // Schema is required for generation
  if (!config.schema) {
    throw new Error(
      `Schema is required for endpoint ${config.method} ${config.path}. ` +
      `Define a schema using the 'm' builder: schema: m.object({ ... })`
    );
  }

  const count = config.mock?.count || 1;
  const generateMode = globalConfig.generateMode || "auto";

  // Interpolate variables in instruction if params provided
  const instruction = config.mock?.instruction
    ? interpolateVariables(config.mock.instruction, params || {})
    : undefined;

  // Build the schema object for hashing (determines if we need to regenerate)
  const typeDescription = schemaToTypeDescription(config.schema);
  const schemaForHash: any = {
    typeDescription,
    count,
    instruction, // Use interpolated instruction
    path: config.path,
    mode: generateMode, // Include mode in hash to separate AI vs Faker cache
    params, // Include params in hash for unique caching per parameter combination
  };

  // Include additional config properties in hash if regenerateOnConfigChange is enabled (default: true)
  const regenerateOnConfigChange = globalConfig.regenerateOnConfigChange !== false; // Default to true
  if (regenerateOnConfigChange) {
    schemaForHash.method = config.method;
    schemaForHash.mockDelay = config.mock?.delay;
    // Note: instruction and count are already included above
  }

  const schemaHash = computeSchemaHash(schemaForHash);

  console.log("[Symulate] Schema hash:", schemaHash);
  console.log("[Symulate] Generate mode:", generateMode);
  console.log("[Symulate] Schema for hash:", JSON.stringify(schemaForHash, null, 2));

  // Check cache first - if schema hasn't changed, return cached data
  if (globalConfig.cacheEnabled) {
    const cached = await getCachedTemplate(schemaHash);
    if (cached) {
      console.log(`[Symulate] ✓ Cache hit for ${config.path} (hash: ${schemaHash})`);
      console.log("[Symulate] Returning cached data. To regenerate, call clearCache() or change the schema.");

      // Simulate loading delay if configured (only for cached data)
      const delay = config.mock?.delay;
      if (delay && delay > 0) {
        console.log(`[Symulate] ⏱ Simulating ${delay}ms loading delay...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      return cached.template as T;
    } else {
      console.log(`[Symulate] ✗ Cache miss for ${config.path} (hash: ${schemaHash})`);
    }
  }

  // No cache or schema changed - generate new data based on mode
  let generatedData: T;

  // MODE: "faker" - Always use Faker.js (CI/CD mode)
  if (generateMode === "faker") {
    console.log(`[Symulate] Generating mock data with Faker.js for ${config.path} (CI/CD mode)...`);
    console.log(`[Symulate] 💡 Using basic Faker.js data. Switch to generateMode: "ai" for realistic, contextual data.`);
    generatedData = generateWithFaker(config.schema, count);

    // Track usage for analytics (non-blocking, unlimited - doesn't count against quota)
    trackUsage({
      endpoint: config.path,
      mode: "faker",
      cached: false,
    });

    // Cache the generated data
    if (globalConfig.cacheEnabled) {
      await setCachedTemplate(schemaHash, generatedData, config.path);
      console.log(`[Symulate] ✓ Cached Faker.js data for ${config.path} (hash: ${schemaHash})`);
    }

    return generatedData;
  }

  // MODE: "ai" - Always use AI (strict mode, no fallback)
  if (generateMode === "ai") {
    try {
      console.log(`[Symulate] Generating realistic mock data with AI for ${config.path}...`, {
        typeDescription,
        count,
        instruction,
      });

      generatedData = await generateWithAI({
        schema: schemaForHash,
        instruction,
        typeDescription,
      });

      // Cache the generated data
      if (globalConfig.cacheEnabled) {
        await setCachedTemplate(schemaHash, generatedData, config.path);
        console.log(`[Symulate] ✓ Cached AI-generated data for ${config.path} (hash: ${schemaHash})`);
      }

      return generatedData;
    } catch (error) {
      console.error("[Symulate] Failed to generate with AI:", error);
      console.error("[Symulate] 💡 Tip: Use generateMode: 'auto' for automatic fallback to Faker.js on errors");
      throw error; // In "ai" mode, always throw errors (strict mode)
    }
  }

  // MODE: "auto" - Try AI first, fallback to Faker.js
  if (generateMode === "auto") {
    // Check if quota is exceeded before attempting AI generation
    const { isQuotaExceeded } = await import("./config");
    const apiKey = globalConfig.symulateApiKey;

    if (apiKey && isQuotaExceeded(apiKey)) {
      // Quota exceeded - skip AI request and go straight to Faker.js
      console.log(`[Symulate] Generating mock data with Faker.js (quota exceeded) for ${config.path}...`);
      generatedData = generateWithFaker(config.schema, count);

      // Track fallback usage for analytics (non-blocking, unlimited)
      trackUsage({
        endpoint: config.path,
        mode: "faker",
        cached: false,
      });

      // Cache the generated data
      if (globalConfig.cacheEnabled) {
        await setCachedTemplate(schemaHash, generatedData, config.path);
        console.log(`[Symulate] ✓ Cached Faker.js data for ${config.path} (hash: ${schemaHash})`);
      }

      return generatedData;
    }

    // Try AI generation
    try {
      console.log(`[Symulate] Generating realistic mock data with AI for ${config.path}...`);

      generatedData = await generateWithAI({
        schema: schemaForHash,
        instruction,
        typeDescription,
      });

      // Cache the generated data
      if (globalConfig.cacheEnabled) {
        await setCachedTemplate(schemaHash, generatedData, config.path);
        console.log(`[Symulate] ✓ Cached AI-generated data for ${config.path} (hash: ${schemaHash})`);
      }

      return generatedData;
    } catch (error) {
      console.warn("[Symulate] AI generation failed, falling back to Faker.js:", error);
      console.log("[Symulate] 💡 Fallback mode provides basic data. Check your quota at https://platform.symulate.dev");

      // Fallback to Faker.js
      console.log(`[Symulate] Generating mock data with Faker.js (fallback) for ${config.path}...`);
      generatedData = generateWithFaker(config.schema, count);

      // Track fallback usage for analytics (non-blocking, unlimited)
      trackUsage({
        endpoint: config.path,
        mode: "faker",
        cached: false,
      });

      // Cache the generated data
      if (globalConfig.cacheEnabled) {
        await setCachedTemplate(schemaHash, generatedData, config.path);
        console.log(`[Symulate] ✓ Cached Faker.js data for ${config.path} (hash: ${schemaHash})`);
      }

      return generatedData;
    }
  }

  // Should never reach here
  throw new Error(`[Symulate] Invalid generateMode: ${generateMode}`);
}

async function callRealBackend<T>(
  config: EndpointConfig<T>,
  params?: Record<string, any>
): Promise<T> {
  const globalConfig = getConfig();

  if (!globalConfig.backendBaseUrl) {
    throw new Error(
      "backendBaseUrl not configured. Please set it in configureSymulate() for production mode."
    );
  }

  let url = `${globalConfig.backendBaseUrl}${config.path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const providedParams = params || {};

  // Separate parameters by location
  const pathParams: Record<string, any> = {};
  const queryParams: Record<string, any> = {};
  const headerParams: Record<string, string> = {};
  const bodyParams: Record<string, any> = {};

  if (config.params && config.params.length > 0) {
    // Use parameter definitions to route values correctly
    for (const paramDef of config.params) {
      const value = providedParams[paramDef.name];
      if (value !== undefined) {
        switch (paramDef.location) {
          case "path":
            pathParams[paramDef.name] = value;
            break;
          case "query":
            queryParams[paramDef.name] = value;
            break;
          case "header":
            headerParams[paramDef.name] = String(value);
            break;
          case "body":
            bodyParams[paramDef.name] = value;
            break;
        }
      }
    }
  } else {
    // Fallback: Legacy behavior for endpoints without param definitions
    if (config.method === "GET") {
      // For GET: path params in URL, rest as query params
      for (const [key, value] of Object.entries(providedParams)) {
        if (url.includes(`:${key}`)) {
          pathParams[key] = value;
        } else {
          queryParams[key] = value;
        }
      }
    } else {
      // For POST/PUT/PATCH: path params in URL, rest in body
      for (const [key, value] of Object.entries(providedParams)) {
        if (url.includes(`:${key}`)) {
          pathParams[key] = value;
        } else {
          bodyParams[key] = value;
        }
      }
    }
  }

  // Replace path parameters in URL
  for (const [key, value] of Object.entries(pathParams)) {
    url = url.replace(`:${key}`, String(value));
  }

  // Add query parameters to URL
  if (Object.keys(queryParams).length > 0) {
    const urlParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      urlParams.append(key, String(value));
    }
    const queryString = urlParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Add header parameters
  Object.assign(headers, headerParams);

  // Determine request body
  let body: string | undefined;
  if (config.method !== "GET" && config.method !== "DELETE") {
    if (Object.keys(bodyParams).length > 0) {
      body = JSON.stringify(bodyParams);
    }
  }

  const response = await fetch(url, {
    method: config.method,
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // In production mode, we trust the backend and skip validation
  // The backend is the source of truth for the data structure
  return data as T;
}

export function getRegisteredEndpoints(): Map<string, EndpointConfig<any>> {
  return registeredEndpoints;
}
