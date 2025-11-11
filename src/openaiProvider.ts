import type { AIProviderOptions } from "./types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

/**
 * Generate data using OpenAI API directly (BYOK mode)
 * @param options - Generation options
 * @param apiKey - User's OpenAI API key
 * @param model - OpenAI model to use (default: "gpt-4o-mini")
 */
export async function generateWithOpenAI(
  options: AIProviderOptions,
  apiKey: string,
  model: string = "gpt-4o-mini"
): Promise<any> {
  const count = (options.schema as any)?.count || 1;

  console.log(`[Symulate BYOK] Generating with OpenAI API (model: ${model}, count: ${count})...`);

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
        model: model,
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
      const cost = estimateCost(usage.prompt_tokens, usage.completion_tokens, model);
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
- For optional fields (marked as optional), include them 75% of the time and omit them 25% of the time
- Return ONLY valid JSON
- No markdown formatting
- No code blocks
- No explanation`;

  return prompt;
}

/**
 * Estimate cost based on model pricing (as of January 2025)
 * Pricing per 1M tokens
 */
function estimateCost(promptTokens: number, completionTokens: number, model: string): number {
  // Pricing map for different models (per 1M tokens)
  const pricing: Record<string, { input: number; output: number }> = {
    "gpt-4o-mini": { input: 0.15, output: 0.6 },
    "gpt-4o": { input: 2.5, output: 10.0 },
    "gpt-4o-2024-11-20": { input: 2.5, output: 10.0 },
    "gpt-4o-2024-08-06": { input: 2.5, output: 10.0 },
    "gpt-4o-2024-05-13": { input: 5.0, output: 15.0 },
    "gpt-4-turbo": { input: 10.0, output: 30.0 },
    "gpt-4-turbo-2024-04-09": { input: 10.0, output: 30.0 },
    "gpt-4": { input: 30.0, output: 60.0 },
    "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
    "gpt-3.5-turbo-0125": { input: 0.5, output: 1.5 },
  };

  // Default to gpt-4o-mini pricing if model not found
  const modelPricing = pricing[model] || pricing["gpt-4o-mini"];

  const inputCost = (promptTokens / 1_000_000) * modelPricing.input;
  const outputCost = (completionTokens / 1_000_000) * modelPricing.output;
  return inputCost + outputCost;
}
