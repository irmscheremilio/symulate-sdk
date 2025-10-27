"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/env.ts
var IS_NODE, NODE_ENV, IS_DEBUG;
var init_env = __esm({
  "src/env.ts"() {
    "use strict";
    IS_NODE = typeof process !== "undefined" && typeof process.env !== "undefined";
    NODE_ENV = IS_NODE && process.env.NODE_ENV === "production" ? "production" : "development";
    IS_DEBUG = IS_NODE && (process.env.MOCKEND_DEBUG === "true" || process.env.MOCKEND_DEBUG === "1");
  }
});

// src/config.ts
var config_exports = {};
__export(config_exports, {
  clearQuotaState: () => clearQuotaState,
  configureSymulate: () => configureSymulate,
  getConfig: () => getConfig,
  isDevelopment: () => isDevelopment,
  isProduction: () => isProduction,
  isQuotaExceeded: () => isQuotaExceeded,
  markQuotaExceeded: () => markQuotaExceeded,
  updateQuotaStatus: () => updateQuotaStatus
});
function configureSymulate(config) {
  globalConfig = { ...globalConfig, ...config };
}
function getConfig() {
  return globalConfig;
}
function isDevelopment() {
  return globalConfig.environment === "development";
}
function isProduction() {
  return globalConfig.environment === "production";
}
function isQuotaExceeded(apiKey) {
  const state = quotaState.get(apiKey);
  if (!state) return false;
  const now = Date.now();
  if (state.quotaExceeded && now - state.lastChecked < QUOTA_CHECK_INTERVAL) {
    console.log(`[Symulate] \u{1F4A1} Quota exceeded (checked ${Math.round((now - state.lastChecked) / 1e3)}s ago). Using Faker.js mode.`);
    console.log(`[Symulate] \u{1F4A1} Will retry AI mode in ${Math.round((QUOTA_CHECK_INTERVAL - (now - state.lastChecked)) / 1e3)}s`);
    return true;
  }
  return false;
}
function markQuotaExceeded(apiKey, tokensUsed, tokensLimit) {
  quotaState.set(apiKey, {
    quotaExceeded: true,
    lastChecked: Date.now(),
    tokensRemaining: 0,
    tokensLimit
  });
  console.log(`[Symulate] \u26A0\uFE0F  Quota exceeded: ${tokensUsed || "?"}/${tokensLimit || "?"} tokens used this month`);
  console.log(`[Symulate] \u{1F4A1} Automatically switched to Faker.js mode (unlimited, free)`);
  console.log(`[Symulate] \u{1F4A1} Upgrade at https://platform.symulate.dev/pricing for more AI tokens`);
}
function updateQuotaStatus(apiKey, tokensRemaining, tokensLimit) {
  const now = Date.now();
  const percentRemaining = tokensRemaining / tokensLimit * 100;
  if (percentRemaining < 10 && percentRemaining > 0) {
    console.warn(`[Symulate] \u26A0\uFE0F  Low quota: ${tokensRemaining}/${tokensLimit} tokens remaining (${percentRemaining.toFixed(1)}%)`);
    console.log(`[Symulate] \u{1F4A1} Upgrade at https://platform.symulate.dev/pricing to avoid hitting limits`);
  }
  quotaState.set(apiKey, {
    quotaExceeded: false,
    lastChecked: now,
    tokensRemaining,
    tokensLimit
  });
}
function clearQuotaState(apiKey) {
  if (apiKey) {
    quotaState.delete(apiKey);
    console.log(`[Symulate] \u2713 Quota state cleared for API key`);
  } else {
    quotaState.clear();
    console.log(`[Symulate] \u2713 All quota state cleared`);
  }
}
var globalConfig, quotaState, QUOTA_CHECK_INTERVAL;
var init_config = __esm({
  "src/config.ts"() {
    "use strict";
    init_env();
    globalConfig = {
      environment: NODE_ENV,
      cacheEnabled: true,
      generateMode: "auto"
      // Default: try AI first, fallback to Faker.js
    };
    quotaState = /* @__PURE__ */ new Map();
    QUOTA_CHECK_INTERVAL = 6e4;
  }
});

// src/platformConfig.ts
var PLATFORM_CONFIG;
var init_platformConfig = __esm({
  "src/platformConfig.ts"() {
    "use strict";
    PLATFORM_CONFIG = {
      // Platform URLs
      platformUrl: "http://localhost:3000",
      // Supabase configuration
      supabase: {
        url: "https://ptrjfelueuglvsdsqzok.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cmpmZWx1ZXVnbHZzZHNxem9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjcyMDQsImV4cCI6MjA3NjMwMzIwNH0.pNF6fk1tC03xrsmp2r4e5uouvqOQgRFcj4BbsTI8TnU"
      },
      // API endpoints
      api: {
        authPoll: "https://ptrjfelueuglvsdsqzok.supabase.co/functions/v1/auth-poll",
        rest: "https://ptrjfelueuglvsdsqzok.supabase.co/rest/v1"
      }
    };
  }
});

// src/auth.ts
var auth_exports = {};
__export(auth_exports, {
  clearAuthSession: () => clearAuthSession,
  getAuthSession: () => getAuthSession,
  getAuthSessionWithRefresh: () => getAuthSessionWithRefresh,
  getCurrentContext: () => getCurrentContext,
  login: () => login,
  logout: () => logout,
  saveAuthSession: () => saveAuthSession,
  setCurrentOrganization: () => setCurrentOrganization,
  setCurrentProject: () => setCurrentProject,
  whoami: () => whoami
});
function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}
function ensureAuthDir() {
  if (!fs.existsSync(AUTH_CONFIG_DIR)) {
    fs.mkdirSync(AUTH_CONFIG_DIR, { recursive: true });
  }
}
function isJwtExpired(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true;
    }
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    if (payload.exp) {
      return payload.exp * 1e3 < Date.now();
    }
    return true;
  } catch (error) {
    return true;
  }
}
async function refreshAccessToken(session) {
  try {
    const pollUrl = PLATFORM_CONFIG.api.authPoll;
    const response = await fetch(pollUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`
      },
      body: JSON.stringify({ sessionToken: session.sessionToken })
    });
    if (response.ok) {
      const data = await response.json();
      if (data.authenticated && data.accessToken) {
        return data.accessToken;
      }
    }
    return null;
  } catch (error) {
    console.error("[Symulate] Failed to refresh access token:", error);
    return null;
  }
}
function getAuthSession() {
  try {
    if (!fs.existsSync(AUTH_CONFIG_FILE)) {
      return null;
    }
    const content = fs.readFileSync(AUTH_CONFIG_FILE, "utf-8");
    const session = JSON.parse(content);
    if (session.expiresAt && session.expiresAt < Date.now()) {
      console.log("[Symulate] Session expired. Please run 'npx symulate login'");
      return null;
    }
    if (session.accessToken && isJwtExpired(session.accessToken)) {
      console.log("[Symulate] Access token expired, refreshing...");
      console.log("[Symulate] Please run 'npx symulate login' to refresh your session");
      return null;
    }
    return session;
  } catch (error) {
    console.warn("[Symulate] Failed to read auth session:", error);
    return null;
  }
}
async function getAuthSessionWithRefresh() {
  try {
    if (!fs.existsSync(AUTH_CONFIG_FILE)) {
      return null;
    }
    const content = fs.readFileSync(AUTH_CONFIG_FILE, "utf-8");
    const session = JSON.parse(content);
    if (session.expiresAt && session.expiresAt < Date.now()) {
      console.log("[Symulate] Session expired. Please run 'npx symulate login'");
      return null;
    }
    if (session.accessToken && isJwtExpired(session.accessToken)) {
      console.log("[Symulate] Access token expired, refreshing...");
      const newAccessToken = await refreshAccessToken(session);
      if (newAccessToken) {
        session.accessToken = newAccessToken;
        saveAuthSession(session);
        console.log("[Symulate] \u2713 Access token refreshed");
        return session;
      } else {
        console.log("[Symulate] Failed to refresh token. Please run 'npx symulate login'");
        return null;
      }
    }
    return session;
  } catch (error) {
    console.warn("[Symulate] Failed to read auth session:", error);
    return null;
  }
}
function saveAuthSession(session) {
  try {
    ensureAuthDir();
    fs.writeFileSync(AUTH_CONFIG_FILE, JSON.stringify(session, null, 2), "utf-8");
    console.log("[Symulate] \u2713 Session saved");
  } catch (error) {
    console.error("[Symulate] Failed to save auth session:", error);
    throw error;
  }
}
function clearAuthSession() {
  try {
    if (fs.existsSync(AUTH_CONFIG_FILE)) {
      fs.unlinkSync(AUTH_CONFIG_FILE);
      console.log("[Symulate] \u2713 Session cleared");
    }
  } catch (error) {
    console.warn("[Symulate] Failed to clear auth session:", error);
  }
}
function getPreviousContext() {
  try {
    if (!fs.existsSync(AUTH_CONFIG_FILE)) {
      return {};
    }
    const content = fs.readFileSync(AUTH_CONFIG_FILE, "utf-8");
    const session = JSON.parse(content);
    return {
      orgId: session.currentOrgId,
      projectId: session.currentProjectId
    };
  } catch (error) {
    return {};
  }
}
async function pollAuthStatus(sessionToken, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const pollUrl = PLATFORM_CONFIG.api.authPoll;
      const response = await fetch(pollUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": PLATFORM_CONFIG.supabase.anonKey,
          "Authorization": `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`
        },
        body: JSON.stringify({ sessionToken })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          const previousContext = getPreviousContext();
          return {
            sessionToken,
            userId: data.userId,
            email: data.email,
            expiresAt: data.expiresAt,
            accessToken: data.accessToken,
            // Prioritize: 1) previous session context, 2) server defaults, 3) undefined
            currentOrgId: previousContext.orgId || data.defaultOrgId,
            currentProjectId: previousContext.projectId || data.defaultProjectId
          };
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 2e3));
    } catch (error) {
      console.error("[Symulate] Polling error:", error);
    }
  }
  return null;
}
async function createSessionRecord(sessionToken) {
  try {
    const response = await fetch(`${PLATFORM_CONFIG.api.rest}/cli_sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        session_token: sessionToken,
        authenticated: false,
        user_id: null
      })
    });
    if (!response.ok) {
      console.error("[Symulate] Failed to create session. Please try again.");
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Symulate] Error creating session. Please try again.");
    return false;
  }
}
async function login() {
  const sessionToken = generateSessionToken();
  console.log("[Symulate] Creating session...");
  const sessionCreated = await createSessionRecord(sessionToken);
  if (!sessionCreated) {
    console.error("[Symulate] \u2717 Failed to create session. Please try again.");
    return false;
  }
  const authUrl = `${PLATFORM_CONFIG.platformUrl}/auth/cli?token=${sessionToken}`;
  console.log("\n[Symulate] Opening browser for authentication...");
  console.log(`If the browser doesn't open automatically, visit:
  ${authUrl}
`);
  try {
    const open = await import("open");
    await open.default(authUrl);
  } catch (error) {
    console.warn("[Symulate] Could not open browser automatically");
  }
  console.log("[Symulate] Waiting for authentication...");
  console.log("[Symulate] (This may take up to 2 minutes)\n");
  const session = await pollAuthStatus(sessionToken);
  if (session) {
    saveAuthSession(session);
    console.log(`
[Symulate] \u2713 Successfully authenticated as ${session.email}`);
    if (session.currentOrgId && session.currentProjectId) {
      console.log(`[Symulate] \u2713 Auto-selected organization and project`);
      console.log(`[Symulate]   Organization ID: ${session.currentOrgId}`);
      console.log(`[Symulate]   Project ID: ${session.currentProjectId}`);
      console.log(`
[Symulate] \u{1F4A1} Tip: You can switch organizations or projects anytime:`);
      console.log(`[Symulate]   \u2022 npx symulate orgs list`);
      console.log(`[Symulate]   \u2022 npx symulate projects list`);
    } else if (session.currentOrgId) {
      console.log(`[Symulate] \u2713 Auto-selected organization: ${session.currentOrgId}`);
      console.log(`[Symulate] \u26A0\uFE0F  No projects found. Create one at https://platform.symulate.dev/dashboard/projects`);
    } else {
      console.log(`[Symulate] \u26A0\uFE0F  No organizations found. One should be created automatically.`);
      console.log(`[Symulate]   Visit https://platform.symulate.dev/dashboard to set up your account`);
    }
    return true;
  } else {
    console.log("\n[Symulate] \u2717 Authentication timed out or failed");
    console.log("[Symulate] Please try again with 'npx symulate login'");
    return false;
  }
}
function logout() {
  clearAuthSession();
  console.log("[Symulate] \u2713 Logged out successfully");
}
async function whoami() {
  const session = getAuthSession();
  if (!session) {
    console.log("[Symulate] Not authenticated");
    console.log("[Symulate] Run 'npx symulate login' to authenticate");
    return;
  }
  console.log("\n[Symulate] Current User:");
  console.log(`  Email: ${session.email}`);
  console.log(`  User ID: ${session.userId}`);
  if (session.currentOrgId) {
    try {
      const authHeader = session.accessToken ? `Bearer ${session.accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
      const orgResponse = await fetch(
        `${PLATFORM_CONFIG.api.rest}/organizations?id=eq.${session.currentOrgId}&select=name,slug`,
        {
          headers: {
            apikey: PLATFORM_CONFIG.supabase.anonKey,
            Authorization: authHeader,
            "Content-Type": "application/json"
          }
        }
      );
      if (orgResponse.ok) {
        const orgs = await orgResponse.json();
        if (orgs.length > 0) {
          const org = orgs[0];
          console.log(`  Current Organization: ${org.name} (${org.slug})`);
          console.log(`    ID: ${session.currentOrgId}`);
        } else {
          console.log(`  Current Organization: ${session.currentOrgId}`);
        }
      } else {
        console.log(`  Current Organization: ${session.currentOrgId}`);
      }
    } catch (error) {
      console.log(`  Current Organization: ${session.currentOrgId}`);
    }
  }
  if (session.currentProjectId) {
    try {
      const authHeader = session.accessToken ? `Bearer ${session.accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
      const projectResponse = await fetch(
        `${PLATFORM_CONFIG.api.rest}/projects?id=eq.${session.currentProjectId}&select=name,slug`,
        {
          headers: {
            apikey: PLATFORM_CONFIG.supabase.anonKey,
            Authorization: authHeader,
            "Content-Type": "application/json"
          }
        }
      );
      if (projectResponse.ok) {
        const projects = await projectResponse.json();
        if (projects.length > 0) {
          const project = projects[0];
          console.log(`  Current Project: ${project.name} (${project.slug})`);
          console.log(`    ID: ${session.currentProjectId}`);
        } else {
          console.log(`  Current Project: ${session.currentProjectId}`);
        }
      } else {
        console.log(`  Current Project: ${session.currentProjectId}`);
      }
    } catch (error) {
      console.log(`  Current Project: ${session.currentProjectId}`);
    }
  }
  console.log(`  Expires: ${new Date(session.expiresAt).toLocaleString()}`);
  console.log();
}
function getCurrentContext() {
  const session = getAuthSession();
  if (!session) {
    return {};
  }
  return {
    orgId: session.currentOrgId,
    projectId: session.currentProjectId
  };
}
function setCurrentOrganization(orgId) {
  const session = getAuthSession();
  if (!session) {
    console.error("[Symulate] No active session. Please login first.");
    return;
  }
  session.currentOrgId = orgId;
  session.currentProjectId = void 0;
  saveAuthSession(session);
  console.log(`[Symulate] \u2713 Switched to organization: ${orgId}`);
}
function setCurrentProject(projectId) {
  const session = getAuthSession();
  if (!session) {
    console.error("[Symulate] No active session. Please login first.");
    return;
  }
  if (!session.currentOrgId) {
    console.error(
      "[Symulate] No organization selected. Please select an organization first."
    );
    return;
  }
  session.currentProjectId = projectId;
  saveAuthSession(session);
  console.log(`[Symulate] \u2713 Switched to project: ${projectId}`);
}
var crypto, fs, path, os, AUTH_CONFIG_DIR, AUTH_CONFIG_FILE;
var init_auth = __esm({
  "src/auth.ts"() {
    "use strict";
    crypto = __toESM(require("crypto"));
    fs = __toESM(require("fs"));
    path = __toESM(require("path"));
    os = __toESM(require("os"));
    init_platformConfig();
    AUTH_CONFIG_DIR = path.join(os.homedir(), ".symulate");
    AUTH_CONFIG_FILE = path.join(AUTH_CONFIG_DIR, "auth.json");
  }
});

// src/index.ts
var index_exports = {};
__export(index_exports, {
  TypeValidationError: () => TypeValidationError,
  clearCache: () => clearCache,
  clearQuotaState: () => clearQuotaState,
  configureSymulate: () => configureSymulate,
  debugCache: () => debugCache,
  defineEndpoint: () => defineEndpoint,
  getConfig: () => getConfig,
  getRegisteredEndpoints: () => getRegisteredEndpoints,
  isDevelopment: () => isDevelopment,
  isProduction: () => isProduction,
  m: () => m
});
module.exports = __toCommonJS(index_exports);

// src/defineEndpoint.ts
init_config();

// src/cache.ts
init_config();
init_platformConfig();
function getAuthSession2() {
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
var CACHE_FILE = ".symulate-cache.json";
var LOCALSTORAGE_KEY = "symulate-cache";
var isBrowser = typeof globalThis !== "undefined" && typeof globalThis.window !== "undefined";
var isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;
var memoryCache = {};
async function getSupabaseCacheEntry(schemaHash, userId, accessToken, apiKeyId, projectId) {
  try {
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
    let url = `${PLATFORM_CONFIG.api.rest}/mockend_cache?schema_hash=eq.${schemaHash}`;
    if (projectId) {
      url += `&project_id=eq.${projectId}`;
    } else {
      url += `&or=(user_id.eq.${userId},user_id.is.null)`;
    }
    if (apiKeyId) {
      url += `&api_key_id=eq.${apiKeyId}`;
    }
    url += `&select=*&limit=1`;
    const response = await fetch(
      url,
      {
        headers: {
          "apikey": PLATFORM_CONFIG.supabase.anonKey,
          "Authorization": authHeader,
          "Content-Type": "application/json"
        }
      }
    );
    if (!response.ok) {
      console.warn("[Symulate] Failed to fetch from Supabase cache:", response.statusText);
      return null;
    }
    const data = await response.json();
    if (data && data.length > 0) {
      const entry = data[0];
      incrementHitCount(entry.id, accessToken).catch(
        (err) => console.warn("[Symulate] Failed to increment hit count:", err)
      );
      return {
        template: entry.template,
        timestamp: new Date(entry.created_at).getTime(),
        schemaHash: entry.schema_hash
      };
    }
    return null;
  } catch (error) {
    console.warn("[Symulate] Error fetching from Supabase cache:", error);
    return null;
  }
}
async function incrementHitCount(cacheId, accessToken) {
  try {
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
    const response = await fetch(`${PLATFORM_CONFIG.api.rest}/rpc/increment_cache_hit_count`, {
      method: "POST",
      headers: {
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": authHeader,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ cache_id: cacheId })
    });
    if (!response.ok) {
      console.warn("[Symulate] Failed to increment hit count");
    }
  } catch (error) {
    console.warn("[Symulate] Error incrementing hit count:", error);
  }
}
async function setSupabaseCacheEntry(schemaHash, template, userId, apiKeyId, accessToken, projectId) {
  try {
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
    const payload = {
      schema_hash: schemaHash,
      template,
      user_id: userId,
      schema: {}
      // We don't store the full schema for now
    };
    if (apiKeyId) {
      payload.api_key_id = apiKeyId;
    }
    if (projectId) {
      payload.project_id = projectId;
    }
    const response = await fetch(`${PLATFORM_CONFIG.api.rest}/mockend_cache`, {
      method: "POST",
      headers: {
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      console.warn("[Symulate] Failed to write to Supabase cache");
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Symulate] Error writing to Supabase cache:", error);
    return false;
  }
}
async function clearSupabaseCache(userId, accessToken, apiKeyId, projectId) {
  try {
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
    let url = `${PLATFORM_CONFIG.api.rest}/mockend_cache?user_id=eq.${userId}`;
    if (apiKeyId) {
      url += `&api_key_id=eq.${apiKeyId}`;
    }
    if (projectId) {
      url += `&project_id=eq.${projectId}`;
    }
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": authHeader,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      console.warn("[Symulate] Failed to clear Supabase cache");
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Symulate] Error clearing Supabase cache:", error);
    return false;
  }
}
function computeSchemaHash(schema) {
  const sortKeys = (obj) => {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(sortKeys);
    }
    const sorted = {};
    Object.keys(obj).sort().forEach((key) => {
      sorted[key] = sortKeys(obj[key]);
    });
    return sorted;
  };
  const schemaString = JSON.stringify(sortKeys(schema));
  let hash = 0;
  for (let i = 0; i < schemaString.length; i++) {
    const char = schemaString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
function getCacheFilePath() {
  if (isBrowser) {
    return CACHE_FILE;
  }
  const path2 = require("path");
  return path2.join(process.cwd(), CACHE_FILE);
}
function readCache() {
  const config = getConfig();
  if (isBrowser && config.persistentCache) {
    try {
      const stored = globalThis.localStorage?.getItem(LOCALSTORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return {};
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return {};
    }
  }
  if (isBrowser) {
    return memoryCache;
  }
  try {
    const fs2 = require("fs");
    const cachePath = getCacheFilePath();
    if (!fs2.existsSync(cachePath)) {
      return {};
    }
    const content = fs2.readFileSync(cachePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.warn("Failed to read cache:", error);
    return {};
  }
}
function writeCache(cache) {
  const config = getConfig();
  if (isBrowser && config.persistentCache) {
    try {
      globalThis.localStorage?.setItem(LOCALSTORAGE_KEY, JSON.stringify(cache));
      return;
    } catch (error) {
      console.warn("Failed to write to localStorage:", error);
      memoryCache = cache;
      return;
    }
  }
  if (isBrowser) {
    memoryCache = cache;
    return;
  }
  try {
    const fs2 = require("fs");
    const cachePath = getCacheFilePath();
    fs2.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf-8");
  } catch (error) {
    console.warn("Failed to write cache:", error);
  }
}
async function getCachedTemplate(schemaHash, apiKeyId) {
  if (isNode) {
    try {
      const session = getAuthSession2();
      if (session && session.userId) {
        const projectId = session.currentProjectId;
        const supabaseEntry = await getSupabaseCacheEntry(schemaHash, session.userId, session.accessToken, apiKeyId, projectId);
        if (supabaseEntry) {
          console.log("[Symulate] Cache hit from Supabase");
          return supabaseEntry;
        }
      }
    } catch (error) {
      console.warn("[Symulate] Failed to check Supabase cache, falling back to local:", error);
    }
  }
  const cache = readCache();
  return cache[schemaHash] || null;
}
async function setCachedTemplate(schemaHash, template) {
  const cache = readCache();
  cache[schemaHash] = {
    template,
    timestamp: Date.now(),
    schemaHash
  };
  writeCache(cache);
  if (isNode) {
    try {
      const session = getAuthSession2();
      if (session && session.userId) {
        const projectId = session.currentProjectId;
        const success = await setSupabaseCacheEntry(schemaHash, template, session.userId, void 0, session.accessToken, projectId);
        if (success) {
          console.log("[Symulate] Cache saved to Supabase");
        }
      }
    } catch (error) {
      console.warn("[Symulate] Failed to write to Supabase cache:", error);
    }
  }
}
async function clearCache(apiKeyId) {
  console.log("[Symulate] Clearing all cache...");
  if (isBrowser) {
    memoryCache = {};
    try {
      globalThis.localStorage?.removeItem(LOCALSTORAGE_KEY);
      console.log("[Symulate] \u2713 Cache cleared from memory and localStorage");
    } catch (error) {
      console.warn("Failed to clear localStorage cache:", error);
    }
    return;
  }
  try {
    const fs2 = require("fs");
    const cachePath = getCacheFilePath();
    if (fs2.existsSync(cachePath)) {
      fs2.unlinkSync(cachePath);
      console.log("[Symulate] \u2713 Cache file deleted:", cachePath);
    } else {
      console.log("[Symulate] No cache file to delete");
    }
    const session = getAuthSession2();
    if (session && session.userId) {
      const projectId = session.currentProjectId;
      if (!projectId) {
        console.warn("[Symulate] \u26A0\uFE0F  No project selected. Cache will only be cleared for user-owned entries.");
        console.log("[Symulate] Run 'npx symulate projects list' and 'npx symulate projects use <project-id>' to select a project.");
      } else {
        console.log(`[Symulate] Clearing cache for project: ${projectId}`);
      }
      const success = await clearSupabaseCache(session.userId, session.accessToken, apiKeyId, projectId);
      if (success) {
        console.log("[Symulate] \u2713 Supabase cache cleared");
      } else {
        console.warn("[Symulate] \u2717 Failed to clear Supabase cache");
      }
    } else {
      console.log("[Symulate] Not authenticated - Supabase cache not cleared");
      console.log("[Symulate] Run 'npx symulate login' to clear cloud cache");
    }
  } catch (error) {
    console.warn("Failed to clear cache:", error);
  }
}
function debugCache() {
  const cache = readCache();
  const entries = Object.keys(cache).length;
  console.log(`[Symulate] Cache contains ${entries} entries:`);
  for (const [hash, entry] of Object.entries(cache)) {
    console.log(`  - Hash: ${hash}`);
    console.log(`    Timestamp: ${new Date(entry.timestamp).toLocaleString()}`);
    console.log(`    Data preview:`, JSON.stringify(entry.template).slice(0, 100) + "...");
  }
  if (entries === 0) {
    console.log("[Symulate] Cache is empty");
  }
}

// src/aiProvider.ts
init_config();
var PLATFORM_API_URL = "https://ptrjfelueuglvsdsqzok.supabase.co/functions/v1/symulate";
function getAuthSession3() {
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
    const session = getAuthSession3();
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
        const { markQuotaExceeded: markQuotaExceeded2 } = (init_config(), __toCommonJS(config_exports));
        markQuotaExceeded2(
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
      const { updateQuotaStatus: updateQuotaStatus2 } = (init_config(), __toCommonJS(config_exports));
      updateQuotaStatus2(apiKey, parseInt(tokensRemaining), parseInt(tokensLimit));
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
var import_faker = require("@faker-js/faker");
init_config();
function generateWithFaker(schema, count = 1) {
  const config = getConfig();
  if (config.fakerSeed !== void 0) {
    import_faker.faker.seed(config.fakerSeed);
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
    const arrayLength = import_faker.faker.number.int({ min: 3, max: 5 });
    return Array.from({ length: arrayLength }, () => generateSingleValue(arrSchema._element));
  }
  switch (schemaType) {
    case "uuid":
      return import_faker.faker.string.uuid();
    case "string":
      return import_faker.faker.lorem.word();
    case "number":
      return import_faker.faker.number.int({ min: 1, max: 1e3 });
    case "boolean":
      return import_faker.faker.datatype.boolean();
    case "date":
      return import_faker.faker.date.recent().toISOString();
    case "email":
      return import_faker.faker.internet.email();
    case "url":
      return import_faker.faker.internet.url();
    case "phoneNumber":
      return import_faker.faker.phone.number();
    // Person fields
    case "person.fullName":
      return import_faker.faker.person.fullName();
    case "person.firstName":
      return import_faker.faker.person.firstName();
    case "person.lastName":
      return import_faker.faker.person.lastName();
    case "person.jobTitle":
      return import_faker.faker.person.jobTitle();
    // Internet fields
    case "internet.userName":
      return import_faker.faker.internet.userName();
    case "internet.avatar":
      return import_faker.faker.image.avatar();
    // Location fields
    case "location.street":
      return import_faker.faker.location.streetAddress();
    case "location.city":
      return import_faker.faker.location.city();
    case "location.state":
      return import_faker.faker.location.state();
    case "location.zipCode":
      return import_faker.faker.location.zipCode();
    case "location.country":
      return import_faker.faker.location.country();
    case "location.latitude":
      return import_faker.faker.location.latitude().toString();
    case "location.longitude":
      return import_faker.faker.location.longitude().toString();
    // Commerce fields
    case "commerce.productName":
      return import_faker.faker.commerce.productName();
    case "commerce.department":
      return import_faker.faker.commerce.department();
    case "commerce.price":
      return parseFloat(import_faker.faker.commerce.price());
    // Lorem fields
    case "lorem.word":
      return import_faker.faker.lorem.word();
    case "lorem.sentence":
      return import_faker.faker.lorem.sentence();
    case "lorem.paragraph":
      return import_faker.faker.lorem.paragraph();
    default:
      return import_faker.faker.lorem.word();
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
  const globalConfig2 = getConfig();
  const failNowError = config.errors?.find((error) => error.failNow === true);
  if (failNowError) {
    console.log(`[Symulate] \u26A0\uFE0F Simulating error response (${failNowError.code}) due to failNow flag`);
    let errorData;
    if (failNowError.schema) {
      const generateMode2 = globalConfig2.generateMode || "auto";
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
  if (!globalConfig2.symulateApiKey) {
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
  const generateMode = globalConfig2.generateMode || "auto";
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
  const regenerateOnConfigChange = globalConfig2.regenerateOnConfigChange !== false;
  if (regenerateOnConfigChange) {
    schemaForHash.method = config.method;
    schemaForHash.mockDelay = config.mock?.delay;
  }
  const schemaHash = computeSchemaHash(schemaForHash);
  console.log("[Symulate] Schema hash:", schemaHash);
  console.log("[Symulate] Generate mode:", generateMode);
  console.log("[Symulate] Schema for hash:", JSON.stringify(schemaForHash, null, 2));
  if (globalConfig2.cacheEnabled) {
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
    if (globalConfig2.cacheEnabled) {
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
      if (globalConfig2.cacheEnabled) {
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
    const { isQuotaExceeded: isQuotaExceeded2 } = await Promise.resolve().then(() => (init_config(), config_exports));
    const apiKey = globalConfig2.symulateApiKey;
    if (apiKey && isQuotaExceeded2(apiKey)) {
      console.log(`[Symulate] Generating mock data with Faker.js (quota exceeded) for ${config.path}...`);
      generatedData = generateWithFaker(config.schema, count);
      trackUsage({
        endpoint: config.path,
        mode: "faker",
        cached: false
      });
      if (globalConfig2.cacheEnabled) {
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
      if (globalConfig2.cacheEnabled) {
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
      if (globalConfig2.cacheEnabled) {
        await setCachedTemplate(schemaHash, generatedData);
        console.log(`[Symulate] \u2713 Cached Faker.js data for ${config.path} (hash: ${schemaHash})`);
      }
      return generatedData;
    }
  }
  throw new Error(`[Symulate] Invalid generateMode: ${generateMode}`);
}
async function callRealBackend(config, params) {
  const globalConfig2 = getConfig();
  if (!globalConfig2.backendBaseUrl) {
    throw new Error(
      "backendBaseUrl not configured. Please set it in configureSymulate() for production mode."
    );
  }
  let url = `${globalConfig2.backendBaseUrl}${config.path}`;
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

// src/index.ts
init_config();

// src/validator.ts
var TypeValidationError = class extends Error {
  constructor(path2, expected, received, fullResponse) {
    super(
      `Type validation failed at path "${path2}":
  Expected: ${expected}
  Received: ${typeof received} (${JSON.stringify(received)})

Full response: ${JSON.stringify(fullResponse, null, 2)}

This usually means your backend response doesn't match the TypeScript type definition.
Please verify that your backend API returns data matching the expected structure.`
    );
    this.path = path2;
    this.expected = expected;
    this.received = received;
    this.fullResponse = fullResponse;
    this.name = "TypeValidationError";
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TypeValidationError,
  clearCache,
  clearQuotaState,
  configureSymulate,
  debugCache,
  defineEndpoint,
  getConfig,
  getRegisteredEndpoints,
  isDevelopment,
  isProduction,
  m
});
