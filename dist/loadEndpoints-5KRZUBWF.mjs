import {
  IS_DEBUG,
  init_env
} from "./chunk-HMEUN2V3.mjs";
import {
  __require
} from "./chunk-CIESM3BP.mjs";

// src/loadEndpoints.ts
init_env();
import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
import { glob } from "glob";
function isTypeScriptFile(filePath) {
  return /\.(ts|tsx|mts)$/.test(filePath);
}
async function loadConfig(cwd = process.cwd()) {
  const configFiles = ["symulate.config.js", "symulate.config.mjs", "symulate.config.cjs"];
  for (const configFile of configFiles) {
    const configPath = path.join(cwd, configFile);
    if (fs.existsSync(configPath)) {
      try {
        const fileUrl = pathToFileURL(configPath).href;
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
      const matches = await glob(pattern, {
        cwd,
        absolute: true,
        nodir: true,
        ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/.nuxt/**", "**/.next/**"]
      });
      allFiles.push(...matches);
    } else {
      const fullPath = path.resolve(cwd, pattern);
      if (fs.existsSync(fullPath)) {
        allFiles.push(fullPath);
      } else {
        console.warn(`[Symulate] Warning: Entry file not found: ${pattern}`);
      }
    }
  }
  return allFiles;
}
var tsxEnabled = false;
function enableTypeScriptExecution() {
  if (tsxEnabled) return;
  try {
    const tsx = __require("tsx/cjs/api");
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
          console.log(`[Symulate] Loading: ${path.relative(cwd, entryPath)}`);
        }
        const fileUrl = pathToFileURL(entryPath).href;
        if (IS_DEBUG) {
          console.log(`[Symulate] Importing: ${fileUrl}`);
        }
        const { setCurrentFile } = await import("./defineEndpoint-3SZPBP6M.mjs");
        const relativeFilename = path.relative(cwd, entryPath);
        setCurrentFile(relativeFilename);
        await import(fileUrl);
        loadedCount++;
        setCurrentFile(null);
        if (IS_DEBUG) {
          console.log(`[Symulate] Successfully loaded: ${relativeFilename}`);
        }
      } catch (error) {
        console.error(`[Symulate] Error loading ${path.relative(cwd, entryPath)}: ${error.message}`);
        if (IS_DEBUG) {
          console.error(`[Symulate] Full error:`, error);
          console.error(error.stack);
        }
        const { setCurrentFile } = await import("./defineEndpoint-3SZPBP6M.mjs");
        setCurrentFile(null);
      }
    }
    return loadedCount;
  }
  console.log("[Symulate] No config found. Attempting to scan project...");
  const { scanAndLoadEndpoints } = await import("./scanner-UKTVZBMY.mjs");
  return await scanAndLoadEndpoints(cwd);
}
export {
  loadEndpoints
};
