import { getRegisteredEndpoints } from "./defineEndpoint";
import { getCurrentContext, getAuthSession } from "./auth";
import { PLATFORM_CONFIG } from "./platformConfig";
import type { EndpointConfig } from "./types";
import { IS_DEBUG } from "./env";

interface RemoteEndpoint {
  id: string;
  project_id: string;
  endpoint_key: string;
  method: string;
  path: string;
  config: any;
  synced_at: string;
}

interface SyncResult {
  action: 'created' | 'updated' | 'deleted';
  endpoint_key: string;
  method: string;
  path: string;
}

/**
 * Normalize endpoint path by replacing all path parameters with :param
 * Used for finding potentially related endpoints (e.g., parameter renames)
 */
function normalizeEndpointPath(path: string): string {
  return path.replace(/:[a-zA-Z0-9_]+/g, ':param');
}

/**
 * Prompt user for input (used for interactive conflict resolution)
 */
async function promptUser(question: string): Promise<string> {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

export async function syncEndpoints(): Promise<void> {
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

  console.log(`[Symulate] Syncing endpoints to project: ${projectId}\n`);

  // 1. Load endpoint definitions from the project
  const { loadEndpoints } = await import('./loadEndpoints');
  await loadEndpoints();

  // 2. Collect local endpoints
  const localEndpoints = getRegisteredEndpoints();

  if (localEndpoints.size === 0) {
    console.log('[Symulate] ⚠ No endpoints found to sync.');
    console.log('[Symulate] ');
    console.log('[Symulate] To fix this, create a symulate.config.js file in your project root:');
    console.log('[Symulate] ');
    console.log('[Symulate]   // symulate.config.js');
    console.log('[Symulate]   export default {');
    console.log('[Symulate]     entries: [');
    console.log('[Symulate]       "./src/models/**/*.ts",              // TypeScript files (auto-detected)');
    console.log('[Symulate]       "./server/api/**/*.js",              // JavaScript files');
    console.log('[Symulate]     ]');
    console.log('[Symulate]   };');
    console.log('[Symulate] ');
    console.log('[Symulate] Examples:');
    console.log('[Symulate]   - Angular: entries: ["./src/app/models/**/*.ts"]');
    console.log('[Symulate]   - Nuxt: entries: ["./server/api/**/*.ts"]');
    console.log('[Symulate]   - Express: entries: ["./src/routes/**/*.ts"]');
    console.log('[Symulate]   - Built files: entries: ["./dist/**/*.js"]\n');
    return;
  }

  console.log(`[Symulate] Found ${localEndpoints.size} local endpoint(s):`);
  localEndpoints.forEach((config, key) => {
    console.log(`  • ${config.method} ${config.path}`);
  });
  console.log();

  // 2. Fetch remote endpoints
  console.log('[Symulate] Fetching remote endpoints...');
  let remoteEndpoints: RemoteEndpoint[] = [];

  try {
    const url = `${supabaseUrl}/functions/v1/get-project-endpoints?project_id=${projectId}`;

    if (IS_DEBUG) {
      console.log(`[Symulate] Fetching from: ${url}`);
    }

    const response = await fetch(url, {
      headers: {
        'apikey': PLATFORM_CONFIG.supabase.anonKey,
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (IS_DEBUG) {
      console.log(`[Symulate] Response status: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      if (IS_DEBUG) {
        console.log(`[Symulate] Error response: ${errorText}`);
      }

      let errorMessage = 'Failed to fetch remote endpoints';
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
    console.log(`[Symulate] Found ${remoteEndpoints.length} remote endpoint(s)\n`);
  } catch (error: any) {
    console.error('[Symulate] Failed to fetch remote endpoints:', error.message);
    if (IS_DEBUG) {
      console.error('[Symulate] Full error:', error);
    }
    throw error;
  }

  // 3. Compare local vs remote (exact match by endpoint_key)
  const remoteKeys = new Set(remoteEndpoints.map(e => e.endpoint_key));
  const localKeys = new Set<string>();

  const toCreate: Array<{ config: EndpointConfig<any>, key: string }> = [];
  const toUpdate: Array<{ config: EndpointConfig<any>, key: string, remote: RemoteEndpoint }> = [];

  localEndpoints.forEach((config, key) => {
    const endpointKey = `${config.method}:${config.path}`;
    localKeys.add(endpointKey);

    const remote = remoteEndpoints.find(r => r.endpoint_key === endpointKey);
    if (remote) {
      toUpdate.push({ config, key, remote });
    } else {
      toCreate.push({ config, key });
    }
  });

  // Remote-only endpoints (not in local code)
  const remoteOnly = remoteEndpoints.filter(r => !localKeys.has(r.endpoint_key));

  // 4. Detect potential conflicts (similar normalized paths)
  const potentialConflicts: Array<{
    remote: RemoteEndpoint;
    possibleMatches: Array<{ config: EndpointConfig<any>, key: string }>;
  }> = [];

  remoteOnly.forEach(remote => {
    const normalizedRemote = normalizeEndpointPath(remote.path);

    // Find local endpoints that have same normalized path but different actual path
    const possibleMatches = toCreate.filter(({ config }) =>
      config.method === remote.method &&
      normalizeEndpointPath(config.path) === normalizedRemote &&
      config.path !== remote.path
    );

    if (possibleMatches.length > 0) {
      potentialConflicts.push({ remote, possibleMatches });
    }
  });

  // 5. Handle potential conflicts interactively
  const endpointsToDelete: string[] = [];

  if (potentialConflicts.length > 0) {
    console.log('\n[Symulate] ⚠️  Potential conflicts detected!\n');
    console.log('[Symulate] It looks like you may have renamed path parameters.\n');

    for (const conflict of potentialConflicts) {
      console.log(`[Symulate] 🔍 Conflict:`);
      console.log(`[Symulate]   Remote: ${conflict.remote.method} ${conflict.remote.path}`);
      console.log(`[Symulate]   Local:  ${conflict.possibleMatches.map(m => `${m.config.method} ${m.config.path}`).join(', ')}\n`);

      console.log('[Symulate] These endpoints have the same structure but different parameter names.');
      console.log('[Symulate] What would you like to do?\n');
      console.log('[Symulate]   [1] Keep both - Sync local as new endpoint (creates duplicate)');
      console.log('[Symulate]   [2] Replace - Delete remote and sync local (recommended for renames)');
      console.log('[Symulate]   [3] Skip - Keep remote, don\'t sync local\n');

      const answer = await promptUser('[Symulate] Your choice (1/2/3): ');

      if (answer === '2' || answer === 'replace') {
        // Mark remote for deletion
        endpointsToDelete.push(conflict.remote.id);
        console.log(`[Symulate] ✓ Will replace remote with local endpoint\n`);
      } else if (answer === '3' || answer === 'skip') {
        // Remove from toCreate list
        conflict.possibleMatches.forEach(match => {
          const index = toCreate.findIndex(c => c.key === match.key);
          if (index !== -1) {
            toCreate.splice(index, 1);
          }
        });
        console.log(`[Symulate] ✓ Will skip syncing local endpoint\n`);
      } else {
        // Default to option 1 - keep both
        console.log(`[Symulate] ✓ Will keep both endpoints\n`);
      }
    }
  }

  // Show diff
  console.log('[Symulate] 📊 Sync Summary:');
  console.log(`  • ${toCreate.length} endpoint(s) to create`);
  console.log(`  • ${toUpdate.length} endpoint(s) to update`);
  console.log(`  • ${endpointsToDelete.length} endpoint(s) to delete`);
  console.log(`  • ${remoteOnly.length - endpointsToDelete.length} remote-only endpoint(s) (will be preserved)\n`);

  if (toCreate.length > 0) {
    console.log('[Symulate] ✨ New endpoints:');
    toCreate.forEach(({ config }) => {
      console.log(`  + ${config.method} ${config.path}`);
    });
    console.log();
  }

  if (toUpdate.length > 0) {
    console.log('[Symulate] 🔄 Updated endpoints:');
    toUpdate.forEach(({ config }) => {
      console.log(`  ~ ${config.method} ${config.path}`);
    });
    console.log();
  }

  if (endpointsToDelete.length > 0) {
    console.log('[Symulate] 🗑️  Endpoints to delete:');
    const toDeleteEndpoints = remoteEndpoints.filter(r => endpointsToDelete.includes(r.id));
    toDeleteEndpoints.forEach((endpoint) => {
      console.log(`  - ${endpoint.method} ${endpoint.path}`);
    });
    console.log();
  }

  if (remoteOnly.length > 0 && endpointsToDelete.length < remoteOnly.length) {
    console.log('[Symulate] 📌 Remote-only endpoints (preserved):');
    remoteOnly
      .filter(e => !endpointsToDelete.includes(e.id))
      .forEach((endpoint) => {
        console.log(`  = ${endpoint.method} ${endpoint.path}`);
      });
    console.log();
  }

  // 6. Prepare sync payload
  const endpointsToSync = Array.from(localEndpoints.values())
    .filter(config => {
      // Filter out endpoints that user chose to skip
      const endpointKey = `${config.method}:${config.path}`;
      const wasInToCreate = toCreate.some(c => `${c.config.method}:${c.config.path}` === endpointKey);
      return !wasInToCreate || toCreate.some(c => `${c.config.method}:${c.config.path}` === endpointKey);
    })
    .map(config => ({
      method: config.method,
      path: config.path,
      schema: config.schema ? serializeSchema(config.schema) : undefined,
      mock: config.mock,
      params: config.params,
      errors: config.errors,
      filename: (config as any).__filename || 'unknown',
    }));

  // 7. Sync to backend
  console.log('[Symulate] 📤 Syncing to backend...');
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sync-project-endpoints`,
      {
        method: 'POST',
        headers: {
          'apikey': PLATFORM_CONFIG.supabase.anonKey,
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_id: projectId,
          endpoints: endpointsToSync,
          delete_endpoint_ids: endpointsToDelete,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sync endpoints');
    }

    const result = await response.json();
    const results: SyncResult[] = result.results || [];

    console.log('[Symulate] ✅ Sync completed successfully!\n');

    // Show detailed results
    const created = results.filter(r => r.action === 'created');
    const updated = results.filter(r => r.action === 'updated');

    if (created.length > 0) {
      console.log(`[Symulate] Created ${created.length} endpoint(s):`);
      created.forEach(r => console.log(`  ✓ ${r.method} ${r.path}`));
    }

    if (updated.length > 0) {
      console.log(`[Symulate] Updated ${updated.length} endpoint(s):`);
      updated.forEach(r => console.log(`  ✓ ${r.method} ${r.path}`));
    }

    console.log('\n[Symulate] 💡 View your endpoints at https://platform.symulate.dev\n');
  } catch (error) {
    console.error('[Symulate] Failed to sync endpoints:', error);
    throw error;
  }
}

/**
 * Serialize schema for storage
 * Converts schema object to a JSON-serializable format
 */
function serializeSchema(schema: any): any {
  // For now, just return the schema as-is
  // In the future, we might need more sophisticated serialization
  // to handle complex schema types
  return schema;
}
