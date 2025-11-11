import type { AIProviderOptions } from "./types";
import { getConfig } from "./config";
import { PLATFORM_CONFIG } from "./platformConfig";
import { generateWithOpenAI } from "./openaiProvider";

// Use configured Supabase URL (respects environment variables for local dev)
const PLATFORM_API_URL = `${PLATFORM_CONFIG.supabase.url}/functions/v1/symulate`;

export async function generateWithAI(options: AIProviderOptions): Promise<any> {
  const config = getConfig();

  // Priority 1: Use BYOK (Bring Your Own Key) if configured
  if (config.openaiApiKey) {
    console.log("[Symulate] Using BYOK mode (OpenAI direct)");
    return generateWithOpenAI(options, config.openaiApiKey, config.openaiModel);
  }

  // Priority 2: Use Symulate Platform API
  if (config.symulateApiKey) {
    return generateWithPlatform(options, config.symulateApiKey);
  }

  // No API key configured
  throw new Error(
    "No API key configured. Choose one:\n\n" +
    "Option 1 - BYOK (Free tier with your OpenAI key):\n" +
    "  configureSymulate({ openaiApiKey: 'sk-...' })\n" +
    "  Get OpenAI key: https://platform.openai.com/api-keys\n\n" +
    "Option 2 - Symulate Platform (Managed service):\n" +
    "  configureSymulate({ symulateApiKey: 'sym_live_...' })\n" +
    "  Get Symulate key: https://platform.symulate.dev\n\n" +
    "Option 3 - Faker mode (No AI, free forever):\n" +
    "  configureSymulate({ generateMode: 'faker' })"
  );
}

async function generateWithPlatform(options: AIProviderOptions, apiKey: string): Promise<any> {
  const config = getConfig();
  const count = (options.schema as any)?.count || 1;

  // Get project ID from configuration
  const projectId: string | undefined = config.projectId;

  // Project ID is required for all requests
  if (!projectId) {
    throw new Error(
      "Project ID required. Configure it with:\n" +
      "  configureSymulate({ projectId: 'your-project-id' })\n\n" +
      "Get your project ID from https://platform.symulate.dev"
    );
  }

  console.log("Generating with Mockend Platform API...", {
    hasTypeDescription: !!options.typeDescription,
    instruction: options.instruction,
    metadata: options.metadata,
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
        metadata: options.metadata,
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
