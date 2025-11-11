import type { AIProviderOptions } from "./types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Generate data using OpenAI API directly (BYOK mode)
 * @param options - Generation options
 * @param apiKey - User's OpenAI API key
 */
export async function generateWithOpenAI(
  options: AIProviderOptions,
  apiKey: string
): Promise<any> {
  const count = (options.schema as any)?.count || 1;

  console.log(`[Symulate BYOK] Generating with OpenAI API (count: ${count})...`);

  // Build the prompt for OpenAI
  const systemPrompt = `You are a data generator that creates realistic mock data based on TypeScript schemas.
Return ONLY valid JSON, no markdown formatting, no code blocks, no explanation.
The response must be parseable by JSON.parse().`;

  const userPrompt = buildUserPrompt(options, count);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: "Unknown error" } }));

      if (response.status === 401) {
        throw new Error(
          "Invalid OpenAI API key. Get your API key at https://platform.openai.com/api-keys"
        );
      }

      if (response.status === 429) {
        throw new Error(
          `OpenAI rate limit exceeded: ${errorData.error?.message || "Too many requests"}\n` +
          "Consider:\n" +
          "  1. Adding a delay between requests\n" +
          "  2. Using Faker mode (generateMode: 'faker')\n" +
          "  3. Upgrading your OpenAI plan"
        );
      }

      throw new Error(
        `OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (error) {
      console.error("[Symulate BYOK] Failed to parse OpenAI response:", content);
      throw new Error("OpenAI returned invalid JSON");
    }

    // Log token usage
    const usage = data.usage;
    if (usage) {
      const cost = estimateCost(usage.prompt_tokens, usage.completion_tokens);
      console.log(
        `[Symulate BYOK] Tokens used: ${usage.total_tokens} ` +
        `(prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens}) ` +
        `≈ $${cost.toFixed(4)}`
      );
    }

    // Extract the items array if it exists
    if (parsedData.items && Array.isArray(parsedData.items)) {
      return parsedData.items;
    }

    // If response is already an array, return it
    if (Array.isArray(parsedData)) {
      return parsedData;
    }

    // Otherwise return as-is (single object)
    return parsedData;
  } catch (error) {
    console.error("[Symulate BYOK] Failed to generate with OpenAI:", error);
    throw error;
  }
}

/**
 * Build user prompt for OpenAI
 */
function buildUserPrompt(options: AIProviderOptions, count: number): string {
  let prompt = "";

  // Add schema information
  if (options.typeDescription) {
    prompt += `Generate data matching this TypeScript type:\n${JSON.stringify(options.typeDescription, null, 2)}\n\n`;
  } else if (options.schema) {
    prompt += `Generate data matching this schema:\n${JSON.stringify(options.schema, null, 2)}\n\n`;
  }

  // Add custom instruction
  if (options.instruction) {
    prompt += `Instructions: ${options.instruction}\n\n`;
  }

  // Add metadata context if provided
  if (options.metadata && Object.keys(options.metadata).length > 0) {
    prompt += `Context: ${JSON.stringify(options.metadata)}\n\n`;
  }

  // Add count requirement
  if (count > 1) {
    prompt += `Generate ${count} different items.\n\n`;
  }

  // Add format requirements
  prompt += `Return the data as JSON in this format:\n`;
  if (count > 1) {
    prompt += `{ "items": [...] }\n\n`;
  } else {
    prompt += `{ "item": {...} } or the object directly\n\n`;
  }

  prompt += `Requirements:
- Use realistic, diverse data
- Follow the schema exactly
- Return ONLY valid JSON
- No markdown formatting
- No code blocks
- No explanation`;

  return prompt;
}

/**
 * Estimate cost based on gpt-4o-mini pricing
 * Input: $0.150 per 1M tokens
 * Output: $0.600 per 1M tokens
 */
function estimateCost(promptTokens: number, completionTokens: number): number {
  const inputCost = (promptTokens / 1_000_000) * 0.15;
  const outputCost = (completionTokens / 1_000_000) * 0.6;
  return inputCost + outputCost;
}
