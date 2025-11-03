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
        if (configFile === 'symulate.config.js') {
          console.warn(`[Symulate] Tip: If using ES modules, rename to 'symulate.config.mjs' or add "type": "module" to package.json`);
        }
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

    console.log(`[Symulate] Found ${entryFiles.length} file(s) to load`);

    let loadedCount = 0;
    for (const entryPath of entryFiles) {
      try {
        console.log(`[Symulate] Loading: ${path.relative(cwd, entryPath)}`);

        // Set the current file context before importing
        const { setCurrentFile } = await import('./defineEndpoint');
        const relativeFilename = path.relative(cwd, entryPath);
        setCurrentFile(relativeFilename);

        // For TypeScript files, compile on-the-fly and then import
        let fileToImport = entryPath;
        if (isTypeScriptFile(entryPath)) {
          try {
            // Use esbuild to transpile TypeScript to JavaScript
            const { transform } = require('esbuild');
            const tsCode = fs.readFileSync(entryPath, 'utf-8');

            const result = await transform(tsCode, {
              loader: 'ts',
              format: 'esm',
              target: 'node16',
              sourcefile: entryPath,
            });

            // Write transpiled code to temp file
            const tmpFile = entryPath.replace(/\.ts$/, '.tmp.mjs');
            fs.writeFileSync(tmpFile, result.code);
            fileToImport = tmpFile;

            // Import the transpiled file
            const fileUrl = pathToFileURL(fileToImport).href;
            await import(fileUrl);

            // Clean up temp file
            fs.unlinkSync(tmpFile);
          } catch (error: any) {
            throw new Error(`TypeScript compilation failed: ${error.message}`);
          }
        } else {
          // For JavaScript files, import directly
          const fileUrl = pathToFileURL(fileToImport).href;
          await import(fileUrl);
        }

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
        try {
          const { setCurrentFile } = await import('./defineEndpoint');
          setCurrentFile(null);
        } catch (e) {
          // Ignore if we can't clear context
        }
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
