import {
  computeSchemaHash,
  getCachedTemplate,
  setCachedTemplate
} from "./chunk-L3W6IOE7.mjs";
import {
  config_exports,
  getConfig,
  init_config,
  isDevelopment
} from "./chunk-RV4NJJYN.mjs";
import {
  auth_exports,
  init_auth
} from "./chunk-PAN643QS.mjs";
import {
  IS_DEBUG,
  init_env
} from "./chunk-HMEUN2V3.mjs";
import {
  __toCommonJS
} from "./chunk-CIESM3BP.mjs";

// src/defineEndpoint.ts
init_config();

// src/aiProvider.ts
init_config();
var PLATFORM_API_URL = "https://ptrjfelueuglvsdsqzok.supabase.co/functions/v1/symulate";
function getAuthSession() {
  if (typeof process === "undefined" || !process.versions?.node) {
    return null;
  }
  try {
    const auth = (init_auth(), __toCommonJS(auth_exports));
    return auth.getAuthSession();
  } catch {
    return null;
  }
}
async function generateWithAI(options) {
  const config = getConfig();
  if (!config.symulateApiKey) {
    throw new Error(
      "No Mockend API key configured. Get your free API key at https://platform.symulate.dev"
    );
  }
  return generateWithPlatform(options, config.symulateApiKey);
}
async function generateWithPlatform(options, apiKey) {
  const config = getConfig();
  const count = options.schema?.count || 1;
  let projectId = config.projectId;
  if (!projectId) {
    const session = getAuthSession();
    if (session) {
      projectId = session.currentProjectId;
    }
  }
  if (!projectId) {
    throw new Error(
      "Project ID required. Configure it with:\n  configureSymulate({ projectId: 'your-project-id' })\n\nGet your project ID from https://platform.symulate.dev\n\nAlternatively, if using CLI:\n  1. Run 'npx symulate orgs list' to see available organizations\n  2. Run 'npx symulate orgs use <org-id>' to select an organization\n  3. Run 'npx symulate projects list' to see available projects\n  4. Run 'npx symulate projects use <project-id>' to select a project"
    );
  }
  console.log("Generating with Mockend Platform API...", {
    hasTypeDescription: !!options.typeDescription,
    instruction: options.instruction,
    count,
    language: config.language
  });
  try {
    const response = await fetch(PLATFORM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mockend-API-Key": apiKey,
        "X-Mockend-Project-Id": projectId
      },
      body: JSON.stringify({
        schema: options.typeDescription || options.schema,
        instruction: options.instruction,
        count,
        language: config.language
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      if (response.status === 401) {
        throw new Error(
          "Invalid Mockend API key. Get your API key at https://platform.symulate.dev"
        );
      }
      if (response.status === 429) {
        const { markQuotaExceeded } = (init_config(), __toCommonJS(config_exports));
        markQuotaExceeded(
          apiKey,
          errorData.tokens_used,
          errorData.tokens_limit
        );
        throw new Error(
          errorData.error || "Quota exceeded. Upgrade your plan at https://platform.symulate.dev"
        );
      }
      throw new Error(
        `Mockend Platform API error: ${response.status} ${errorData.error || response.statusText}`
      );
    }
    const data = await response.json();
    const tokensUsed = response.headers.get("X-Mockend-Tokens-Used");
    const tokensRemaining = response.headers.get("X-Mockend-Tokens-Remaining");
    const tokensLimit = response.headers.get("X-Mockend-Tokens-Limit");
    const cached = response.headers.get("X-Mockend-Cached") === "true";
    if (tokensRemaining && tokensLimit) {
      const { updateQuotaStatus } = (init_config(), __toCommonJS(config_exports));
      updateQuotaStatus(apiKey, parseInt(tokensRemaining), parseInt(tokensLimit));
    }
    if (tokensUsed || tokensRemaining) {
      console.log(`[Symulate] ${cached ? "Cache hit" : "Generated"} | Tokens: ${tokensUsed || 0} used, ${tokensRemaining || 0}/${tokensLimit || 0} remaining`);
    }
    return data;
  } catch (error) {
    console.error("Failed to generate with Mockend Platform:", error);
    throw error;
  }
}

// src/fakerGenerator.ts
init_config();
import { faker } from "@faker-js/faker";
function generateWithFaker(schema, count = 1) {
  const config = getConfig();
  if (config.fakerSeed !== void 0) {
    faker.seed(config.fakerSeed);
  }
  if (count > 1) {
    return Array.from({ length: count }, () => generateSingleValue(schema));
  }
  return generateSingleValue(schema);
}
function generateSingleValue(schema) {
  const schemaType = schema._meta.schemaType;
  if (schemaType === "object") {
    const objSchema = schema;
    const result = {};
    for (const key in objSchema._shape) {
      result[key] = generateSingleValue(objSchema._shape[key]);
    }
    return result;
  }
  if (schemaType === "array") {
    const arrSchema = schema;
    const arrayLength = faker.number.int({ min: 3, max: 5 });
    return Array.from({ length: arrayLength }, () => generateSingleValue(arrSchema._element));
  }
  switch (schemaType) {
    case "uuid":
      return faker.string.uuid();
    case "string":
      return faker.lorem.word();
    case "number":
      return faker.number.int({ min: 1, max: 1e3 });
    case "boolean":
      return faker.datatype.boolean();
    case "date":
      return faker.date.recent().toISOString();
    case "email":
      return faker.internet.email();
    case "url":
      return faker.internet.url();
    case "phoneNumber":
      return faker.phone.number();
    // Person fields
    case "person.fullName":
      return faker.person.fullName();
    case "person.firstName":
      return faker.person.firstName();
    case "person.lastName":
      return faker.person.lastName();
    case "person.jobTitle":
      return faker.person.jobTitle();
    // Internet fields
    case "internet.userName":
      return faker.internet.userName();
    case "internet.avatar":
      return faker.image.avatar();
    // Location fields
    case "location.street":
      return faker.location.streetAddress();
    case "location.city":
      return faker.location.city();
    case "location.state":
      return faker.location.state();
    case "location.zipCode":
      return faker.location.zipCode();
    case "location.country":
      return faker.location.country();
    case "location.latitude":
      return faker.location.latitude().toString();
    case "location.longitude":
      return faker.location.longitude().toString();
    // Commerce fields
    case "commerce.productName":
      return faker.commerce.productName();
    case "commerce.department":
      return faker.commerce.department();
    case "commerce.price":
      return parseFloat(faker.commerce.price());
    // Lorem fields
    case "lorem.word":
      return faker.lorem.word();
    case "lorem.sentence":
      return faker.lorem.sentence();
    case "lorem.paragraph":
      return faker.lorem.paragraph();
    default:
      return faker.lorem.word();
  }
}

// src/tracking.ts
init_config();
var PLATFORM_API_URL2 = "https://ptrjfelueuglvsdsqzok.supabase.co/functions/v1/symulate";
async function trackUsage(options) {
  const config = getConfig();
  if (!config.symulateApiKey) {
    return;
  }
  if (!config.projectId) {
    return;
  }
  fetch(PLATFORM_API_URL2, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Mockend-API-Key": config.symulateApiKey,
      "X-Mockend-Project-Id": config.projectId,
      "X-Mockend-Track-Only": "true"
      // Signal this is tracking-only
    },
    body: JSON.stringify({
      mode: options.mode,
      endpoint: options.endpoint,
      cached: options.cached,
      trackOnly: true
    })
  }).catch(() => {
  });
}

// src/schema.ts
var SchemaBuilder = class {
  constructor() {
    // Person fields
    this.person = {
      fullName: (description) => ({
        _type: "",
        _meta: { schemaType: "person.fullName", description }
      }),
      firstName: (description) => ({
        _type: "",
        _meta: { schemaType: "person.firstName", description }
      }),
      lastName: (description) => ({
        _type: "",
        _meta: { schemaType: "person.lastName", description }
      }),
      jobTitle: (description) => ({
        _type: "",
        _meta: { schemaType: "person.jobTitle", description }
      })
    };
    // Internet fields
    this.internet = {
      userName: (description) => ({
        _type: "",
        _meta: { schemaType: "internet.userName", description }
      }),
      avatar: (description) => ({
        _type: "",
        _meta: { schemaType: "internet.avatar", description }
      })
    };
    // Location fields
    this.location = {
      street: (description) => ({
        _type: "",
        _meta: { schemaType: "location.street", description }
      }),
      city: (description) => ({
        _type: "",
        _meta: { schemaType: "location.city", description }
      }),
      state: (description) => ({
        _type: "",
        _meta: { schemaType: "location.state", description }
      }),
      zipCode: (description) => ({
        _type: "",
        _meta: { schemaType: "location.zipCode", description }
      }),
      country: (description) => ({
        _type: "",
        _meta: { schemaType: "location.country", description }
      }),
      latitude: (description) => ({
        _type: "",
        _meta: { schemaType: "location.latitude", description }
      }),
      longitude: (description) => ({
        _type: "",
        _meta: { schemaType: "location.longitude", description }
      })
    };
    // Commerce fields
    this.commerce = {
      productName: (description) => ({
        _type: "",
        _meta: { schemaType: "commerce.productName", description }
      }),
      department: (description) => ({
        _type: "",
        _meta: { schemaType: "commerce.department", description }
      }),
      price: (description) => ({
        _type: 0,
        _meta: { schemaType: "commerce.price", description }
      })
    };
    // Lorem fields
    this.lorem = {
      word: (description) => ({
        _type: "",
        _meta: { schemaType: "lorem.word", description }
      }),
      sentence: (description) => ({
        _type: "",
        _meta: { schemaType: "lorem.sentence", description }
      }),
      paragraph: (description) => ({
        _type: "",
        _meta: { schemaType: "lorem.paragraph", description }
      })
    };
  }
  // Primitive types
  uuid(description) {
    return {
      _type: "",
      _meta: { schemaType: "uuid", description }
    };
  }
  string(description) {
    return {
      _type: "",
      _meta: { schemaType: "string", description }
    };
  }
  number(description) {
    return {
      _type: 0,
      _meta: { schemaType: "number", description }
    };
  }
  boolean(description) {
    return {
      _type: false,
      _meta: { schemaType: "boolean", description }
    };
  }
  date(description) {
    return {
      _type: "",
      _meta: { schemaType: "date", description }
    };
  }
  email(description) {
    return {
      _type: "",
      _meta: { schemaType: "email", description }
    };
  }
  url(description) {
    return {
      _type: "",
      _meta: { schemaType: "url", description }
    };
  }
  phoneNumber(description) {
    return {
      _type: "",
      _meta: { schemaType: "phoneNumber", description }
    };
  }
  // Complex types
  object(shape, description) {
    return {
      _type: {},
      _meta: { schemaType: "object", description },
      _shape: shape
    };
  }
  array(element, description) {
    return {
      _type: [],
      _meta: { schemaType: "array", description },
      _element: element
    };
  }
};
var m = new SchemaBuilder();
function schemaToTypeDescription(schema) {
  if (schema._meta.schemaType === "object") {
    const objSchema = schema;
    const result = {};
    for (const key in objSchema._shape) {
      result[key] = schemaToTypeDescription(objSchema._shape[key]);
    }
    return result;
  }
  if (schema._meta.schemaType === "array") {
    const arrSchema = schema;
    return [schemaToTypeDescription(arrSchema._element)];
  }
  const typeDescriptions = {
    uuid: "UUID string",
    string: "string",
    number: "number",
    boolean: "boolean",
    date: "ISO date string",
    email: "email address",
    url: "URL",
    phoneNumber: "phone number",
    "person.fullName": "full name",
    "person.firstName": "first name",
    "person.lastName": "last name",
    "person.jobTitle": "job title",
    "internet.userName": "username",
    "internet.avatar": "avatar URL",
    "location.street": "street address",
    "location.city": "city",
    "location.state": "state",
    "location.zipCode": "ZIP code",
    "location.country": "country",
    "location.latitude": "latitude coordinate",
    "location.longitude": "longitude coordinate",
    "commerce.productName": "product name",
    "commerce.department": "department/category name",
    "commerce.price": "price (number)",
    "lorem.word": "word",
    "lorem.sentence": "sentence",
    "lorem.paragraph": "paragraph"
  };
  const desc = typeDescriptions[schema._meta.schemaType] || schema._meta.schemaType;
  return schema._meta.description ? `${desc} (${schema._meta.description})` : desc;
}

// src/defineEndpoint.ts
init_env();
var globalKey = Symbol.for("@@mockend/registeredEndpoints");
if (!globalThis[globalKey]) {
  globalThis[globalKey] = /* @__PURE__ */ new Map();
}
var registeredEndpoints = globalThis[globalKey];
var currentFileKey = Symbol.for("@@mockend/currentFile");
if (!globalThis[currentFileKey]) {
  globalThis[currentFileKey] = null;
}
function setCurrentFile(filename) {
  globalThis[currentFileKey] = filename;
}
function getCurrentFile() {
  return globalThis[currentFileKey] || "unknown";
}
function validateParameters(config, params) {
  if (!config.params || config.params.length === 0) {
    return;
  }
  const providedParams = params || {};
  const missingParams = [];
  for (const param of config.params) {
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
function defineEndpoint(config) {
  const endpointKey = `${config.method} ${config.path}`;
  const filename = getCurrentFile();
  const configWithFilename = { ...config, __filename: filename };
  registeredEndpoints.set(endpointKey, configWithFilename);
  if (IS_DEBUG) {
    console.log(`[Symulate] Endpoint registered: ${endpointKey} from ${filename} (total: ${registeredEndpoints.size})`);
  }
  return async (params) => {
    validateParameters(config, params);
    const shouldUseMock = config.mode === "mock" ? true : config.mode === "production" ? false : isDevelopment();
    if (shouldUseMock) {
      return generateMockData(config, params);
    } else {
      return callRealBackend(config, params);
    }
  };
}
function interpolateVariables(template, params) {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return params[key] !== void 0 ? String(params[key]) : match;
  });
}
async function generateMockData(config, params) {
  const globalConfig = getConfig();
  const failNowError = config.errors?.find((error) => error.failNow === true);
  if (failNowError) {
    console.log(`[Symulate] \u26A0\uFE0F Simulating error response (${failNowError.code}) due to failNow flag`);
    let errorData;
    if (failNowError.schema) {
      const generateMode2 = globalConfig.generateMode || "auto";
      if (generateMode2 === "faker" || generateMode2 === "auto") {
        errorData = generateWithFaker(failNowError.schema, 1);
      } else {
        try {
          errorData = await generateWithAI({
            schema: failNowError.schema,
            instruction: failNowError.description || `Generate error response for ${failNowError.code}`,
            typeDescription: schemaToTypeDescription(failNowError.schema)
          });
        } catch (error2) {
          errorData = generateWithFaker(failNowError.schema, 1);
        }
      }
    } else {
      errorData = {
        error: {
          message: failNowError.description || `Error ${failNowError.code}`,
          code: failNowError.code.toString()
        }
      };
    }
    const error = new Error(`[Symulate Mock] HTTP ${failNowError.code}: ${failNowError.description || "Error"}`);
    error.status = failNowError.code;
    error.data = errorData;
    throw error;
  }
  if (!globalConfig.symulateApiKey) {
    throw new Error(
      `[Symulate] API key required for all generation modes (including Faker). Get your free API key at https://platform.symulate.dev

Free tier includes:
  \u2022 Unlimited Faker.js mode (CI/CD)
  \u2022 100 AI calls/month (try realistic data)

Add to your config:
configureSymulate({ symulateApiKey: "sym_live_xxx" })`
    );
  }
  if (!config.schema) {
    throw new Error(
      `Schema is required for endpoint ${config.method} ${config.path}. Define a schema using the 'm' builder: schema: m.object({ ... })`
    );
  }
  const count = config.mock?.count || 1;
  const generateMode = globalConfig.generateMode || "auto";
  const instruction = config.mock?.instruction ? interpolateVariables(config.mock.instruction, params || {}) : void 0;
  const typeDescription = schemaToTypeDescription(config.schema);
  const schemaForHash = {
    typeDescription,
    count,
    instruction,
    // Use interpolated instruction
    path: config.path,
    mode: generateMode,
    // Include mode in hash to separate AI vs Faker cache
    params
    // Include params in hash for unique caching per parameter combination
  };
  const regenerateOnConfigChange = globalConfig.regenerateOnConfigChange !== false;
  if (regenerateOnConfigChange) {
    schemaForHash.method = config.method;
    schemaForHash.mockDelay = config.mock?.delay;
  }
  const schemaHash = computeSchemaHash(schemaForHash);
  console.log("[Symulate] Schema hash:", schemaHash);
  console.log("[Symulate] Generate mode:", generateMode);
  console.log("[Symulate] Schema for hash:", JSON.stringify(schemaForHash, null, 2));
  if (globalConfig.cacheEnabled) {
    const cached = await getCachedTemplate(schemaHash);
    if (cached) {
      console.log(`[Symulate] \u2713 Cache hit for ${config.path} (hash: ${schemaHash})`);
      console.log("[Symulate] Returning cached data. To regenerate, call clearCache() or change the schema.");
      const delay = config.mock?.delay;
      if (delay && delay > 0) {
        console.log(`[Symulate] \u23F1 Simulating ${delay}ms loading delay...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      return cached.template;
    } else {
      console.log(`[Symulate] \u2717 Cache miss for ${config.path} (hash: ${schemaHash})`);
    }
  }
  let generatedData;
  if (generateMode === "faker") {
    console.log(`[Symulate] Generating mock data with Faker.js for ${config.path} (CI/CD mode)...`);
    console.log(`[Symulate] \u{1F4A1} Using basic Faker.js data. Switch to generateMode: "ai" for realistic, contextual data.`);
    generatedData = generateWithFaker(config.schema, count);
    trackUsage({
      endpoint: config.path,
      mode: "faker",
      cached: false
    });
    if (globalConfig.cacheEnabled) {
      await setCachedTemplate(schemaHash, generatedData);
      console.log(`[Symulate] \u2713 Cached Faker.js data for ${config.path} (hash: ${schemaHash})`);
    }
    return generatedData;
  }
  if (generateMode === "ai") {
    try {
      console.log(`[Symulate] Generating realistic mock data with AI for ${config.path}...`, {
        typeDescription,
        count,
        instruction
      });
      generatedData = await generateWithAI({
        schema: schemaForHash,
        instruction,
        typeDescription
      });
      if (globalConfig.cacheEnabled) {
        await setCachedTemplate(schemaHash, generatedData);
        console.log(`[Symulate] \u2713 Cached AI-generated data for ${config.path} (hash: ${schemaHash})`);
      }
      return generatedData;
    } catch (error) {
      console.error("[Symulate] Failed to generate with AI:", error);
      console.error("[Symulate] \u{1F4A1} Tip: Use generateMode: 'auto' for automatic fallback to Faker.js on errors");
      throw error;
    }
  }
  if (generateMode === "auto") {
    const { isQuotaExceeded } = await import("./config-VYKHUCHO.mjs");
    const apiKey = globalConfig.symulateApiKey;
    if (apiKey && isQuotaExceeded(apiKey)) {
      console.log(`[Symulate] Generating mock data with Faker.js (quota exceeded) for ${config.path}...`);
      generatedData = generateWithFaker(config.schema, count);
      trackUsage({
        endpoint: config.path,
        mode: "faker",
        cached: false
      });
      if (globalConfig.cacheEnabled) {
        await setCachedTemplate(schemaHash, generatedData);
        console.log(`[Symulate] \u2713 Cached Faker.js data for ${config.path} (hash: ${schemaHash})`);
      }
      return generatedData;
    }
    try {
      console.log(`[Symulate] Generating realistic mock data with AI for ${config.path}...`);
      generatedData = await generateWithAI({
        schema: schemaForHash,
        instruction,
        typeDescription
      });
      if (globalConfig.cacheEnabled) {
        await setCachedTemplate(schemaHash, generatedData);
        console.log(`[Symulate] \u2713 Cached AI-generated data for ${config.path} (hash: ${schemaHash})`);
      }
      return generatedData;
    } catch (error) {
      console.warn("[Symulate] AI generation failed, falling back to Faker.js:", error);
      console.log("[Symulate] \u{1F4A1} Fallback mode provides basic data. Check your quota at https://platform.symulate.dev");
      console.log(`[Symulate] Generating mock data with Faker.js (fallback) for ${config.path}...`);
      generatedData = generateWithFaker(config.schema, count);
      trackUsage({
        endpoint: config.path,
        mode: "faker",
        cached: false
      });
      if (globalConfig.cacheEnabled) {
        await setCachedTemplate(schemaHash, generatedData);
        console.log(`[Symulate] \u2713 Cached Faker.js data for ${config.path} (hash: ${schemaHash})`);
      }
      return generatedData;
    }
  }
  throw new Error(`[Symulate] Invalid generateMode: ${generateMode}`);
}
async function callRealBackend(config, params) {
  const globalConfig = getConfig();
  if (!globalConfig.backendBaseUrl) {
    throw new Error(
      "backendBaseUrl not configured. Please set it in configureSymulate() for production mode."
    );
  }
  let url = `${globalConfig.backendBaseUrl}${config.path}`;
  const headers = {
    "Content-Type": "application/json"
  };
  const providedParams = params || {};
  const pathParams = {};
  const queryParams = {};
  const headerParams = {};
  const bodyParams = {};
  if (config.params && config.params.length > 0) {
    for (const paramDef of config.params) {
      const value = providedParams[paramDef.name];
      if (value !== void 0) {
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
    if (config.method === "GET") {
      for (const [key, value] of Object.entries(providedParams)) {
        if (url.includes(`:${key}`)) {
          pathParams[key] = value;
        } else {
          queryParams[key] = value;
        }
      }
    } else {
      for (const [key, value] of Object.entries(providedParams)) {
        if (url.includes(`:${key}`)) {
          pathParams[key] = value;
        } else {
          bodyParams[key] = value;
        }
      }
    }
  }
  for (const [key, value] of Object.entries(pathParams)) {
    url = url.replace(`:${key}`, String(value));
  }
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
  Object.assign(headers, headerParams);
  let body;
  if (config.method !== "GET" && config.method !== "DELETE") {
    if (Object.keys(bodyParams).length > 0) {
      body = JSON.stringify(bodyParams);
    }
  }
  const response = await fetch(url, {
    method: config.method,
    headers,
    body
  });
  if (!response.ok) {
    throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}
function getRegisteredEndpoints() {
  return registeredEndpoints;
}

export {
  m,
  setCurrentFile,
  defineEndpoint,
  getRegisteredEndpoints
};
