import {
  getConfig,
  init_config
} from "./chunk-RV4NJJYN.mjs";
import {
  PLATFORM_CONFIG,
  auth_exports,
  init_auth,
  init_platformConfig
} from "./chunk-PAN643QS.mjs";
import {
  __require,
  __toCommonJS
} from "./chunk-CIESM3BP.mjs";

// src/cache.ts
init_config();
init_platformConfig();
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
  const path = __require("path");
  return path.join(process.cwd(), CACHE_FILE);
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
    const fs = __require("fs");
    const cachePath = getCacheFilePath();
    if (!fs.existsSync(cachePath)) {
      return {};
    }
    const content = fs.readFileSync(cachePath, "utf-8");
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
    const fs = __require("fs");
    const cachePath = getCacheFilePath();
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf-8");
  } catch (error) {
    console.warn("Failed to write cache:", error);
  }
}
async function getCachedTemplate(schemaHash, apiKeyId) {
  if (isNode) {
    try {
      const session = getAuthSession();
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
      const session = getAuthSession();
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
    const fs = __require("fs");
    const cachePath = getCacheFilePath();
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
      console.log("[Symulate] \u2713 Cache file deleted:", cachePath);
    } else {
      console.log("[Symulate] No cache file to delete");
    }
    const session = getAuthSession();
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
    const session = getAuthSession();
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
    const session = getAuthSession();
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
      const session = getAuthSession();
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

export {
  computeSchemaHash,
  getCacheFilePath,
  readCache,
  writeCache,
  getCachedTemplate,
  setCachedTemplate,
  clearCache,
  debugCache,
  getCacheEntries,
  getCacheEntryByHash,
  getCacheEntriesByPattern,
  getSupabaseCacheEntries,
  getSupabaseCacheEntryByHash,
  clearCacheByHash,
  clearCacheByPattern
};
