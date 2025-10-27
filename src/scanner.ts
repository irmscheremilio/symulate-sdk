import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { IS_DEBUG } from './env';

/**
 * Recursively find all TypeScript/JavaScript files in a directory
 */
function findFiles(
  dir: string,
  extensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.mjs'],
  ignore: string[] = ['node_modules', '.git', 'dist', 'build', '.next', '.nuxt']
): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Skip ignored directories
      if (entry.isDirectory()) {
        if (!ignore.includes(entry.name)) {
          files.push(...findFiles(fullPath, extensions, ignore));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Ignore permission errors
  }

  return files;
}

/**
 * Check if a file contains endpoint definitions
 */
function fileContainsEndpoints(filePath: string): boolean {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Check if file imports mockend and uses defineMockEndpoint
    return (
      (content.includes('@symulate/sdk') || content.includes('defineMockEndpoint')) &&
      content.includes('defineMockEndpoint(')
    );
  } catch (error) {
    return false;
  }
}

/**
 * Scan project for endpoint definitions and import them
 * This will execute the files and populate the registeredEndpoints Map
 */
export async function scanAndLoadEndpoints(projectRoot: string = process.cwd()): Promise<number> {
  console.log(`[Symulate] Scanning project at: ${projectRoot}`);

  // Find all potential files
  const allFiles = findFiles(projectRoot);

  // Filter to files that likely contain endpoint definitions
  const endpointFiles = allFiles.filter(fileContainsEndpoints);

  if (endpointFiles.length === 0) {
    return 0;
  }

  console.log(`[Symulate] Found ${endpointFiles.length} file(s) with endpoint definitions`);

  // Import each file to trigger endpoint registration
  for (const filePath of endpointFiles) {
    try {
      // Convert to file URL for dynamic import
      const fileUrl = pathToFileURL(filePath).href;

      // Dynamic import - this will execute the file and register endpoints
      await import(fileUrl);
    } catch (error: any) {
      // Log errors but continue scanning other files
      if (IS_DEBUG) {
        console.warn(`[Symulate] Warning: Could not load ${filePath}: ${error.message}`);
      }
    }
  }

  return endpointFiles.length;
}
