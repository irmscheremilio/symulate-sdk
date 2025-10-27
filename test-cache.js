#!/usr/bin/env node

/**
 * Test script to verify Supabase cache integration with authentication
 * This runs in Node.js environment where auth sessions are available
 */

const { defineMockEndpoint, m } = require('./dist/index.js');

// Define a test endpoint with a simple schema
const ProductSchema = m.object({
  id: m.uuid(),
  name: m.string("product name"),
  price: m.number("price between 10-100"),
});

const testEndpoint = defineMockEndpoint({
  path: "/api/test-products",
  method: "GET",
  schema: ProductSchema,
  mock: {
    instruction: "Generate test products for cache debugging",
    count: 5,
  },
});

async function runTest() {
  console.log("\n========================================");
  console.log("Testing Supabase Cache Integration");
  console.log("========================================\n");

  console.log("Making API call to generate mock data...\n");

  try {
    const data = await testEndpoint.handler();

    console.log("\n✓ Mock data generated successfully!");
    console.log(`  Generated ${data.length} items\n`);

    console.log("========================================");
    console.log("Check the logs above for:");
    console.log("  1. [Mockend] Auth session when saving cache");
    console.log("  2. [Mockend] Writing to Supabase cache");
    console.log("  3. [Mockend] Successfully wrote to Supabase cache");
    console.log("========================================\n");

    console.log("Now making another call to test cache hit...\n");

    const cachedData = await testEndpoint.handler();

    console.log("\n✓ Second call completed!");
    console.log("========================================");
    console.log("Check the logs above for:");
    console.log("  1. [Mockend] Cache hit! Entry ID");
    console.log("  2. [Mockend] Incrementing hit count for cache ID");
    console.log("  3. [Mockend] Hit count incremented successfully");
    console.log("========================================\n");

    console.log("Test completed! Run 'npx mockend cache --remote' to view cache entries.\n");

  } catch (error) {
    console.error("\n✗ Error during test:", error);
    process.exit(1);
  }
}

runTest();
