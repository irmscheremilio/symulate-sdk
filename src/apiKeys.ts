import { getAuthSession } from "./auth";
import { PLATFORM_CONFIG } from "./platformConfig";

export interface ApiKey {
  id: string;
  key?: string; // May be undefined for hashed keys stored in DB
  name?: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
}

/**
 * Get all API keys for the authenticated user
 */
export async function getApiKeys(): Promise<ApiKey[]> {
  try {
    const session = getAuthSession();
    if (!session || !session.userId) {
      console.warn("[Symulate] Not authenticated. Run 'npx symulate login' first.");
      return [];
    }

    // Use access token for authenticated requests
    const authHeader = session.accessToken ? `Bearer ${session.accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;

    const url = `${PLATFORM_CONFIG.api.rest}/api_keys?user_id=eq.${session.userId}&select=*&order=created_at.desc`;

    const response = await fetch(url, {
      headers: {
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn("[Symulate] Failed to fetch API keys:", response.statusText);
      console.warn("[Symulate] Error details:", errorText);
      return [];
    }

    const data = await response.json() as any[];

    return data.map((entry: any) => ({
      id: entry.id,
      key: entry.key,
      name: entry.name || undefined,
      isActive: entry.is_active,
      createdAt: entry.created_at,
      expiresAt: entry.expires_at || undefined,
    }));
  } catch (error) {
    console.warn("[Symulate] Error fetching API keys:", error);
    return [];
  }
}

/**
 * Display API keys in a formatted list
 */
export function displayApiKeys(keys: ApiKey[]): void {
  if (keys.length === 0) {
    console.log("\n📋 No API keys found");
    console.log("\n💡 Create API keys at https://platform.symulate.dev/dashboard/api-keys");
    return;
  }

  console.log(`\n🔑 API Keys (${keys.length} total):\n`);

  keys.forEach((key, index) => {
    const status = key.isActive ? "✓ Active" : "✗ Revoked";
    const statusColor = key.isActive ? "" : " (REVOKED)";

    // Handle cases where key might be null/undefined (hashed keys stored in DB)
    const displayKey = key.key
      ? `${key.key.substring(0, 20)}...${key.key.substring(key.key.length - 8)}`
      : "[Key hash stored securely]";

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

  console.log("💡 Tips:");
  console.log("   - Use '--key <api-key-id>' with cache commands to filter by API key");
  console.log("   - Manage your API keys at https://platform.symulate.dev/dashboard/api-keys");
}
