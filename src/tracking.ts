import { getConfig, isDevelopment } from "./config";
import { PLATFORM_CONFIG } from "./platformConfig";

// Use configured Supabase URL (respects environment variables for local dev)
const PLATFORM_API_URL = `${PLATFORM_CONFIG.supabase.url}/functions/v1/symulate`;

/**
 * Track usage for analytics (non-blocking, won't affect generation)
 * Used for Faker mode to track usage without counting against quota
 * Only runs in development mode - disabled in production
 */
export async function trackUsage(options: {
  endpoint: string;
  mode: "faker" | "ai";
  cached: boolean;
}): Promise<void> {
  const config = getConfig();

  // Don't track in production environment
  if (!isDevelopment()) {
    return;
  }

  if (!config.symulateApiKey) {
    // Silently skip tracking if no API key (shouldn't happen after validation)
    return;
  }

  if (!config.projectId) {
    // Silently skip tracking if no project ID configured
    return;
  }

  // Non-blocking fire-and-forget tracking
  // Don't await or throw errors - tracking should never block generation
  try {
    const fetchPromise = fetch(PLATFORM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mockend-API-Key": config.symulateApiKey,
        "X-Mockend-Project-Id": config.projectId,
        "X-Mockend-Track-Only": "true", // Signal this is tracking-only
      },
      body: JSON.stringify({
        mode: options.mode,
        endpoint: options.endpoint,
        cached: options.cached,
        trackOnly: true,
      }),
    });

    // Only add catch if fetchPromise is actually a Promise
    if (fetchPromise && typeof fetchPromise.catch === 'function') {
      fetchPromise.catch(() => {
        // Silently fail - tracking is best-effort
        // We don't want to break the app if tracking fails
      });
    }
  } catch (error) {
    // Silently fail if fetch is not available (e.g., in test environments)
  }
}
