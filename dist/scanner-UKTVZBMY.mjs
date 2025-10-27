import {
  IS_DEBUG,
  init_env
} from "./chunk-HMEUN2V3.mjs";
import "./chunk-CIESM3BP.mjs";

// src/scanner.ts
init_env();
import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";
function findFiles(dir, extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs"], ignore = ["node_modules", ".git", "dist", "build", ".next", ".nuxt"]) {
  const files = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
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
  }
  return files;
}
function fileContainsEndpoints(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
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
      const fileUrl = pathToFileURL(filePath).href;
      await import(fileUrl);
    } catch (error) {
      if (IS_DEBUG) {
        console.warn(`[Symulate] Warning: Could not load ${filePath}: ${error.message}`);
      }
    }
  }
  return endpointFiles.length;
}
export {
  scanAndLoadEndpoints
};
