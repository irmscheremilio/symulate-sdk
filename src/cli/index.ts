#!/usr/bin/env node

// Suppress the punycode deprecation warning (comes from bundled dependencies)
process.removeAllListeners('warning');

import { Command } from "commander";
import * as path from "path";
import { generateOpenAPISpec, saveOpenAPISpec } from "./openapi";

const program = new Command();

program
  .name("mockend")
  .description("Mockend CLI - AI-powered frontend-first development toolkit")
  .version("1.0.0");

program
  .command("openapi")
  .description("Generate OpenAPI specification from endpoint definitions and collections")
  .option("-o, --output <path>", "Output file path", "./openapi.json")
  .option("-t, --title <title>", "API title", "Mockend Generated API")
  .option("-v, --version <version>", "API version", "1.0.0")
  .option("-d, --description <description>", "API description")
  .option("-s, --server <url>", "Server URL (e.g., https://api.example.com)")
  .option("--no-collections", "Exclude collections from the spec")
  .action(async (options) => {
    try {
      console.log("Loading endpoint definitions and collections...");

      // Load endpoint definitions from the project
      const { loadEndpoints } = await import("../loadEndpoints");
      await loadEndpoints();

      const { getRegisteredEndpoints } = await import("../defineEndpoint");
      const endpoints = getRegisteredEndpoints();

      // Load collections
      const { exportCollectionsArray } = await import("../collectionRegistry");
      const collections = options.collections !== false ? exportCollectionsArray() : [];

      if (endpoints.size === 0 && collections.length === 0) {
        console.warn("⚠ No endpoints or collections found.");
        console.warn("Create a symulate.config.js file to specify your endpoint entry files.");
        process.exit(1);
      }

      console.log(`Found ${endpoints.size} endpoint(s) and ${collections.length} collection(s)`);

      const spec = generateOpenAPISpec(endpoints, {
        title: options.title,
        version: options.version,
        description: options.description,
        serverUrl: options.server,
        collections,
      });

      const outputPath = path.resolve(process.cwd(), options.output);
      saveOpenAPISpec(spec, outputPath);

      console.log("✓ Done!");
    } catch (error) {
      console.error("Error generating OpenAPI spec:", error);
      process.exit(1);
    }
  });

program
  .command("cache")
  .description("Inspect cached mock data")
  .option("-l, --list", "List all cached entries")
  .option("-h, --hash <hash>", "Show details for a specific hash")
  .option("-s, --search <pattern>", "Search for entries matching pattern")
  .option("-f, --full", "Show full data instead of preview")
  .option("--remote", "Show Supabase cache instead of local cache")
  .option("-k, --key <api-key>", "Filter by API key ID")
  .action(async (options) => {
    try {
      const {
        getCacheEntries,
        getCacheEntryByHash,
        getCacheEntriesByPattern,
        getSupabaseCacheEntries,
        getSupabaseCacheEntryByHash
      } = await import("../cache");

      // Show specific hash
      if (options.hash) {
        let entry;

        // Try Supabase first (if authenticated), then fall back to local
        entry = await getSupabaseCacheEntryByHash(options.hash, options.key);

        if (!entry) {
          entry = getCacheEntryByHash(options.hash);
        }

        if (!entry) {
          console.log(`✗ Cache entry not found: ${options.hash}`);
          process.exit(1);
        }

        console.log(`\n📦 Cache Entry: ${options.hash}`);
        console.log(`   Cached: ${new Date(entry.timestamp).toLocaleString()}`);
        console.log(`   Schema Hash: ${entry.schemaHash}`);
        console.log(`\n   Data:`);
        console.log(JSON.stringify(entry.template, null, 2));
        return;
      }

      // Search by pattern
      if (options.search) {
        const entries = getCacheEntriesByPattern(options.search);

        if (entries.length === 0) {
          console.log(`✗ No cache entries found matching "${options.search}"`);
          return;
        }

        console.log(`\n🔍 Found ${entries.length} cache entry(ies) matching "${options.search}":\n`);
        entries.forEach((entry, index) => {
          console.log(`  [${index + 1}] Hash: ${entry.hash}`);
          console.log(`      Cached: ${new Date(entry.timestamp).toLocaleString()}`);
          if (options.full) {
            console.log(`      Data:`);
            console.log(`      ${JSON.stringify(entry.fullData, null, 2).split('\n').join('\n      ')}`);
          } else {
            console.log(`      Preview: ${entry.dataPreview}`);
          }
          console.log();
        });
        return;
      }

      // List all (default) - check both local and Supabase
      let entries = getCacheEntries();
      let supabaseEntries: any[] = [];

      // Try Supabase if authenticated or --remote flag
      if (options.remote) {
        supabaseEntries = await getSupabaseCacheEntries(options.key);
        entries = []; // Only show Supabase when --remote flag is used
      } else {
        // Show both local and Supabase
        supabaseEntries = await getSupabaseCacheEntries(options.key);
      }

      const totalLocal = entries.length;
      const totalSupabase = supabaseEntries.length;

      if (totalLocal === 0 && totalSupabase === 0) {
        console.log("📋 No cached data found");
        console.log("\n💡 Tip: Make some API calls to generate cache");
        if (!options.remote) {
          console.log("💡 Run 'npx symulate login' to sync cache to Supabase");
        }
        return;
      }

      // Show local cache
      if (totalLocal > 0 && !options.remote) {
        console.log(`\n📁 Local Cache (${totalLocal} total):\n`);
        entries.forEach((entry, index) => {
          console.log(`  [${index + 1}] Hash: ${entry.hash}`);
          if (entry.path) {
            console.log(`      Path: ${entry.path}`);
          }
          console.log(`      Cached: ${new Date(entry.timestamp).toLocaleString()}`);
          console.log(`      Preview: ${entry.dataPreview}`);
          console.log();
        });
      }

      // Show Supabase cache
      if (totalSupabase > 0) {
        console.log(`\n☁️  Supabase Cache (${totalSupabase} total):\n`);
        supabaseEntries.forEach((entry, index) => {
          console.log(`  [${index + 1}] Hash: ${entry.hash}`);
          if (entry.path) {
            console.log(`      Path: ${entry.path}`);
          }
          console.log(`      Cached: ${new Date(entry.timestamp).toLocaleString()}`);
          console.log(`      Preview: ${entry.dataPreview}`);
          console.log();
        });
      }

      console.log("💡 Tips:");
      console.log("   - Use 'npx symulate cache --hash <hash>' to see full data");
      console.log("   - Use 'npx symulate cache --remote' to see only Supabase cache");
      console.log("   - Use 'npx symulate cache --search <pattern>' to filter entries");
      console.log("   - Use 'npx symulate regenerate --hash <hash>' to clear specific entry");
    } catch (error) {
      console.error("Error inspecting cache:", error);
      process.exit(1);
    }
  });

program
  .command("clear-cache")
  .description("Clear the Mockend cache file")
  .option("-k, --key <api-key>", "Filter by API key ID")
  .action(async (options) => {
    try {
      const { clearCache } = await import("../cache");
      await clearCache(options.key);
      console.log("✓ Cache cleared successfully");
    } catch (error) {
      console.error("Error clearing cache:", error);
      process.exit(1);
    }
  });

program
  .command("regenerate")
  .description("Regenerate mock data by clearing the cache")
  .option("-e, --endpoint <pattern>", "Clear cache for endpoints matching this pattern")
  .option("-p, --preview", "Preview cached endpoints without clearing")
  .option("-h, --hash <hash>", "Clear cache for a specific hash")
  .option("--path <path>", "Clear cache for a specific endpoint path (e.g., /api/users)")
  .option("-k, --key <api-key>", "Filter by API key ID")
  .action(async (options) => {
    try {
      const { clearCache, clearCacheByHash, clearCacheByPattern, clearCacheByPath, getCacheEntries } = await import("../cache");

      // Preview mode - show what's cached
      if (options.preview) {
        console.log("📋 Cached Endpoints:");
        const entries = getCacheEntries();

        if (entries.length === 0) {
          console.log("  No cached data found");
          return;
        }

        entries.forEach((entry, index) => {
          console.log(`\n  [${index + 1}] Hash: ${entry.hash}`);
          if (entry.path) {
            console.log(`      Path: ${entry.path}`);
          }
          console.log(`      Cached: ${new Date(entry.timestamp).toLocaleString()}`);
          console.log(`      Preview: ${entry.dataPreview}`);
        });

        console.log(`\n  Total: ${entries.length} cached endpoint(s)`);
        console.log("\n💡 Tip: Run 'npx symulate regenerate' to clear all cache");
        console.log("        Run 'npx symulate regenerate --hash <hash>' to clear specific entry");
        console.log("        Run 'npx symulate regenerate --path <path>' to clear by endpoint path");
        return;
      }

      // Clear specific hash
      if (options.hash) {
        const cleared = await clearCacheByHash(options.hash, options.key);
        if (cleared) {
          console.log("✓ Cache entry cleared. Mock data will regenerate on next request.");
        } else {
          console.log("✗ Cache entry not found");
          process.exit(1);
        }
        return;
      }

      // Clear by endpoint path
      if (options.path) {
        const count = await clearCacheByPath(options.path, options.key);
        if (count > 0) {
          console.log(`✓ Cleared ${count} cache entry(ies) for path "${options.path}". Mock data will regenerate on next request.`);
        } else {
          console.log(`✗ No cache entries found for path "${options.path}"`);
          process.exit(1);
        }
        return;
      }

      // Clear by endpoint pattern
      if (options.endpoint) {
        const count = clearCacheByPattern(options.endpoint);
        if (count > 0) {
          console.log(`✓ Cleared ${count} cache entry(ies). Mock data will regenerate on next request.`);
        } else {
          console.log(`✗ No cache entries found matching "${options.endpoint}"`);
          process.exit(1);
        }
        return;
      }

      // Clear all cache (default)
      await clearCache(options.key);
      console.log("✓ All cache cleared successfully");
      console.log("💡 Mock data will regenerate on next request");
    } catch (error) {
      console.error("Error regenerating cache:", error);
      process.exit(1);
    }
  });

program
  .command("login")
  .description("Authenticate with Mockend Platform")
  .action(async () => {
    try {
      const { login } = await import("../auth");
      const success = await login();
      if (!success) {
        process.exit(1);
      }
    } catch (error) {
      console.error("Error during login:", error);
      process.exit(1);
    }
  });

program
  .command("logout")
  .description("Clear your Mockend Platform session")
  .action(async () => {
    try {
      const { logout } = await import("../auth");
      logout();
    } catch (error) {
      console.error("Error during logout:", error);
      process.exit(1);
    }
  });

program
  .command("whoami")
  .description("Show information about the current authenticated user")
  .action(async () => {
    try {
      const { whoami } = await import("../auth");
      whoami();
    } catch (error) {
      console.error("Error getting user info:", error);
      process.exit(1);
    }
  });

program
  .command("api-keys")
  .description("List all API keys for the authenticated user")
  .action(async () => {
    try {
      const { getApiKeys, displayApiKeys } = await import("../apiKeys");
      const keys = await getApiKeys();
      displayApiKeys(keys);
    } catch (error) {
      console.error("Error getting API keys:", error);
      process.exit(1);
    }
  });

// Organizations command group
const orgsCommand = program
  .command("orgs")
  .description("Manage organizations");

orgsCommand
  .command("list")
  .description("List all organizations you belong to")
  .action(async () => {
    try {
      const {
        getUserOrganizations,
        displayOrganizations,
      } = await import("../organizations");
      const { getCurrentContext } = await import("../auth");

      const orgs = await getUserOrganizations();
      const { orgId } = getCurrentContext();

      displayOrganizations(orgs, orgId);
    } catch (error) {
      console.error("Error listing organizations:", error);
      process.exit(1);
    }
  });

orgsCommand
  .command("use <org-identifier>")
  .description("Switch to a different organization (accepts org ID or slug)")
  .action(async (orgIdentifier: string) => {
    try {
      const { setCurrentOrganization } = await import("../auth");
      const { getUserOrganizations } = await import("../organizations");

      // Verify the organization exists and user has access
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

// Projects command group
const projectsCommand = program
  .command("projects")
  .description("Manage projects in the current organization");

projectsCommand
  .command("list")
  .description("List all projects in the current organization")
  .action(async () => {
    try {
      const {
        getOrganizationProjects,
        displayProjects,
      } = await import("../organizations");
      const { getCurrentContext } = await import("../auth");

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

projectsCommand
  .command("use <project-identifier>")
  .description("Switch to a different project (accepts project ID or slug)")
  .action(async (projectIdentifier: string) => {
    try {
      const { setCurrentProject, getCurrentContext } = await import("../auth");
      const { getOrganizationProjects } = await import("../organizations");

      const { orgId } = getCurrentContext();

      if (!orgId) {
        console.error(
          "[Symulate] No organization selected. Please select an organization first."
        );
        console.log("[Symulate] Run 'npx symulate orgs use <org-identifier>' to select one");
        process.exit(1);
      }

      // Verify the project exists and belongs to current organization
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

// Collections command group
const collectionsCommand = program
  .command("collections")
  .description("Manage stateful collections");

collectionsCommand
  .command("list")
  .description("List all collections for current project")
  .option("-b, --branch <name>", "Filter by branch name")
  .action(async (options) => {
    try {
      const { getCurrentContext, getAuthSession } = await import("../auth");
      const { orgId, projectId } = getCurrentContext();
      const session = getAuthSession();

      if (!session || !session.accessToken || !orgId || !projectId) {
        console.error(
          "[Symulate] Missing context. Please login and select an organization/project first."
        );
        console.log("[Symulate] Run 'npx symulate login' to get started");
        process.exit(1);
      }

      const { listCollections } = await import("./collections");
      await listCollections({
        accessToken: session.accessToken,
        projectId,
        branch: options.branch
      });
    } catch (error) {
      console.error("Error listing collections:", error);
      process.exit(1);
    }
  });

collectionsCommand
  .command("delete")
  .description("Delete collection data")
  .option("-n, --name <collection>", "Collection name to delete")
  .option("-b, --branch <name>", "Delete only from specific branch")
  .option("--all", "Delete all collections (with confirmation)")
  .action(async (options) => {
    try {
      const { getCurrentContext, getAuthSession } = await import("../auth");
      const { orgId, projectId } = getCurrentContext();
      const session = getAuthSession();

      if (!session || !session.accessToken || !orgId || !projectId) {
        console.error(
          "[Symulate] Missing context. Please login and select an organization/project first."
        );
        console.log("[Symulate] Run 'npx symulate login' to get started");
        process.exit(1);
      }

      const { deleteCollections } = await import("./collections");
      await deleteCollections({
        accessToken: session.accessToken,
        projectId,
        name: options.name,
        branch: options.branch,
        all: options.all,
      });
    } catch (error) {
      console.error("Error deleting collections:", error);
      process.exit(1);
    }
  });

collectionsCommand
  .command("pregenerate")
  .description("Pre-generate all defined collections")
  .option("-b, --branch <name>", "Target branch (default: main)")
  .action(async (options) => {
    try {
      const { getCurrentContext, getAuthSession } = await import("../auth");
      const { orgId, projectId } = getCurrentContext();
      const session = getAuthSession();

      if (!session || !session.accessToken || !orgId || !projectId) {
        console.error(
          "[Symulate] Missing context. Please login and select an organization/project first."
        );
        console.log("[Symulate] Run 'npx symulate login' to get started");
        process.exit(1);
      }

      const { pregenerateCollections } = await import("./collections");
      await pregenerateCollections({
        accessToken: session.accessToken,
        projectId,
        branch: options.branch,
      });
    } catch (error) {
      console.error("Error pre-generating collections:", error);
      process.exit(1);
    }
  });

// Sync command
program
  .command("sync")
  .description("Sync local endpoint definitions to Mockend Platform")
  .action(async () => {
    try {
      const { syncEndpoints } = await import("../sync");
      await syncEndpoints();
    } catch (error) {
      console.error("Error syncing endpoints:", error);
      process.exit(1);
    }
  });

// Import schema command
program
  .command("import-schema")
  .description("Import database schema types from Symulate Platform")
  .option("-o, --output <path>", "Output file path", "./src/types/database.d.ts")
  .option("--schema-name <name>", "Specific schema name to import")
  .option("--update", "Update existing file instead of creating new one")
  .action(async (options) => {
    try {
      const { importSchema } = await import("./schema-import");
      await importSchema(options);
    } catch (error) {
      console.error("Error importing schema:", error);
      process.exit(1);
    }
  });

program.parse();
