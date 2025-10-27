import {
  getRegisteredEndpoints
} from "./chunk-F3MMIG2V.mjs";
import "./chunk-L3W6IOE7.mjs";
import "./chunk-RV4NJJYN.mjs";
import {
  PLATFORM_CONFIG,
  getAuthSession,
  getCurrentContext,
  init_auth,
  init_platformConfig
} from "./chunk-PAN643QS.mjs";
import {
  IS_DEBUG,
  init_env
} from "./chunk-HMEUN2V3.mjs";
import "./chunk-CIESM3BP.mjs";

// src/sync.ts
init_auth();
init_platformConfig();
init_env();
function normalizeEndpointPath(path) {
  return path.replace(/:[a-zA-Z0-9_]+/g, ":param");
}
async function promptUser(question) {
  const readline = await import("readline");
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
  const { loadEndpoints } = await import("./loadEndpoints-5KRZUBWF.mjs");
  await loadEndpoints();
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
      console.log(`[Symulate]   Local:  ${conflict.possibleMatches.map((m) => `${m.config.method} ${m.config.path}`).join(", ")}
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
export {
  syncEndpoints
};
