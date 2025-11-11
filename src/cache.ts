import type { CachedTemplate } from "./types";
import { getConfig } from "./config";
import { PLATFORM_CONFIG } from "./platformConfig";

// Note: Auth session detection removed to avoid bundling Node.js modules in browser builds
// Cache operations that need authentication should explicitly pass auth info
// CLI commands can still import auth module directly

const CACHE_FILE = ".symulate-cache.json";
const LOCALSTORAGE_KEY = "symulate-cache";

// Browser-compatible environment detection
const isBrowser = typeof globalThis !== "undefined" && typeof (globalThis as any).window !== "undefined";
const isNode = typeof process !== "undefined" && process.versions != null && process.versions.node != null;

// In-memory cache for non-persistent browser environment
let memoryCache: Record<string, CachedTemplate> = {};

/**
 * Get cache entry from Supabase and increment hit_count
 */
async function getSupabaseCacheEntry(schemaHash: string, userId: string, accessToken?: string, apiKeyId?: string, projectId?: string): Promise<CachedTemplate | null> {
  try {
    // Use access token if available, otherwise fall back to anon key
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;

    // Build query URL with optional api_key_id and project_id filters
    let url = `${PLATFORM_CONFIG.api.rest}/mockend_cache?schema_hash=eq.${schemaHash}`;

    // Filter by project_id if provided (primary isolation mechanism)
    if (projectId) {
      url += `&project_id=eq.${projectId}`;
    } else {
      // Fallback to user-based filter for backwards compatibility
      url += `&or=(user_id.eq.${userId},user_id.is.null)`;
    }

    if (apiKeyId) {
      url += `&api_key_id=eq.${apiKeyId}`;
    }
    url += `&select=*&limit=1`;

    // Query cache entries for this schema hash (user-specific OR shared)
    const response = await fetch(url, {
        headers: {
          "apikey": PLATFORM_CONFIG.supabase.anonKey,
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.warn("[Symulate] Failed to fetch from Supabase cache:", response.statusText);
      return null;
    }

    const data = await response.json() as any[];

    if (data && data.length > 0) {
      const entry = data[0];

      // Increment hit_count in background (don't await)
      incrementHitCount(entry.id, accessToken).catch(err =>
        console.warn("[Symulate] Failed to increment hit count:", err)
      );

      return {
        template: entry.template,
        timestamp: new Date(entry.created_at).getTime(),
        schemaHash: entry.schema_hash,
      };
    }

    return null;
  } catch (error) {
    console.warn("[Symulate] Error fetching from Supabase cache:", error);
    return null;
  }
}

/**
 * Increment hit_count for a cache entry
 */
async function incrementHitCount(cacheId: string, accessToken?: string): Promise<void> {
  try {
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;

    const response = await fetch(`${PLATFORM_CONFIG.api.rest}/rpc/increment_cache_hit_count`, {
      method: "POST",
      headers: {
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cache_id: cacheId }),
    });

    if (!response.ok) {
      console.warn("[Symulate] Failed to increment hit count");
    }
  } catch (error) {
    console.warn("[Symulate] Error incrementing hit count:", error);
  }
}

/**
 * Set cache entry in Supabase
 */
async function setSupabaseCacheEntry(
  schemaHash: string,
  template: any,
  userId: string,
  apiKeyId?: string,
  accessToken?: string,
  projectId?: string,
  path?: string
): Promise<boolean> {
  try {
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;

    const payload: any = {
      schema_hash: schemaHash,
      template,
      user_id: userId,
      schema: {}, // We don't store the full schema for now
    };

    // Add api_key_id if provided
    if (apiKeyId) {
      payload.api_key_id = apiKeyId;
    }

    // Add project_id if provided (required for project-scoped cache)
    if (projectId) {
      payload.project_id = projectId;
    }

    // Add path if provided (for filtering by endpoint path)
    if (path) {
      payload.path = path;
    }

    const response = await fetch(`${PLATFORM_CONFIG.api.rest}/mockend_cache`, {
      method: "POST",
      headers: {
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": authHeader,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify(payload),
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

/**
 * Clear all cache entries from Supabase for the current user
 */
async function clearSupabaseCache(userId: string, accessToken?: string, apiKeyId?: string, projectId?: string): Promise<boolean> {
  try {
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;

    // Build query URL with optional api_key_id and project_id filters
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
        "Content-Type": "application/json",
      },
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

export function computeSchemaHash(schema: any): string {
  // Recursively sort object keys for deterministic hashing
  const sortKeys = (obj: any): any => {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(sortKeys);
    }
    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = sortKeys(obj[key]);
      });
    return sorted;
  };

  const schemaString = JSON.stringify(sortKeys(schema));

  // Use a simple hash for browser compatibility
  // This is not cryptographically secure but sufficient for cache key generation
  let hash = 0;
  for (let i = 0; i < schemaString.length; i++) {
    const char = schemaString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

export function getCacheFilePath(): string {
  if (isBrowser) {
    return CACHE_FILE;
  }
  // Dynamic import for Node.js only
  const path = require("path");
  return path.join(process.cwd(), CACHE_FILE);
}

export function readCache(): Record<string, CachedTemplate> {
  const config = getConfig();

  // Browser with persistent cache: use localStorage
  if (isBrowser && config.persistentCache) {
    try {
      const stored = (globalThis as any).localStorage?.getItem(LOCALSTORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return {};
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return {};
    }
  }

  // Browser without persistent cache: use in-memory cache
  if (isBrowser) {
    return memoryCache;
  }

  // Node.js: use file-based cache
  try {
    const fs = require("fs");
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

export function writeCache(cache: Record<string, CachedTemplate>): void {
  const config = getConfig();

  // Browser with persistent cache: use localStorage
  if (isBrowser && config.persistentCache) {
    try {
      (globalThis as any).localStorage?.setItem(LOCALSTORAGE_KEY, JSON.stringify(cache));
      return;
    } catch (error) {
      console.warn("Failed to write to localStorage:", error);
      // Fallback to in-memory cache
      memoryCache = cache;
      return;
    }
  }

  // Browser without persistent cache: use in-memory cache
  if (isBrowser) {
    memoryCache = cache;
    return;
  }

  // Node.js: write to file
  try {
    const fs = require("fs");
    const cachePath = getCacheFilePath();
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2), "utf-8");
  } catch (error) {
    console.warn("Failed to write cache:", error);
  }
}

export async function getCachedTemplate(schemaHash: string, apiKeyId?: string): Promise<CachedTemplate | null> {
  // Only use Supabase in Node.js environment when authenticated
  if (isNode) {
    try {
      const session: any = null; // Auth removed for browser compatibility
      if (session && session.userId) {
        // Get current project ID from session
        const projectId = session.currentProjectId;

        // Try Supabase first (with project_id if available)
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

  // Fallback to local cache
  const cache = readCache();
  return cache[schemaHash] || null;
}

export async function setCachedTemplate(schemaHash: string, template: any, path?: string): Promise<void> {
  // Write to local cache first
  const cache = readCache();
  cache[schemaHash] = {
    template,
    timestamp: Date.now(),
    schemaHash,
    path, // Track the endpoint path
  };
  writeCache(cache);

  // Also write to Supabase if authenticated (Node.js only)
  if (isNode) {
    try {
      const session: any = null; // Auth removed for browser compatibility

      if (session && session.userId) {
        // Get current project ID from session
        const projectId = session.currentProjectId;

        const success = await setSupabaseCacheEntry(schemaHash, template, session.userId, undefined, session.accessToken, projectId, path);
        if (success) {
          console.log("[Symulate] Cache saved to Supabase");
        }
      }
    } catch (error) {
      console.warn("[Symulate] Failed to write to Supabase cache:", error);
      // Continue - local cache was already written
    }
  }
}

export async function clearCache(apiKeyId?: string): Promise<void> {
  console.log("[Symulate] Clearing all cache...");

  // Browser: clear both in-memory and localStorage cache
  if (isBrowser) {
    memoryCache = {};

    // Also clear localStorage if it exists
    try {
      (globalThis as any).localStorage?.removeItem(LOCALSTORAGE_KEY);
      console.log("[Symulate] ✓ Cache cleared from memory and localStorage");
    } catch (error) {
      console.warn("Failed to clear localStorage cache:", error);
    }
    return;
  }

  // Node.js: delete cache file and Supabase cache
  try {
    const fs = require("fs");
    const cachePath = getCacheFilePath();
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath);
      console.log("[Symulate] ✓ Cache file deleted:", cachePath);
    } else {
      console.log("[Symulate] No cache file to delete");
    }

    // Also clear from Supabase if authenticated
    const session: any = null; // Auth removed for browser compatibility
    if (session && session.userId) {
      // Get current project ID from session
      const projectId = session.currentProjectId;

      if (!projectId) {
        console.warn("[Symulate] ⚠️  No project selected. Cache will only be cleared for user-owned entries.");
        console.log("[Symulate] Run 'npx symulate projects list' and 'npx symulate projects use <project-id>' to select a project.");
      } else {
        console.log(`[Symulate] Clearing cache for project: ${projectId}`);
      }

      const success = await clearSupabaseCache(session.userId, session.accessToken, apiKeyId, projectId);
      if (success) {
        console.log("[Symulate] ✓ Supabase cache cleared");
      } else {
        console.warn("[Symulate] ✗ Failed to clear Supabase cache");
      }
    } else {
      console.log("[Symulate] Not authenticated - Supabase cache not cleared");
      console.log("[Symulate] Run 'npx symulate login' to clear cloud cache");
    }
  } catch (error) {
    console.warn("Failed to clear cache:", error);
  }
}

export function debugCache(): void {
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

/**
 * Get cache entries with metadata for preview
 */
export function getCacheEntries(): Array<{ hash: string; timestamp: number; dataPreview: string; path?: string }> {
  const cache = readCache();
  return Object.entries(cache).map(([hash, entry]) => ({
    hash,
    timestamp: entry.timestamp,
    dataPreview: JSON.stringify(entry.template).slice(0, 100) + "...",
    path: entry.path,
  }));
}

/**
 * Get detailed cache entry by hash
 */
export function getCacheEntryByHash(hash: string): CachedTemplate | null {
  const cache = readCache();
  return cache[hash] || null;
}

/**
 * Get cache entries matching a pattern
 */
export function getCacheEntriesByPattern(pattern: string): Array<{ hash: string; timestamp: number; dataPreview: string; fullData: any }> {
  const cache = readCache();
  return Object.entries(cache)
    .filter(([hash]) => hash.includes(pattern))
    .map(([hash, entry]) => ({
      hash,
      timestamp: entry.timestamp,
      dataPreview: JSON.stringify(entry.template).slice(0, 100) + "...",
      fullData: entry.template,
    }));
}

/**
 * Get all cache entries from Supabase for the authenticated user's current project
 */
export async function getSupabaseCacheEntries(apiKeyId?: string): Promise<Array<{ hash: string; timestamp: number; dataPreview: string; userId: string; apiKeyId?: string; projectId?: string; path?: string }>> {
  try {
    const session: any = null; // Auth removed for browser compatibility
    if (!session || !session.userId) {
      console.warn("[Symulate] Not authenticated. Run 'npx symulate login' first.");
      return [];
    }

    // Get current project ID from session
    const projectId = session.currentProjectId;

    // Use access token if available for authenticated requests
    const authHeader = session.accessToken ? `Bearer ${session.accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;

    // Build query URL with project_id filter (or user_id filter if no project selected)
    let url = `${PLATFORM_CONFIG.api.rest}/mockend_cache?`;

    if (projectId) {
      // Filter by project_id for project-scoped cache
      url += `project_id=eq.${projectId}`;
    } else {
      // Fallback to user_id filter for legacy user-owned cache
      url += `user_id=eq.${session.userId}`;
      console.warn("[Symulate] ⚠️  No project selected. Showing user-owned cache only.");
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
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[Symulate] Failed to fetch from Supabase cache:", response.statusText);
      console.warn("[Symulate] Error details:", errorText);
      return [];
    }

    const data = await response.json() as any[];

    return data.map((entry: any) => ({
      hash: entry.schema_hash,
      timestamp: new Date(entry.created_at).getTime(),
      dataPreview: JSON.stringify(entry.template).slice(0, 100) + "...",
      userId: entry.user_id,
      apiKeyId: entry.api_key_id,
      projectId: entry.project_id,
      path: entry.path,
    }));
  } catch (error) {
    console.warn("[Symulate] Error fetching Supabase cache entries:", error);
    return [];
  }
}

/**
 * Get specific cache entry from Supabase by hash
 */
export async function getSupabaseCacheEntryByHash(hash: string, apiKeyId?: string): Promise<CachedTemplate | null> {
  try {
    const session: any = null; // Auth removed for browser compatibility
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

/**
 * Delete a specific Supabase cache entry by hash
 */
async function deleteSupabaseCacheByHash(hash: string, userId: string, accessToken?: string, apiKeyId?: string, projectId?: string): Promise<boolean> {
  try {
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;

    // Build query URL with optional api_key_id and project_id filters
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
        "Content-Type": "application/json",
      },
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

/**
 * Clear cache for a specific endpoint by hash (checks both local and Supabase)
 */
export async function clearCacheByHash(hash: string, apiKeyId?: string): Promise<boolean> {
  let foundLocal = false;
  let foundSupabase = false;

  // Try local cache first
  const cache = readCache();
  if (cache[hash]) {
    delete cache[hash];
    writeCache(cache);
    console.log(`[Symulate] ✓ Cleared local cache entry: ${hash}`);
    foundLocal = true;
  }

  // Also try Supabase if authenticated (Node.js only)
  if (isNode) {
    try {
      const session: any = null; // Auth removed for browser compatibility
      if (session && session.userId) {
        // Get current project ID from session
        const projectId = session.currentProjectId;

        const success = await deleteSupabaseCacheByHash(hash, session.userId, session.accessToken, apiKeyId, projectId);
        if (success) {
          console.log(`[Symulate] ✓ Cleared Supabase cache entry: ${hash}`);
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

  console.log(`[Symulate] ✗ Cache entry not found: ${hash}`);
  return false;
}

/**
 * Clear all cache entries matching a pattern
 */
export function clearCacheByPattern(pattern: string): number {
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
    console.log(`[Symulate] ✓ Cleared ${clearedCount} cache entries matching "${pattern}"`);
  } else {
    console.log(`[Symulate] ✗ No cache entries found matching "${pattern}"`);
  }

  return clearedCount;
}

/**
 * Delete Supabase cache entries for a specific path
 */
async function deleteSupabaseCacheByPath(path: string, userId: string, accessToken?: string, apiKeyId?: string, projectId?: string): Promise<number> {
  try {
    const authHeader = accessToken ? `Bearer ${accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;

    // Build query URL with path filter
    let url = `${PLATFORM_CONFIG.api.rest}/mockend_cache?path=eq.${encodeURIComponent(path)}&user_id=eq.${userId}`;
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
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
    });

    if (!response.ok) {
      console.warn("[Symulate] Failed to delete from Supabase cache by path");
      return 0;
    }

    const deleted = await response.json() as any[];
    return deleted.length;
  } catch (error) {
    console.warn("[Symulate] Error deleting from Supabase cache by path:", error);
    return 0;
  }
}

/**
 * Clear all cache entries for a specific endpoint path (checks both local and Supabase)
 */
export async function clearCacheByPath(path: string, apiKeyId?: string): Promise<number> {
  let clearedCount = 0;

  // Clear from local cache
  const cache = readCache();
  for (const [hash, entry] of Object.entries(cache)) {
    if (entry.path === path) {
      delete cache[hash];
      clearedCount++;
    }
  }

  if (clearedCount > 0) {
    writeCache(cache);
    console.log(`[Symulate] ✓ Cleared ${clearedCount} local cache entry(ies) for path: ${path}`);
  }

  // Also clear from Supabase if authenticated (Node.js only)
  if (isNode) {
    try {
      const session: any = null; // Auth removed for browser compatibility
      if (session && session.userId) {
        // Get current project ID from session
        const projectId = session.currentProjectId;

        const supabaseCount = await deleteSupabaseCacheByPath(path, session.userId, session.accessToken, apiKeyId, projectId);
        if (supabaseCount > 0) {
          console.log(`[Symulate] ✓ Cleared ${supabaseCount} Supabase cache entry(ies) for path: ${path}`);
          clearedCount += supabaseCount;
        }
      }
    } catch (error) {
      console.warn("[Symulate] Error clearing Supabase cache by path:", error);
    }
  }

  if (clearedCount === 0) {
    console.log(`[Symulate] ✗ No cache entries found for path: ${path}`);
  }

  return clearedCount;
}
