import type { AIProviderOptions } from "./types";
import { getConfig } from "./config";

const PLATFORM_API_URL = "https://ptrjfelueuglvsdsqzok.supabase.co/functions/v1/symulate";

// Lazy-load auth module only in Node.js to avoid bundling Node.js modules for browser
function getAuthSession(): any {
  if (typeof process === "undefined" || !process.versions?.node) {
    return null; // Browser environment - no auth session
  }
  try {
    // Dynamic import for Node.js only
    const auth = require("./auth");
    return auth.getAuthSession();
  } catch {
    return null;
  }
}

export async function generateWithAI(options: AIProviderOptions): Promise<any> {
  const config = getConfig();

  if (!config.symulateApiKey) {
    throw new Error(
      "No Mockend API key configured. Get your free API key at https://platform.symulate.dev"
    );
  }

  return generateWithPlatform(options, config.symulateApiKey);
}

async function generateWithPlatform(options: AIProviderOptions, apiKey: string): Promise<any> {
  const config = getConfig();
  const count = (options.schema as any)?.count || 1;

  // Get project ID - prioritize configured projectId, then fall back to CLI session
  let projectId: string | undefined = config.projectId;

  // If no configured projectId, try to get from CLI session (Node.js only)
  if (!projectId) {
    const session = getAuthSession();
    if (session) {
      projectId = session.currentProjectId;
    }
  }

  // Project ID is required for all requests
  if (!projectId) {
    throw new Error(
      "Project ID required. Configure it with:\n" +
      "  configureSymulate({ projectId: 'your-project-id' })\n\n" +
      "Get your project ID from https://platform.symulate.dev\n\n" +
      "Alternatively, if using CLI:\n" +
      "  1. Run 'npx symulate orgs list' to see available organizations\n" +
      "  2. Run 'npx symulate orgs use <org-id>' to select an organization\n" +
      "  3. Run 'npx symulate projects list' to see available projects\n" +
      "  4. Run 'npx symulate projects use <project-id>' to select a project"
    );
  }

  console.log("Generating with Mockend Platform API...", {
    hasTypeDescription: !!options.typeDescription,
    instruction: options.instruction,
    count,
    language: config.language
  });

  try {
    const response = await fetch(PLATFORM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Mockend-API-Key": apiKey,
        "X-Mockend-Project-Id": projectId,
      },
      body: JSON.stringify({
        schema: options.typeDescription || options.schema,
        instruction: options.instruction,
        count: count,
        language: config.language,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));

      if (response.status === 401) {
        throw new Error(
          "Invalid Mockend API key. Get your API key at https://platform.symulate.dev"
        );
      }

      if (response.status === 429) {
        // Import quota tracking functions
        const { markQuotaExceeded } = require("./config");

        // Mark quota as exceeded to avoid future AI requests
        markQuotaExceeded(
          apiKey,
          errorData.tokens_used,
          errorData.tokens_limit
        );

        throw new Error(
          errorData.error || "Quota exceeded. Upgrade your plan at https://platform.symulate.dev"
        );
      }

      throw new Error(
        `Mockend Platform API error: ${response.status} ${errorData.error || response.statusText}`
      );
    }

    const data = await response.json();

    // Extract token usage information from headers
    const tokensUsed = response.headers.get("X-Mockend-Tokens-Used");
    const tokensRemaining = response.headers.get("X-Mockend-Tokens-Remaining");
    const tokensLimit = response.headers.get("X-Mockend-Tokens-Limit");
    const cached = response.headers.get("X-Mockend-Cached") === "true";

    // Update quota status for future requests
    if (tokensRemaining && tokensLimit) {
      const { updateQuotaStatus } = require("./config");
      updateQuotaStatus(apiKey, parseInt(tokensRemaining), parseInt(tokensLimit));
    }

    // Log token usage information
    if (tokensUsed || tokensRemaining) {
      console.log(`[Symulate] ${cached ? "Cache hit" : "Generated"} | Tokens: ${tokensUsed || 0} used, ${tokensRemaining || 0}/${tokensLimit || 0} remaining`);
    }

    return data;
  } catch (error) {
    console.error("Failed to generate with Mockend Platform:", error);
    throw error;
  }
}
