import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { glob } from 'glob';
import { execSync } from 'child_process';
import { IS_DEBUG } from './env';

/**
 * Load endpoints configuration
 * Looks for symulate.config.js or symulate.config.mjs in the project root
 */
interface MockendConfig {
  /** Entry file(s) that define endpoints - supports glob patterns */
  entries?: string | string[];
  /** Root directory to scan (defaults to cwd) */
  root?: string;
}

/**
 * Check if a file is a TypeScript file
 */
function isTypeScriptFile(filePath: string): boolean {
  return /\.(ts|tsx|mts)$/.test(filePath);
}

async function loadConfig(cwd: string = process.cwd()): Promise<MockendConfig | null> {
  const configFiles = ['symulate.config.js', 'symulate.config.mjs', 'symulate.config.cjs'];

  for (const configFile of configFiles) {
    const configPath = path.join(cwd, configFile);

    if (fs.existsSync(configPath)) {
      try {
        const fileUrl = pathToFileURL(configPath).href;
        const config = await import(fileUrl);
        return config.default || config;
      } catch (error: any) {
        console.warn(`[Symulate] Warning: Could not load ${configFile}: ${error.message}`);
      }
    }
  }

  return null;
}

/**
 * Expand glob patterns to actual file paths
 */
async function expandGlobPatterns(patterns: string[], cwd: string): Promise<string[]> {
  const allFiles: string[] = [];

  for (const pattern of patterns) {
    // Check if pattern contains glob characters
    const isGlob = pattern.includes('*') || pattern.includes('?') || pattern.includes('[');

    if (isGlob) {
      // Use glob to find matching files
      const matches = await glob(pattern, {
        cwd,
        absolute: true,
        nodir: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.nuxt/**', '**/.next/**'],
      });

      allFiles.push(...matches);
    } else {
      // Direct file path
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

/**
 * Enable TypeScript execution using tsx
 */
let tsxEnabled = false;
function enableTypeScriptExecution() {
  if (tsxEnabled) return;

  try {
    // Register tsx to enable TypeScript execution
    const tsx = require('tsx/cjs/api');
    tsx.register();
    tsxEnabled = true;

    if (IS_DEBUG) {
      console.log('[Symulate] TypeScript execution enabled');
    }
  } catch (error: any) {
    console.warn('[Symulate] Warning: Could not enable TypeScript execution:', error.message);
    console.warn('[Symulate] TypeScript files (.ts) will not be loaded. Please ensure files are compiled to JavaScript.');
  }
}

/**
 * Load endpoint definitions from configured entry files or scan the project
 */
export async function loadEndpoints(): Promise<number> {
  const cwd = process.cwd();

  // Try to load from config first
  const config = await loadConfig(cwd);

  if (config?.entries) {
    const entryPatterns = Array.isArray(config.entries) ? config.entries : [config.entries];
    console.log(`[Symulate] Resolving entry patterns...`);

    // Expand glob patterns
    const entryFiles = await expandGlobPatterns(entryPatterns, cwd);

    if (entryFiles.length === 0) {
      console.warn('[Symulate] Warning: No files matched the entry patterns');
      return 0;
    }

    // Check if any files are TypeScript - if so, enable TypeScript execution
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

        // Set the current file context before importing
        const { setCurrentFile } = await import('./defineEndpoint');
        const relativeFilename = path.relative(cwd, entryPath);
        setCurrentFile(relativeFilename);

        await import(fileUrl);
        loadedCount++;

        // Clear the context after loading
        setCurrentFile(null);

        if (IS_DEBUG) {
          console.log(`[Symulate] Successfully loaded: ${relativeFilename}`);
        }
      } catch (error: any) {
        console.error(`[Symulate] Error loading ${path.relative(cwd, entryPath)}: ${error.message}`);
        if (IS_DEBUG) {
          console.error(`[Symulate] Full error:`, error);
          console.error(error.stack);
        }
        // Clear context even on error
        const { setCurrentFile } = await import('./defineEndpoint');
        setCurrentFile(null);
      }
    }

    return loadedCount;
  }

  // Fallback: try scanning node_modules for compiled SDK
  console.log('[Symulate] No config found. Attempting to scan project...');

  // If no config, try to scan the project
  const { scanAndLoadEndpoints } = await import('./scanner');
  return await scanAndLoadEndpoints(cwd);
}
