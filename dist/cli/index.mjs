#!/usr/bin/env node
import "../chunk-CIESM3BP.mjs";

// src/cli/index.ts
import { Command } from "commander";
import * as path2 from "path";

// src/cli/openapi.ts
import * as fs from "fs";
import * as path from "path";
function generateOpenAPISpec(endpoints, options = {}) {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: options.title || "Symulate Generated API",
      version: options.version || "1.0.0",
      description: options.description || "API specification generated from Symulate endpoint definitions"
    },
    paths: {},
    components: {
      schemas: {}
    }
  };
  if (options.serverUrl) {
    spec.servers = [
      {
        url: options.serverUrl,
        description: "API server"
      }
    ];
  }
  for (const [key, config] of endpoints.entries()) {
    const { path: apiPath, method, schema, mock, errors } = config;
    if (!spec.paths[apiPath]) {
      spec.paths[apiPath] = {};
    }
    const responses = {
      "200": {
        description: "Successful response",
        content: {
          "application/json": {
            schema: schema ? schemaToOpenAPI(schema) : { type: "object" }
          }
        }
      }
    };
    if (errors && errors.length > 0) {
      for (const error of errors) {
        responses[error.code.toString()] = {
          description: error.description || getDefaultErrorDescription(error.code),
          content: {
            "application/json": {
              schema: error.schema ? schemaToOpenAPI(error.schema) : getDefaultErrorSchema()
            }
          }
        };
      }
    } else {
      responses["400"] = {
        description: "Bad request",
        content: {
          "application/json": {
            schema: getDefaultErrorSchema()
          }
        }
      };
      responses["404"] = {
        description: "Not found",
        content: {
          "application/json": {
            schema: getDefaultErrorSchema()
          }
        }
      };
      responses["500"] = {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: getDefaultErrorSchema()
          }
        }
      };
    }
    const operation = {
      summary: `${method} ${apiPath}`,
      description: mock?.instruction || `${method} operation for ${apiPath}`,
      operationId: key.replace(/\s+/g, "_").toLowerCase(),
      tags: [extractTagFromPath(apiPath)],
      responses
    };
    if (config.params && config.params.length > 0) {
      const parameters = [];
      const bodyProperties = {};
      const bodyRequired = [];
      for (const param of config.params) {
        if (param.location === "path" || param.location === "query" || param.location === "header") {
          parameters.push({
            name: param.name,
            in: param.location,
            required: param.required !== false,
            description: param.description || `The ${param.name} parameter`,
            schema: param.schema ? schemaToOpenAPI(param.schema) : { type: "string" },
            ...param.example && { example: param.example }
          });
        } else if (param.location === "body") {
          bodyProperties[param.name] = param.schema ? schemaToOpenAPI(param.schema) : { type: "string" };
          if (param.required !== false) {
            bodyRequired.push(param.name);
          }
        }
      }
      if (parameters.length > 0) {
        operation.parameters = parameters;
      }
      if (Object.keys(bodyProperties).length > 0) {
        operation.requestBody = {
          required: bodyRequired.length > 0,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: bodyProperties,
                required: bodyRequired.length > 0 ? bodyRequired : void 0
              }
            }
          }
        };
      }
    } else {
      const pathParams = apiPath.match(/:(\w+)/g);
      if (pathParams) {
        operation.parameters = pathParams.map((param) => ({
          name: param.substring(1),
          in: "path",
          required: true,
          description: `The ${param.substring(1)} identifier`,
          schema: { type: "string" }
        }));
      }
      if (["POST", "PUT", "PATCH"].includes(method) && schema) {
        operation.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: schemaToOpenAPI(schema)
            }
          }
        };
      }
    }
    spec.paths[apiPath][method.toLowerCase()] = operation;
  }
  return spec;
}
function extractTagFromPath(path3) {
  const segments = path3.split("/").filter((s) => s && !s.startsWith(":"));
  return segments[segments.length - 1] || "default";
}
function schemaToOpenAPI(schema) {
  return convertSchemaToOpenAPI(schema);
}
function convertSchemaToOpenAPI(schema) {
  const schemaType = schema._meta?.schemaType;
  if (!schemaType) {
    return { type: "object" };
  }
  if (schemaType === "object") {
    const objSchema = schema;
    const properties = {};
    const required = [];
    for (const [key, value] of Object.entries(objSchema._shape)) {
      properties[key] = convertSchemaToOpenAPI(value);
      required.push(key);
    }
    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : void 0
    };
  }
  if (schemaType === "array") {
    const arrSchema = schema;
    return {
      type: "array",
      items: convertSchemaToOpenAPI(arrSchema._element)
    };
  }
  return mapTypeToOpenAPI(schemaType);
}
function mapTypeToOpenAPI(schemaType) {
  switch (schemaType) {
    case "uuid":
      return { type: "string", format: "uuid" };
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "date":
      return { type: "string", format: "date-time" };
    case "email":
      return { type: "string", format: "email" };
    case "url":
      return { type: "string", format: "uri" };
    case "phoneNumber":
      return { type: "string", pattern: "^[+]?[(]?[0-9]{1,4}[)]?[-\\s\\./0-9]*$" };
    case "person.fullName":
    case "person.firstName":
    case "person.lastName":
      return { type: "string" };
    case "person.jobTitle":
      return { type: "string" };
    case "internet.userName":
      return { type: "string" };
    case "internet.avatar":
      return { type: "string", format: "uri" };
    case "location.street":
    case "location.city":
    case "location.state":
    case "location.country":
    case "location.zipCode":
      return { type: "string" };
    case "location.latitude":
    case "location.longitude":
      return { type: "string" };
    case "commerce.productName":
    case "commerce.department":
      return { type: "string" };
    case "commerce.price":
      return { type: "number", minimum: 0 };
    case "lorem.word":
    case "lorem.sentence":
    case "lorem.paragraph":
      return { type: "string" };
    case "company.name":
    case "company.catchPhrase":
    case "company.industry":
      return { type: "string" };
    default:
      return { type: "string" };
  }
}
function getDefaultErrorDescription(code) {
  const descriptions = {
    400: "Bad request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not found",
    409: "Conflict",
    422: "Unprocessable entity",
    429: "Too many requests",
    500: "Internal server error",
    502: "Bad gateway",
    503: "Service unavailable",
    504: "Gateway timeout"
  };
  return descriptions[code] || `Error ${code}`;
}
function getDefaultErrorSchema() {
  return {
    type: "object",
    properties: {
      error: {
        type: "object",
        properties: {
          message: { type: "string" },
          code: { type: "string" },
          details: { type: "object" }
        },
        required: ["message"]
      }
    },
    required: ["error"]
  };
}
function saveOpenAPISpec(spec, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), "utf-8");
  console.log(`\u2713 OpenAPI specification generated at: ${outputPath}`);
}

// src/cli/index.ts
var program = new Command();
program.name("mockend").description("Mockend CLI - AI-powered frontend-first development toolkit").version("1.0.0");
program.command("openapi").description("Generate OpenAPI specification from endpoint definitions").option("-o, --output <path>", "Output file path", "./openapi.json").option("-t, --title <title>", "API title", "Mockend Generated API").option("-v, --version <version>", "API version", "1.0.0").option("-d, --description <description>", "API description").option("-s, --server <url>", "Server URL (e.g., https://api.example.com)").action(async (options) => {
  try {
    console.log("Loading endpoint definitions...");
    const { loadEndpoints } = await import("../loadEndpoints-5KRZUBWF.mjs");
    await loadEndpoints();
    const { getRegisteredEndpoints } = await import("../defineEndpoint-3SZPBP6M.mjs");
    const endpoints = getRegisteredEndpoints();
    if (endpoints.size === 0) {
      console.warn("\u26A0 No endpoints found.");
      console.warn("Create a symulate.config.js file to specify your endpoint entry files.");
      process.exit(1);
    }
    console.log(`Found ${endpoints.size} endpoint(s)`);
    const spec = generateOpenAPISpec(endpoints, {
      title: options.title,
      version: options.version,
      description: options.description,
      serverUrl: options.server
    });
    const outputPath = path2.resolve(process.cwd(), options.output);
    saveOpenAPISpec(spec, outputPath);
    console.log("\u2713 Done!");
  } catch (error) {
    console.error("Error generating OpenAPI spec:", error);
    process.exit(1);
  }
});
program.command("cache").description("Inspect cached mock data").option("-l, --list", "List all cached entries").option("-h, --hash <hash>", "Show details for a specific hash").option("-s, --search <pattern>", "Search for entries matching pattern").option("-f, --full", "Show full data instead of preview").option("--remote", "Show Supabase cache instead of local cache").option("-k, --key <api-key>", "Filter by API key ID").action(async (options) => {
  try {
    const {
      getCacheEntries,
      getCacheEntryByHash,
      getCacheEntriesByPattern,
      getSupabaseCacheEntries,
      getSupabaseCacheEntryByHash
    } = await import("../cache-5N5CCHZ2.mjs");
    if (options.hash) {
      let entry;
      entry = await getSupabaseCacheEntryByHash(options.hash, options.key);
      if (!entry) {
        entry = getCacheEntryByHash(options.hash);
      }
      if (!entry) {
        console.log(`\u2717 Cache entry not found: ${options.hash}`);
        process.exit(1);
      }
      console.log(`
\u{1F4E6} Cache Entry: ${options.hash}`);
      console.log(`   Cached: ${new Date(entry.timestamp).toLocaleString()}`);
      console.log(`   Schema Hash: ${entry.schemaHash}`);
      console.log(`
   Data:`);
      console.log(JSON.stringify(entry.template, null, 2));
      return;
    }
    if (options.search) {
      const entries2 = getCacheEntriesByPattern(options.search);
      if (entries2.length === 0) {
        console.log(`\u2717 No cache entries found matching "${options.search}"`);
        return;
      }
      console.log(`
\u{1F50D} Found ${entries2.length} cache entry(ies) matching "${options.search}":
`);
      entries2.forEach((entry, index) => {
        console.log(`  [${index + 1}] Hash: ${entry.hash}`);
        console.log(`      Cached: ${new Date(entry.timestamp).toLocaleString()}`);
        if (options.full) {
          console.log(`      Data:`);
          console.log(`      ${JSON.stringify(entry.fullData, null, 2).split("\n").join("\n      ")}`);
        } else {
          console.log(`      Preview: ${entry.dataPreview}`);
        }
        console.log();
      });
      return;
    }
    let entries = getCacheEntries();
    let supabaseEntries = [];
    if (options.remote) {
      supabaseEntries = await getSupabaseCacheEntries(options.key);
      entries = [];
    } else {
      supabaseEntries = await getSupabaseCacheEntries(options.key);
    }
    const totalLocal = entries.length;
    const totalSupabase = supabaseEntries.length;
    if (totalLocal === 0 && totalSupabase === 0) {
      console.log("\u{1F4CB} No cached data found");
      console.log("\n\u{1F4A1} Tip: Make some API calls to generate cache");
      if (!options.remote) {
        console.log("\u{1F4A1} Run 'npx symulate login' to sync cache to Supabase");
      }
      return;
    }
    if (totalLocal > 0 && !options.remote) {
      console.log(`
\u{1F4C1} Local Cache (${totalLocal} total):
`);
      entries.forEach((entry, index) => {
        console.log(`  [${index + 1}] Hash: ${entry.hash}`);
        console.log(`      Cached: ${new Date(entry.timestamp).toLocaleString()}`);
        console.log(`      Preview: ${entry.dataPreview}`);
        console.log();
      });
    }
    if (totalSupabase > 0) {
      console.log(`
\u2601\uFE0F  Supabase Cache (${totalSupabase} total):
`);
      supabaseEntries.forEach((entry, index) => {
        console.log(`  [${index + 1}] Hash: ${entry.hash}`);
        console.log(`      Cached: ${new Date(entry.timestamp).toLocaleString()}`);
        console.log(`      Preview: ${entry.dataPreview}`);
        console.log();
      });
    }
    console.log("\u{1F4A1} Tips:");
    console.log("   - Use 'npx symulate cache --hash <hash>' to see full data");
    console.log("   - Use 'npx symulate cache --remote' to see only Supabase cache");
    console.log("   - Use 'npx symulate cache --search <pattern>' to filter entries");
    console.log("   - Use 'npx symulate regenerate --hash <hash>' to clear specific entry");
  } catch (error) {
    console.error("Error inspecting cache:", error);
    process.exit(1);
  }
});
program.command("clear-cache").description("Clear the Mockend cache file").option("-k, --key <api-key>", "Filter by API key ID").action(async (options) => {
  try {
    const { clearCache } = await import("../cache-5N5CCHZ2.mjs");
    await clearCache(options.key);
    console.log("\u2713 Cache cleared successfully");
  } catch (error) {
    console.error("Error clearing cache:", error);
    process.exit(1);
  }
});
program.command("regenerate").description("Regenerate mock data by clearing the cache").option("-e, --endpoint <pattern>", "Clear cache for endpoints matching this pattern").option("-p, --preview", "Preview cached endpoints without clearing").option("-h, --hash <hash>", "Clear cache for a specific hash").option("-k, --key <api-key>", "Filter by API key ID").action(async (options) => {
  try {
    const { clearCache, clearCacheByHash, clearCacheByPattern, getCacheEntries } = await import("../cache-5N5CCHZ2.mjs");
    if (options.preview) {
      console.log("\u{1F4CB} Cached Endpoints:");
      const entries = getCacheEntries();
      if (entries.length === 0) {
        console.log("  No cached data found");
        return;
      }
      entries.forEach((entry, index) => {
        console.log(`
  [${index + 1}] Hash: ${entry.hash}`);
        console.log(`      Cached: ${new Date(entry.timestamp).toLocaleString()}`);
        console.log(`      Preview: ${entry.dataPreview}`);
      });
      console.log(`
  Total: ${entries.length} cached endpoint(s)`);
      console.log("\n\u{1F4A1} Tip: Run 'npx symulate regenerate' to clear all cache");
      console.log("        Run 'npx symulate regenerate --hash <hash>' to clear specific entry");
      return;
    }
    if (options.hash) {
      const cleared = await clearCacheByHash(options.hash, options.key);
      if (cleared) {
        console.log("\u2713 Cache entry cleared. Mock data will regenerate on next request.");
      } else {
        console.log("\u2717 Cache entry not found");
        process.exit(1);
      }
      return;
    }
    if (options.endpoint) {
      const count = clearCacheByPattern(options.endpoint);
      if (count > 0) {
        console.log(`\u2713 Cleared ${count} cache entry(ies). Mock data will regenerate on next request.`);
      } else {
        console.log(`\u2717 No cache entries found matching "${options.endpoint}"`);
        process.exit(1);
      }
      return;
    }
    await clearCache(options.key);
    console.log("\u2713 All cache cleared successfully");
    console.log("\u{1F4A1} Mock data will regenerate on next request");
  } catch (error) {
    console.error("Error regenerating cache:", error);
    process.exit(1);
  }
});
program.command("login").description("Authenticate with Mockend Platform").action(async () => {
  try {
    const { login } = await import("../auth-HWNKRZII.mjs");
    const success = await login();
    if (!success) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Error during login:", error);
    process.exit(1);
  }
});
program.command("logout").description("Clear your Mockend Platform session").action(async () => {
  try {
    const { logout } = await import("../auth-HWNKRZII.mjs");
    logout();
  } catch (error) {
    console.error("Error during logout:", error);
    process.exit(1);
  }
});
program.command("whoami").description("Show information about the current authenticated user").action(async () => {
  try {
    const { whoami } = await import("../auth-HWNKRZII.mjs");
    whoami();
  } catch (error) {
    console.error("Error getting user info:", error);
    process.exit(1);
  }
});
program.command("api-keys").description("List all API keys for the authenticated user").action(async () => {
  try {
    const { getApiKeys, displayApiKeys } = await import("../apiKeys-7ZGZNSCI.mjs");
    const keys = await getApiKeys();
    displayApiKeys(keys);
  } catch (error) {
    console.error("Error getting API keys:", error);
    process.exit(1);
  }
});
var orgsCommand = program.command("orgs").description("Manage organizations");
orgsCommand.command("list").description("List all organizations you belong to").action(async () => {
  try {
    const {
      getUserOrganizations,
      displayOrganizations
    } = await import("../organizations-YRL5ZKGE.mjs");
    const { getCurrentContext } = await import("../auth-HWNKRZII.mjs");
    const orgs = await getUserOrganizations();
    const { orgId } = getCurrentContext();
    displayOrganizations(orgs, orgId);
  } catch (error) {
    console.error("Error listing organizations:", error);
    process.exit(1);
  }
});
orgsCommand.command("use <org-identifier>").description("Switch to a different organization (accepts org ID or slug)").action(async (orgIdentifier) => {
  try {
    const { setCurrentOrganization } = await import("../auth-HWNKRZII.mjs");
    const { getUserOrganizations } = await import("../organizations-YRL5ZKGE.mjs");
    const orgs = await getUserOrganizations();
    const org = orgs.find((o) => o.id === orgIdentifier || o.slug === orgIdentifier);
    if (!org) {
      console.error(
        `[Symulate] Organization not found: ${orgIdentifier}`
      );
      console.log(
        "[Symulate] Run 'npx symulate orgs list' to see available organizations"
      );
      process.exit(1);
    }
    setCurrentOrganization(org.id);
  } catch (error) {
    console.error("Error switching organization:", error);
    process.exit(1);
  }
});
var projectsCommand = program.command("projects").description("Manage projects in the current organization");
projectsCommand.command("list").description("List all projects in the current organization").action(async () => {
  try {
    const {
      getOrganizationProjects,
      displayProjects
    } = await import("../organizations-YRL5ZKGE.mjs");
    const { getCurrentContext } = await import("../auth-HWNKRZII.mjs");
    const { orgId, projectId } = getCurrentContext();
    if (!orgId) {
      console.error(
        "[Symulate] No organization selected. Please select an organization first."
      );
      console.log("[Symulate] Run 'npx symulate orgs list' to see available organizations");
      console.log("[Symulate] Then run 'npx symulate orgs use <org-id>' to select one");
      process.exit(1);
    }
    const projects = await getOrganizationProjects(orgId);
    displayProjects(projects, projectId);
  } catch (error) {
    console.error("Error listing projects:", error);
    process.exit(1);
  }
});
projectsCommand.command("use <project-identifier>").description("Switch to a different project (accepts project ID or slug)").action(async (projectIdentifier) => {
  try {
    const { setCurrentProject, getCurrentContext } = await import("../auth-HWNKRZII.mjs");
    const { getOrganizationProjects } = await import("../organizations-YRL5ZKGE.mjs");
    const { orgId } = getCurrentContext();
    if (!orgId) {
      console.error(
        "[Symulate] No organization selected. Please select an organization first."
      );
      console.log("[Symulate] Run 'npx symulate orgs use <org-identifier>' to select one");
      process.exit(1);
    }
    const projects = await getOrganizationProjects(orgId);
    const project = projects.find(
      (p) => p.id === projectIdentifier || p.slug === projectIdentifier
    );
    if (!project) {
      console.error(`[Symulate] Project not found: ${projectIdentifier}`);
      console.log(
        "[Symulate] Run 'npx symulate projects list' to see available projects"
      );
      process.exit(1);
    }
    setCurrentProject(project.id);
  } catch (error) {
    console.error("Error switching project:", error);
    process.exit(1);
  }
});
program.command("sync").description("Sync local endpoint definitions to Mockend Platform").action(async () => {
  try {
    const { syncEndpoints } = await import("../sync-WEOOY5KE.mjs");
    await syncEndpoints();
  } catch (error) {
    console.error("Error syncing endpoints:", error);
    process.exit(1);
  }
});
program.parse();
