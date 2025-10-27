import {
  PLATFORM_CONFIG,
  getAuthSession,
  init_auth,
  init_platformConfig
} from "./chunk-PAN643QS.mjs";
import "./chunk-CIESM3BP.mjs";

// src/apiKeys.ts
init_auth();
init_platformConfig();
async function getApiKeys() {
  try {
    const session = getAuthSession();
    if (!session || !session.userId) {
      console.warn("[Symulate] Not authenticated. Run 'npx symulate login' first.");
      return [];
    }
    const authHeader = session.accessToken ? `Bearer ${session.accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
    const url = `${PLATFORM_CONFIG.api.rest}/api_keys?user_id=eq.${session.userId}&select=*&order=created_at.desc`;
    const response = await fetch(url, {
      headers: {
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": authHeader,
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[Symulate] Failed to fetch API keys:", response.statusText);
      console.warn("[Symulate] Error details:", errorText);
      return [];
    }
    const data = await response.json();
    return data.map((entry) => ({
      id: entry.id,
      key: entry.key,
      name: entry.name || void 0,
      isActive: entry.is_active,
      createdAt: entry.created_at,
      expiresAt: entry.expires_at || void 0
    }));
  } catch (error) {
    console.warn("[Symulate] Error fetching API keys:", error);
    return [];
  }
}
function displayApiKeys(keys) {
  if (keys.length === 0) {
    console.log("\n\u{1F4CB} No API keys found");
    console.log("\n\u{1F4A1} Create API keys at https://platform.symulate.dev/dashboard/api-keys");
    return;
  }
  console.log(`
\u{1F511} API Keys (${keys.length} total):
`);
  keys.forEach((key, index) => {
    const status = key.isActive ? "\u2713 Active" : "\u2717 Revoked";
    const statusColor = key.isActive ? "" : " (REVOKED)";
    const displayKey = key.key ? `${key.key.substring(0, 20)}...${key.key.substring(key.key.length - 8)}` : "[Key hash stored securely]";
    console.log(`  [${index + 1}] ${displayKey}`);
    console.log(`      ID: ${key.id}`);
    if (key.name) {
      console.log(`      Name: ${key.name}`);
    }
    console.log(`      Status: ${status}${statusColor}`);
    console.log(`      Created: ${new Date(key.createdAt).toLocaleString()}`);
    if (key.expiresAt) {
      console.log(`      Expires: ${new Date(key.expiresAt).toLocaleString()}`);
    }
    console.log();
  });
  console.log("\u{1F4A1} Tips:");
  console.log("   - Use '--key <api-key-id>' with cache commands to filter by API key");
  console.log("   - Manage your API keys at https://platform.symulate.dev/dashboard/api-keys");
}
export {
  displayApiKeys,
  getApiKeys
};
