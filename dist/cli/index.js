#!/usr/bin/env node
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
  if (!fs2.existsSync(AUTH_CONFIG_DIR)) {
    fs2.mkdirSync(AUTH_CONFIG_DIR, { recursive: true });
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
    if (!fs2.existsSync(AUTH_CONFIG_FILE)) {
      return null;
    }
    const content = fs2.readFileSync(AUTH_CONFIG_FILE, "utf-8");
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
    if (!fs2.existsSync(AUTH_CONFIG_FILE)) {
      return null;
    }
    const content = fs2.readFileSync(AUTH_CONFIG_FILE, "utf-8");
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
    fs2.writeFileSync(AUTH_CONFIG_FILE, JSON.stringify(session, null, 2), "utf-8");
    console.log("[Symulate] \u2713 Session saved");
  } catch (error) {
    console.error("[Symulate] Failed to save auth session:", error);
    throw error;
  }
}
function clearAuthSession() {
  try {
    if (fs2.existsSync(AUTH_CONFIG_FILE)) {
      fs2.unlinkSync(AUTH_CONFIG_FILE);
      console.log("[Symulate] \u2713 Session cleared");
    }
  } catch (error) {
    console.warn("[Symulate] Failed to clear auth session:", error);
  }
}
function getPreviousContext() {
  try {
    if (!fs2.existsSync(AUTH_CONFIG_FILE)) {
      return {};
    }
    const content = fs2.readFileSync(AUTH_CONFIG_FILE, "utf-8");
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
      await new Promise((resolve3) => setTimeout(resolve3, 2e3));
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
var crypto, fs2, path2, os, AUTH_CONFIG_DIR, AUTH_CONFIG_FILE;
var init_auth = __esm({
  "src/auth.ts"() {
    "use strict";
    crypto = __toESM(require("crypto"));
    fs2 = __toESM(require("fs"));
    path2 = __toESM(require("path"));
    os = __toESM(require("os"));
    init_platformConfig();
    AUTH_CONFIG_DIR = path2.join(os.homedir(), ".symulate");
    AUTH_CONFIG_FILE = path2.join(AUTH_CONFIG_DIR, "auth.json");
  }
});

// src/cache.ts
var cache_exports = {};
__export(cache_exports, {
  clearCache: () => clearCache,
  clearCacheByHash: () => clearCacheByHash,
  clearCacheByPattern: () => clearCacheByPattern,
  computeSchemaHash: () => computeSchemaHash,
  debugCache: () => debugCache,
  getCacheEntries: () => getCacheEntries,
  getCacheEntriesByPattern: () => getCacheEntriesByPattern,
  getCacheEntryByHash: () => getCacheEntryByHash,
  getCacheFilePath: () => getCacheFilePath,
  getCachedTemplate: () => getCachedTemplate,
  getSupabaseCacheEntries: () => getSupabaseCacheEntries,
  getSupabaseCacheEntryByHash: () => getSupabaseCacheEntryByHash,
  readCache: () => readCache,
  setCachedTemplate: () => setCachedTemplate,
  writeCache: () => writeCache
});
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
  const path6 = require("path");
  return path6.join(process.cwd(), CACHE_FILE);
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
    const fs5 = require("fs");
    const cachePath = getCacheFilePath();
    if (!fs5.existsSync(cachePath)) {
      return {};
    }
    const content = fs5.readFileSync(cachePath, "utf-8");
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
    const fs5 = require("fs");
    const cachePath = getCacheFilePath();
    fs5.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf-8");
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
    const fs5 = require("fs");
    const cachePath = getCacheFilePath();
    if (fs5.existsSync(cachePath)) {
      fs5.unlinkSync(cachePath);
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
function getCacheEntries() {
  const cache = readCache();
  return Object.entries(cache).map(([hash, entry]) => ({
    hash,
    timestamp: entry.timestamp,
    dataPreview: JSON.stringify(entry.template).slice(0, 100) + "..."
  }));
}
function getCacheEntryByHash(hash) {
  const cache = readCache();
  return cache[hash] || null;
}
function getCacheEntriesByPattern(pattern) {
  const cache = readCache();
  return Object.entries(cache).filter(([hash]) => hash.includes(pattern)).map(([hash, entry]) => ({
    hash,
    timestamp: entry.timestamp,
    dataPreview: JSON.stringify(entry.template).slice(0, 100) + "...",
    fullData: entry.template
  }));
}
async function getSupabaseCacheEntries(apiKeyId) {
  try {
    const session = getAuthSession2();
    if (!session || !session.userId) {
      console.warn("[Symulate] Not authenticated. Run 'npx symulate login' first.");
      return [];
    }
    const projectId = session.currentProjectId;
    const authHeader = session.accessToken ? `Bearer ${session.accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
    let url = `${PLATFORM_CONFIG.api.rest}/mockend_cache?`;
    if (projectId) {
      url += `project_id=eq.${projectId}`;
    } else {
      url += `user_id=eq.${session.userId}`;
      console.warn("[Symulate] \u26A0\uFE0F  No project selected. Showing user-owned cache only.");
      console.log("[Symulate] Run 'npx symulate projects list' and 'npx symulate projects use <project-id>' to select a project.");
    }
    if (apiKeyId) {
      url += `&api_key_id=eq.${apiKeyId}`;
    }
    url += `&select=*`;
    const response = await fetch(url, {
      headers: {
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": authHeader,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[Symulate] Failed to fetch from Supabase cache:", response.statusText);
      console.warn("[Symulate] Error details:", errorText);
      return [];
    }
    const data = await response.json();
    return data.map((entry) => ({
      hash: entry.schema_hash,
      timestamp: new Date(entry.created_at).getTime(),
      dataPreview: JSON.stringify(entry.template).slice(0, 100) + "...",
      userId: entry.user_id,
      apiKeyId: entry.api_key_id,
      projectId: entry.project_id
    }));
  } catch (error) {
    console.warn("[Symulate] Error fetching Supabase cache entries:", error);
    return [];
  }
}
async function getSupabaseCacheEntryByHash(hash, apiKeyId) {
  try {
    const session = getAuthSession2();
    if (!session || !session.userId) {
      console.warn("[Symulate] Not authenticated. Run 'npx symulate login' first.");
      return null;
    }
    return await getSupabaseCacheEntry(hash, session.userId, session.accessToken, apiKeyId);
  } catch (error) {
    console.warn("[Symulate] Error fetching Supabase cache entry:", error);
    return null;
  }
}
async function deleteSupabaseCacheByHash(hash, userId, accessToken, apiKeyId, projectId) {
  try {
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
    let url = `${PLATFORM_CONFIG.api.rest}/mockend_cache?schema_hash=eq.${hash}&user_id=eq.${userId}`;
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
      console.warn("[Symulate] Failed to delete from Supabase cache");
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Symulate] Error deleting from Supabase cache:", error);
    return false;
  }
}
async function clearCacheByHash(hash, apiKeyId) {
  let foundLocal = false;
  let foundSupabase = false;
  const cache = readCache();
  if (cache[hash]) {
    delete cache[hash];
    writeCache(cache);
    console.log(`[Symulate] \u2713 Cleared local cache entry: ${hash}`);
    foundLocal = true;
  }
  if (isNode) {
    try {
      const session = getAuthSession2();
      if (session && session.userId) {
        const projectId = session.currentProjectId;
        const success = await deleteSupabaseCacheByHash(hash, session.userId, session.accessToken, apiKeyId, projectId);
        if (success) {
          console.log(`[Symulate] \u2713 Cleared Supabase cache entry: ${hash}`);
          foundSupabase = true;
        }
      }
    } catch (error) {
      console.warn("[Symulate] Error clearing Supabase cache:", error);
    }
  }
  if (foundLocal || foundSupabase) {
    return true;
  }
  console.log(`[Symulate] \u2717 Cache entry not found: ${hash}`);
  return false;
}
function clearCacheByPattern(pattern) {
  const cache = readCache();
  let clearedCount = 0;
  for (const hash of Object.keys(cache)) {
    if (hash.includes(pattern)) {
      delete cache[hash];
      clearedCount++;
    }
  }
  if (clearedCount > 0) {
    writeCache(cache);
    console.log(`[Symulate] \u2713 Cleared ${clearedCount} cache entries matching "${pattern}"`);
  } else {
    console.log(`[Symulate] \u2717 No cache entries found matching "${pattern}"`);
  }
  return clearedCount;
}
var CACHE_FILE, LOCALSTORAGE_KEY, isBrowser, isNode, memoryCache;
var init_cache = __esm({
  "src/cache.ts"() {
    "use strict";
    init_config();
    init_platformConfig();
    CACHE_FILE = ".symulate-cache.json";
    LOCALSTORAGE_KEY = "symulate-cache";
    isBrowser = typeof globalThis !== "undefined" && typeof globalThis.window !== "undefined";
    isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;
    memoryCache = {};
  }
});

// src/aiProvider.ts
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
var PLATFORM_API_URL;
var init_aiProvider = __esm({
  "src/aiProvider.ts"() {
    "use strict";
    init_config();
    PLATFORM_API_URL = "https://ptrjfelueuglvsdsqzok.supabase.co/functions/v1/symulate";
  }
});

// src/fakerGenerator.ts
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
var import_faker;
var init_fakerGenerator = __esm({
  "src/fakerGenerator.ts"() {
    "use strict";
    import_faker = require("@faker-js/faker");
    init_config();
  }
});

// src/tracking.ts
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
var PLATFORM_API_URL2;
var init_tracking = __esm({
  "src/tracking.ts"() {
    "use strict";
    init_config();
    PLATFORM_API_URL2 = "https://ptrjfelueuglvsdsqzok.supabase.co/functions/v1/symulate";
  }
});

// src/schema.ts
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
var SchemaBuilder, m;
var init_schema = __esm({
  "src/schema.ts"() {
    "use strict";
    SchemaBuilder = class {
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
    m = new SchemaBuilder();
  }
});

// src/defineEndpoint.ts
var defineEndpoint_exports = {};
__export(defineEndpoint_exports, {
  defineEndpoint: () => defineEndpoint,
  getRegisteredEndpoints: () => getRegisteredEndpoints,
  setCurrentFile: () => setCurrentFile
});
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
        await new Promise((resolve3) => setTimeout(resolve3, delay));
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
var globalKey, registeredEndpoints, currentFileKey;
var init_defineEndpoint = __esm({
  "src/defineEndpoint.ts"() {
    "use strict";
    init_config();
    init_cache();
    init_aiProvider();
    init_fakerGenerator();
    init_tracking();
    init_schema();
    init_env();
    globalKey = Symbol.for("@@mockend/registeredEndpoints");
    if (!globalThis[globalKey]) {
      globalThis[globalKey] = /* @__PURE__ */ new Map();
    }
    registeredEndpoints = globalThis[globalKey];
    currentFileKey = Symbol.for("@@mockend/currentFile");
    if (!globalThis[currentFileKey]) {
      globalThis[currentFileKey] = null;
    }
  }
});

// src/scanner.ts
var scanner_exports = {};
__export(scanner_exports, {
  scanAndLoadEndpoints: () => scanAndLoadEndpoints
});
function findFiles(dir, extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs"], ignore = ["node_modules", ".git", "dist", "build", ".next", ".nuxt"]) {
  const files = [];
  try {
    const entries = fs3.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path3.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!ignore.includes(entry.name)) {
          files.push(...findFiles(fullPath, extensions, ignore));
        }
      } else if (entry.isFile()) {
        const ext = path3.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
  }
  return files;
}
function fileContainsEndpoints(filePath) {
  try {
    const content = fs3.readFileSync(filePath, "utf-8");
    return (content.includes("@symulate/sdk") || content.includes("defineMockEndpoint")) && content.includes("defineMockEndpoint(");
  } catch (error) {
    return false;
  }
}
async function scanAndLoadEndpoints(projectRoot = process.cwd()) {
  console.log(`[Symulate] Scanning project at: ${projectRoot}`);
  const allFiles = findFiles(projectRoot);
  const endpointFiles = allFiles.filter(fileContainsEndpoints);
  if (endpointFiles.length === 0) {
    return 0;
  }
  console.log(`[Symulate] Found ${endpointFiles.length} file(s) with endpoint definitions`);
  for (const filePath of endpointFiles) {
    try {
      const fileUrl = (0, import_url.pathToFileURL)(filePath).href;
      await import(fileUrl);
    } catch (error) {
      if (IS_DEBUG) {
        console.warn(`[Symulate] Warning: Could not load ${filePath}: ${error.message}`);
      }
    }
  }
  return endpointFiles.length;
}
var fs3, path3, import_url;
var init_scanner = __esm({
  "src/scanner.ts"() {
    "use strict";
    fs3 = __toESM(require("fs"));
    path3 = __toESM(require("path"));
    import_url = require("url");
    init_env();
  }
});

// src/loadEndpoints.ts
var loadEndpoints_exports = {};
__export(loadEndpoints_exports, {
  loadEndpoints: () => loadEndpoints
});
function isTypeScriptFile(filePath) {
  return /\.(ts|tsx|mts)$/.test(filePath);
}
async function loadConfig(cwd = process.cwd()) {
  const configFiles = ["symulate.config.js", "symulate.config.mjs", "symulate.config.cjs"];
  for (const configFile of configFiles) {
    const configPath = path4.join(cwd, configFile);
    if (fs4.existsSync(configPath)) {
      try {
        const fileUrl = (0, import_url2.pathToFileURL)(configPath).href;
        const config = await import(fileUrl);
        return config.default || config;
      } catch (error) {
        console.warn(`[Symulate] Warning: Could not load ${configFile}: ${error.message}`);
      }
    }
  }
  return null;
}
async function expandGlobPatterns(patterns, cwd) {
  const allFiles = [];
  for (const pattern of patterns) {
    const isGlob = pattern.includes("*") || pattern.includes("?") || pattern.includes("[");
    if (isGlob) {
      const matches = await (0, import_glob.glob)(pattern, {
        cwd,
        absolute: true,
        nodir: true,
        ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/.nuxt/**", "**/.next/**"]
      });
      allFiles.push(...matches);
    } else {
      const fullPath = path4.resolve(cwd, pattern);
      if (fs4.existsSync(fullPath)) {
        allFiles.push(fullPath);
      } else {
        console.warn(`[Symulate] Warning: Entry file not found: ${pattern}`);
      }
    }
  }
  return allFiles;
}
function enableTypeScriptExecution() {
  if (tsxEnabled) return;
  try {
    const tsx = require("tsx/cjs/api");
    tsx.register();
    tsxEnabled = true;
    if (IS_DEBUG) {
      console.log("[Symulate] TypeScript execution enabled");
    }
  } catch (error) {
    console.warn("[Symulate] Warning: Could not enable TypeScript execution:", error.message);
    console.warn("[Symulate] TypeScript files (.ts) will not be loaded. Please ensure files are compiled to JavaScript.");
  }
}
async function loadEndpoints() {
  const cwd = process.cwd();
  const config = await loadConfig(cwd);
  if (config?.entries) {
    const entryPatterns = Array.isArray(config.entries) ? config.entries : [config.entries];
    console.log(`[Symulate] Resolving entry patterns...`);
    const entryFiles = await expandGlobPatterns(entryPatterns, cwd);
    if (entryFiles.length === 0) {
      console.warn("[Symulate] Warning: No files matched the entry patterns");
      return 0;
    }
    const hasTypeScript = entryFiles.some(isTypeScriptFile);
    if (hasTypeScript) {
      enableTypeScriptExecution();
    }
    console.log(`[Symulate] Found ${entryFiles.length} file(s) to load`);
    let loadedCount = 0;
    for (const entryPath of entryFiles) {
      try {
        if (IS_DEBUG) {
          console.log(`[Symulate] Loading: ${path4.relative(cwd, entryPath)}`);
        }
        const fileUrl = (0, import_url2.pathToFileURL)(entryPath).href;
        if (IS_DEBUG) {
          console.log(`[Symulate] Importing: ${fileUrl}`);
        }
        const { setCurrentFile: setCurrentFile2 } = await Promise.resolve().then(() => (init_defineEndpoint(), defineEndpoint_exports));
        const relativeFilename = path4.relative(cwd, entryPath);
        setCurrentFile2(relativeFilename);
        await import(fileUrl);
        loadedCount++;
        setCurrentFile2(null);
        if (IS_DEBUG) {
          console.log(`[Symulate] Successfully loaded: ${relativeFilename}`);
        }
      } catch (error) {
        console.error(`[Symulate] Error loading ${path4.relative(cwd, entryPath)}: ${error.message}`);
        if (IS_DEBUG) {
          console.error(`[Symulate] Full error:`, error);
          console.error(error.stack);
        }
        const { setCurrentFile: setCurrentFile2 } = await Promise.resolve().then(() => (init_defineEndpoint(), defineEndpoint_exports));
        setCurrentFile2(null);
      }
    }
    return loadedCount;
  }
  console.log("[Symulate] No config found. Attempting to scan project...");
  const { scanAndLoadEndpoints: scanAndLoadEndpoints2 } = await Promise.resolve().then(() => (init_scanner(), scanner_exports));
  return await scanAndLoadEndpoints2(cwd);
}
var fs4, path4, import_url2, import_glob, tsxEnabled;
var init_loadEndpoints = __esm({
  "src/loadEndpoints.ts"() {
    "use strict";
    fs4 = __toESM(require("fs"));
    path4 = __toESM(require("path"));
    import_url2 = require("url");
    import_glob = require("glob");
    init_env();
    tsxEnabled = false;
  }
});

// src/apiKeys.ts
var apiKeys_exports = {};
__export(apiKeys_exports, {
  displayApiKeys: () => displayApiKeys,
  getApiKeys: () => getApiKeys
});
async function getApiKeys() {
  try {
    const session = getAuthSession();
    if (!session || !session.userId) {
      console.warn("[Symulate] Not authenticated. Run 'npx symulate login' first.");
      return [];
    }
    const authHeader = session.accessToken ? `Bearer ${session.accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
    const url = `${PLATFORM_CONFIG.api.rest}/api_keys?user_id=eq.${session.userId}&select=*&order=created_at.desc`;
    const response = await fetch(url, {
      headers: {
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": authHeader,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[Symulate] Failed to fetch API keys:", response.statusText);
      console.warn("[Symulate] Error details:", errorText);
      return [];
    }
    const data = await response.json();
    return data.map((entry) => ({
      id: entry.id,
      key: entry.key,
      name: entry.name || void 0,
      isActive: entry.is_active,
      createdAt: entry.created_at,
      expiresAt: entry.expires_at || void 0
    }));
  } catch (error) {
    console.warn("[Symulate] Error fetching API keys:", error);
    return [];
  }
}
function displayApiKeys(keys) {
  if (keys.length === 0) {
    console.log("\n\u{1F4CB} No API keys found");
    console.log("\n\u{1F4A1} Create API keys at https://platform.symulate.dev/dashboard/api-keys");
    return;
  }
  console.log(`
\u{1F511} API Keys (${keys.length} total):
`);
  keys.forEach((key, index) => {
    const status = key.isActive ? "\u2713 Active" : "\u2717 Revoked";
    const statusColor = key.isActive ? "" : " (REVOKED)";
    const displayKey = key.key ? `${key.key.substring(0, 20)}...${key.key.substring(key.key.length - 8)}` : "[Key hash stored securely]";
    console.log(`  [${index + 1}] ${displayKey}`);
    console.log(`      ID: ${key.id}`);
    if (key.name) {
      console.log(`      Name: ${key.name}`);
    }
    console.log(`      Status: ${status}${statusColor}`);
    console.log(`      Created: ${new Date(key.createdAt).toLocaleString()}`);
    if (key.expiresAt) {
      console.log(`      Expires: ${new Date(key.expiresAt).toLocaleString()}`);
    }
    console.log();
  });
  console.log("\u{1F4A1} Tips:");
  console.log("   - Use '--key <api-key-id>' with cache commands to filter by API key");
  console.log("   - Manage your API keys at https://platform.symulate.dev/dashboard/api-keys");
}
var init_apiKeys = __esm({
  "src/apiKeys.ts"() {
    "use strict";
    init_auth();
    init_platformConfig();
  }
});

// src/organizations.ts
var organizations_exports = {};
__export(organizations_exports, {
  displayOrganizations: () => displayOrganizations,
  displayProjects: () => displayProjects,
  getOrganizationProjects: () => getOrganizationProjects,
  getUserOrganizations: () => getUserOrganizations
});
async function getUserOrganizations() {
  const session = await getAuthSessionWithRefresh();
  if (!session || !session.accessToken) {
    console.error("[Symulate] Not authenticated. Please login first.");
    return [];
  }
  try {
    const response = await fetch(
      `${PLATFORM_CONFIG.api.rest}/organization_members?select=role,organization_id,organizations(id,name,slug,owner_user_id,created_at,updated_at)&user_id=eq.${session.userId}&order=joined_at.asc`,
      {
        headers: {
          apikey: PLATFORM_CONFIG.supabase.anonKey,
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    if (!response.ok) {
      const error = await response.json();
      console.error("[Symulate] Failed to fetch organizations:", error);
      return [];
    }
    const data = await response.json();
    const organizations = data.filter((item) => item.organizations).map((item) => {
      const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations;
      return {
        ...org,
        user_role: item.role
      };
    });
    return organizations;
  } catch (error) {
    console.error("[Symulate] Error fetching organizations:", error);
    return [];
  }
}
async function getOrganizationProjects(organizationId) {
  const session = await getAuthSessionWithRefresh();
  if (!session || !session.accessToken) {
    console.error("[Symulate] Not authenticated. Please login first.");
    return [];
  }
  try {
    const response = await fetch(
      `${PLATFORM_CONFIG.api.rest}/projects?select=*&organization_id=eq.${organizationId}&is_active=eq.true&order=created_at.asc`,
      {
        headers: {
          apikey: PLATFORM_CONFIG.supabase.anonKey,
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    if (!response.ok) {
      const error = await response.json();
      console.error("[Symulate] Failed to fetch projects:", error);
      return [];
    }
    const projects = await response.json();
    return projects;
  } catch (error) {
    console.error("[Symulate] Error fetching projects:", error);
    return [];
  }
}
function displayOrganizations(organizations, currentOrgId) {
  if (organizations.length === 0) {
    console.log("\n[Symulate] No organizations found.");
    console.log(
      "[Symulate] Organizations are automatically created when you sign up."
    );
    return;
  }
  console.log("\n[Symulate] Your Organizations:\n");
  organizations.forEach((org) => {
    const current = org.id === currentOrgId ? " (current)" : "";
    console.log(`  ${org.name}${current}`);
    console.log(`    ID: ${org.id}`);
    console.log(`    Slug: ${org.slug}`);
    console.log(`    Role: ${org.user_role}`);
    console.log();
  });
}
function displayProjects(projects, currentProjectId) {
  if (projects.length === 0) {
    console.log("\n[Symulate] No projects found in this organization.");
    console.log(
      '[Symulate] Projects are automatically created with name "Default Project".'
    );
    return;
  }
  console.log("\n[Symulate] Projects:\n");
  projects.forEach((project) => {
    const current = project.id === currentProjectId ? " (current)" : "";
    console.log(`  ${project.name}${current}`);
    console.log(`    ID: ${project.id}`);
    console.log(`    Slug: ${project.slug}`);
    if (project.description) {
      console.log(`    Description: ${project.description}`);
    }
    console.log();
  });
}
var init_organizations = __esm({
  "src/organizations.ts"() {
    "use strict";
    init_auth();
    init_platformConfig();
  }
});

// src/sync.ts
var sync_exports = {};
__export(sync_exports, {
  syncEndpoints: () => syncEndpoints
});
function normalizeEndpointPath(path6) {
  return path6.replace(/:[a-zA-Z0-9_]+/g, ":param");
}
async function promptUser(question) {
  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve3) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve3(answer.trim().toLowerCase());
    });
  });
}
async function syncEndpoints() {
  const session = getAuthSession();
  if (!session) {
    throw new Error('Not authenticated. Run "npx symulate login" first.');
  }
  const { projectId } = getCurrentContext();
  if (!projectId) {
    throw new Error(
      'No project selected. Run "npx symulate projects list" and "npx symulate projects use <project-id>" to select a project.'
    );
  }
  const supabaseUrl = PLATFORM_CONFIG.supabase.url;
  console.log(`[Symulate] Syncing endpoints to project: ${projectId}
`);
  const { loadEndpoints: loadEndpoints2 } = await Promise.resolve().then(() => (init_loadEndpoints(), loadEndpoints_exports));
  await loadEndpoints2();
  const localEndpoints = getRegisteredEndpoints();
  if (localEndpoints.size === 0) {
    console.log("[Symulate] \u26A0 No endpoints found to sync.");
    console.log("[Symulate] ");
    console.log("[Symulate] To fix this, create a symulate.config.js file in your project root:");
    console.log("[Symulate] ");
    console.log("[Symulate]   // symulate.config.js");
    console.log("[Symulate]   export default {");
    console.log("[Symulate]     entries: [");
    console.log('[Symulate]       "./src/models/**/*.ts",              // TypeScript files (auto-detected)');
    console.log('[Symulate]       "./server/api/**/*.js",              // JavaScript files');
    console.log("[Symulate]     ]");
    console.log("[Symulate]   };");
    console.log("[Symulate] ");
    console.log("[Symulate] Examples:");
    console.log('[Symulate]   - Angular: entries: ["./src/app/models/**/*.ts"]');
    console.log('[Symulate]   - Nuxt: entries: ["./server/api/**/*.ts"]');
    console.log('[Symulate]   - Express: entries: ["./src/routes/**/*.ts"]');
    console.log('[Symulate]   - Built files: entries: ["./dist/**/*.js"]\n');
    return;
  }
  console.log(`[Symulate] Found ${localEndpoints.size} local endpoint(s):`);
  localEndpoints.forEach((config, key) => {
    console.log(`  \u2022 ${config.method} ${config.path}`);
  });
  console.log();
  console.log("[Symulate] Fetching remote endpoints...");
  let remoteEndpoints = [];
  try {
    const url = `${supabaseUrl}/functions/v1/get-project-endpoints?project_id=${projectId}`;
    if (IS_DEBUG) {
      console.log(`[Symulate] Fetching from: ${url}`);
    }
    const response = await fetch(url, {
      headers: {
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": `Bearer ${session.accessToken}`,
        "Content-Type": "application/json"
      }
    });
    if (IS_DEBUG) {
      console.log(`[Symulate] Response status: ${response.status} ${response.statusText}`);
    }
    if (!response.ok) {
      const errorText = await response.text();
      if (IS_DEBUG) {
        console.log(`[Symulate] Error response: ${errorText}`);
      }
      let errorMessage = "Failed to fetch remote endpoints";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }
    const data = await response.json();
    remoteEndpoints = data.endpoints || [];
    console.log(`[Symulate] Found ${remoteEndpoints.length} remote endpoint(s)
`);
  } catch (error) {
    console.error("[Symulate] Failed to fetch remote endpoints:", error.message);
    if (IS_DEBUG) {
      console.error("[Symulate] Full error:", error);
    }
    throw error;
  }
  const remoteKeys = new Set(remoteEndpoints.map((e) => e.endpoint_key));
  const localKeys = /* @__PURE__ */ new Set();
  const toCreate = [];
  const toUpdate = [];
  localEndpoints.forEach((config, key) => {
    const endpointKey = `${config.method}:${config.path}`;
    localKeys.add(endpointKey);
    const remote = remoteEndpoints.find((r) => r.endpoint_key === endpointKey);
    if (remote) {
      toUpdate.push({ config, key, remote });
    } else {
      toCreate.push({ config, key });
    }
  });
  const remoteOnly = remoteEndpoints.filter((r) => !localKeys.has(r.endpoint_key));
  const potentialConflicts = [];
  remoteOnly.forEach((remote) => {
    const normalizedRemote = normalizeEndpointPath(remote.path);
    const possibleMatches = toCreate.filter(
      ({ config }) => config.method === remote.method && normalizeEndpointPath(config.path) === normalizedRemote && config.path !== remote.path
    );
    if (possibleMatches.length > 0) {
      potentialConflicts.push({ remote, possibleMatches });
    }
  });
  const endpointsToDelete = [];
  if (potentialConflicts.length > 0) {
    console.log("\n[Symulate] \u26A0\uFE0F  Potential conflicts detected!\n");
    console.log("[Symulate] It looks like you may have renamed path parameters.\n");
    for (const conflict of potentialConflicts) {
      console.log(`[Symulate] \u{1F50D} Conflict:`);
      console.log(`[Symulate]   Remote: ${conflict.remote.method} ${conflict.remote.path}`);
      console.log(`[Symulate]   Local:  ${conflict.possibleMatches.map((m2) => `${m2.config.method} ${m2.config.path}`).join(", ")}
`);
      console.log("[Symulate] These endpoints have the same structure but different parameter names.");
      console.log("[Symulate] What would you like to do?\n");
      console.log("[Symulate]   [1] Keep both - Sync local as new endpoint (creates duplicate)");
      console.log("[Symulate]   [2] Replace - Delete remote and sync local (recommended for renames)");
      console.log("[Symulate]   [3] Skip - Keep remote, don't sync local\n");
      const answer = await promptUser("[Symulate] Your choice (1/2/3): ");
      if (answer === "2" || answer === "replace") {
        endpointsToDelete.push(conflict.remote.id);
        console.log(`[Symulate] \u2713 Will replace remote with local endpoint
`);
      } else if (answer === "3" || answer === "skip") {
        conflict.possibleMatches.forEach((match) => {
          const index = toCreate.findIndex((c) => c.key === match.key);
          if (index !== -1) {
            toCreate.splice(index, 1);
          }
        });
        console.log(`[Symulate] \u2713 Will skip syncing local endpoint
`);
      } else {
        console.log(`[Symulate] \u2713 Will keep both endpoints
`);
      }
    }
  }
  console.log("[Symulate] \u{1F4CA} Sync Summary:");
  console.log(`  \u2022 ${toCreate.length} endpoint(s) to create`);
  console.log(`  \u2022 ${toUpdate.length} endpoint(s) to update`);
  console.log(`  \u2022 ${endpointsToDelete.length} endpoint(s) to delete`);
  console.log(`  \u2022 ${remoteOnly.length - endpointsToDelete.length} remote-only endpoint(s) (will be preserved)
`);
  if (toCreate.length > 0) {
    console.log("[Symulate] \u2728 New endpoints:");
    toCreate.forEach(({ config }) => {
      console.log(`  + ${config.method} ${config.path}`);
    });
    console.log();
  }
  if (toUpdate.length > 0) {
    console.log("[Symulate] \u{1F504} Updated endpoints:");
    toUpdate.forEach(({ config }) => {
      console.log(`  ~ ${config.method} ${config.path}`);
    });
    console.log();
  }
  if (endpointsToDelete.length > 0) {
    console.log("[Symulate] \u{1F5D1}\uFE0F  Endpoints to delete:");
    const toDeleteEndpoints = remoteEndpoints.filter((r) => endpointsToDelete.includes(r.id));
    toDeleteEndpoints.forEach((endpoint) => {
      console.log(`  - ${endpoint.method} ${endpoint.path}`);
    });
    console.log();
  }
  if (remoteOnly.length > 0 && endpointsToDelete.length < remoteOnly.length) {
    console.log("[Symulate] \u{1F4CC} Remote-only endpoints (preserved):");
    remoteOnly.filter((e) => !endpointsToDelete.includes(e.id)).forEach((endpoint) => {
      console.log(`  = ${endpoint.method} ${endpoint.path}`);
    });
    console.log();
  }
  const endpointsToSync = Array.from(localEndpoints.values()).filter((config) => {
    const endpointKey = `${config.method}:${config.path}`;
    const wasInToCreate = toCreate.some((c) => `${c.config.method}:${c.config.path}` === endpointKey);
    return !wasInToCreate || toCreate.some((c) => `${c.config.method}:${c.config.path}` === endpointKey);
  }).map((config) => ({
    method: config.method,
    path: config.path,
    schema: config.schema ? serializeSchema(config.schema) : void 0,
    mock: config.mock,
    params: config.params,
    errors: config.errors,
    filename: config.__filename || "unknown"
  }));
  console.log("[Symulate] \u{1F4E4} Syncing to backend...");
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sync-project-endpoints`,
      {
        method: "POST",
        headers: {
          "apikey": PLATFORM_CONFIG.supabase.anonKey,
          "Authorization": `Bearer ${session.accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          project_id: projectId,
          endpoints: endpointsToSync,
          delete_endpoint_ids: endpointsToDelete
        })
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to sync endpoints");
    }
    const result = await response.json();
    const results = result.results || [];
    console.log("[Symulate] \u2705 Sync completed successfully!\n");
    const created = results.filter((r) => r.action === "created");
    const updated = results.filter((r) => r.action === "updated");
    if (created.length > 0) {
      console.log(`[Symulate] Created ${created.length} endpoint(s):`);
      created.forEach((r) => console.log(`  \u2713 ${r.method} ${r.path}`));
    }
    if (updated.length > 0) {
      console.log(`[Symulate] Updated ${updated.length} endpoint(s):`);
      updated.forEach((r) => console.log(`  \u2713 ${r.method} ${r.path}`));
    }
    console.log("\n[Symulate] \u{1F4A1} View your endpoints at https://platform.symulate.dev\n");
  } catch (error) {
    console.error("[Symulate] Failed to sync endpoints:", error);
    throw error;
  }
}
function serializeSchema(schema) {
  return schema;
}
var init_sync = __esm({
  "src/sync.ts"() {
    "use strict";
    init_defineEndpoint();
    init_auth();
    init_platformConfig();
    init_env();
  }
});

// src/cli/index.ts
var import_commander = require("commander");
var path5 = __toESM(require("path"));

// src/cli/openapi.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
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
function extractTagFromPath(path6) {
  const segments = path6.split("/").filter((s) => s && !s.startsWith(":"));
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
var program = new import_commander.Command();
program.name("mockend").description("Mockend CLI - AI-powered frontend-first development toolkit").version("1.0.0");
program.command("openapi").description("Generate OpenAPI specification from endpoint definitions").option("-o, --output <path>", "Output file path", "./openapi.json").option("-t, --title <title>", "API title", "Mockend Generated API").option("-v, --version <version>", "API version", "1.0.0").option("-d, --description <description>", "API description").option("-s, --server <url>", "Server URL (e.g., https://api.example.com)").action(async (options) => {
  try {
    console.log("Loading endpoint definitions...");
    const { loadEndpoints: loadEndpoints2 } = await Promise.resolve().then(() => (init_loadEndpoints(), loadEndpoints_exports));
    await loadEndpoints2();
    const { getRegisteredEndpoints: getRegisteredEndpoints2 } = await Promise.resolve().then(() => (init_defineEndpoint(), defineEndpoint_exports));
    const endpoints = getRegisteredEndpoints2();
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
    const outputPath = path5.resolve(process.cwd(), options.output);
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
      getCacheEntries: getCacheEntries2,
      getCacheEntryByHash: getCacheEntryByHash2,
      getCacheEntriesByPattern: getCacheEntriesByPattern2,
      getSupabaseCacheEntries: getSupabaseCacheEntries2,
      getSupabaseCacheEntryByHash: getSupabaseCacheEntryByHash2
    } = await Promise.resolve().then(() => (init_cache(), cache_exports));
    if (options.hash) {
      let entry;
      entry = await getSupabaseCacheEntryByHash2(options.hash, options.key);
      if (!entry) {
        entry = getCacheEntryByHash2(options.hash);
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
      const entries2 = getCacheEntriesByPattern2(options.search);
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
    let entries = getCacheEntries2();
    let supabaseEntries = [];
    if (options.remote) {
      supabaseEntries = await getSupabaseCacheEntries2(options.key);
      entries = [];
    } else {
      supabaseEntries = await getSupabaseCacheEntries2(options.key);
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
    const { clearCache: clearCache2 } = await Promise.resolve().then(() => (init_cache(), cache_exports));
    await clearCache2(options.key);
    console.log("\u2713 Cache cleared successfully");
  } catch (error) {
    console.error("Error clearing cache:", error);
    process.exit(1);
  }
});
program.command("regenerate").description("Regenerate mock data by clearing the cache").option("-e, --endpoint <pattern>", "Clear cache for endpoints matching this pattern").option("-p, --preview", "Preview cached endpoints without clearing").option("-h, --hash <hash>", "Clear cache for a specific hash").option("-k, --key <api-key>", "Filter by API key ID").action(async (options) => {
  try {
    const { clearCache: clearCache2, clearCacheByHash: clearCacheByHash2, clearCacheByPattern: clearCacheByPattern2, getCacheEntries: getCacheEntries2 } = await Promise.resolve().then(() => (init_cache(), cache_exports));
    if (options.preview) {
      console.log("\u{1F4CB} Cached Endpoints:");
      const entries = getCacheEntries2();
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
      const cleared = await clearCacheByHash2(options.hash, options.key);
      if (cleared) {
        console.log("\u2713 Cache entry cleared. Mock data will regenerate on next request.");
      } else {
        console.log("\u2717 Cache entry not found");
        process.exit(1);
      }
      return;
    }
    if (options.endpoint) {
      const count = clearCacheByPattern2(options.endpoint);
      if (count > 0) {
        console.log(`\u2713 Cleared ${count} cache entry(ies). Mock data will regenerate on next request.`);
      } else {
        console.log(`\u2717 No cache entries found matching "${options.endpoint}"`);
        process.exit(1);
      }
      return;
    }
    await clearCache2(options.key);
    console.log("\u2713 All cache cleared successfully");
    console.log("\u{1F4A1} Mock data will regenerate on next request");
  } catch (error) {
    console.error("Error regenerating cache:", error);
    process.exit(1);
  }
});
program.command("login").description("Authenticate with Mockend Platform").action(async () => {
  try {
    const { login: login2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const success = await login2();
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
    const { logout: logout2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    logout2();
  } catch (error) {
    console.error("Error during logout:", error);
    process.exit(1);
  }
});
program.command("whoami").description("Show information about the current authenticated user").action(async () => {
  try {
    const { whoami: whoami2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    whoami2();
  } catch (error) {
    console.error("Error getting user info:", error);
    process.exit(1);
  }
});
program.command("api-keys").description("List all API keys for the authenticated user").action(async () => {
  try {
    const { getApiKeys: getApiKeys2, displayApiKeys: displayApiKeys2 } = await Promise.resolve().then(() => (init_apiKeys(), apiKeys_exports));
    const keys = await getApiKeys2();
    displayApiKeys2(keys);
  } catch (error) {
    console.error("Error getting API keys:", error);
    process.exit(1);
  }
});
var orgsCommand = program.command("orgs").description("Manage organizations");
orgsCommand.command("list").description("List all organizations you belong to").action(async () => {
  try {
    const {
      getUserOrganizations: getUserOrganizations2,
      displayOrganizations: displayOrganizations2
    } = await Promise.resolve().then(() => (init_organizations(), organizations_exports));
    const { getCurrentContext: getCurrentContext2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const orgs = await getUserOrganizations2();
    const { orgId } = getCurrentContext2();
    displayOrganizations2(orgs, orgId);
  } catch (error) {
    console.error("Error listing organizations:", error);
    process.exit(1);
  }
});
orgsCommand.command("use <org-identifier>").description("Switch to a different organization (accepts org ID or slug)").action(async (orgIdentifier) => {
  try {
    const { setCurrentOrganization: setCurrentOrganization2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const { getUserOrganizations: getUserOrganizations2 } = await Promise.resolve().then(() => (init_organizations(), organizations_exports));
    const orgs = await getUserOrganizations2();
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
    setCurrentOrganization2(org.id);
  } catch (error) {
    console.error("Error switching organization:", error);
    process.exit(1);
  }
});
var projectsCommand = program.command("projects").description("Manage projects in the current organization");
projectsCommand.command("list").description("List all projects in the current organization").action(async () => {
  try {
    const {
      getOrganizationProjects: getOrganizationProjects2,
      displayProjects: displayProjects2
    } = await Promise.resolve().then(() => (init_organizations(), organizations_exports));
    const { getCurrentContext: getCurrentContext2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const { orgId, projectId } = getCurrentContext2();
    if (!orgId) {
      console.error(
        "[Symulate] No organization selected. Please select an organization first."
      );
      console.log("[Symulate] Run 'npx symulate orgs list' to see available organizations");
      console.log("[Symulate] Then run 'npx symulate orgs use <org-id>' to select one");
      process.exit(1);
    }
    const projects = await getOrganizationProjects2(orgId);
    displayProjects2(projects, projectId);
  } catch (error) {
    console.error("Error listing projects:", error);
    process.exit(1);
  }
});
projectsCommand.command("use <project-identifier>").description("Switch to a different project (accepts project ID or slug)").action(async (projectIdentifier) => {
  try {
    const { setCurrentProject: setCurrentProject2, getCurrentContext: getCurrentContext2 } = await Promise.resolve().then(() => (init_auth(), auth_exports));
    const { getOrganizationProjects: getOrganizationProjects2 } = await Promise.resolve().then(() => (init_organizations(), organizations_exports));
    const { orgId } = getCurrentContext2();
    if (!orgId) {
      console.error(
        "[Symulate] No organization selected. Please select an organization first."
      );
      console.log("[Symulate] Run 'npx symulate orgs use <org-identifier>' to select one");
      process.exit(1);
    }
    const projects = await getOrganizationProjects2(orgId);
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
    setCurrentProject2(project.id);
  } catch (error) {
    console.error("Error switching project:", error);
    process.exit(1);
  }
});
program.command("sync").description("Sync local endpoint definitions to Mockend Platform").action(async () => {
  try {
    const { syncEndpoints: syncEndpoints2 } = await Promise.resolve().then(() => (init_sync(), sync_exports));
    await syncEndpoints2();
  } catch (error) {
    console.error("Error syncing endpoints:", error);
    process.exit(1);
  }
});
program.parse();
