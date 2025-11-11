/**
 * BYOK (Bring Your Own Key) Example
 *
 * This example demonstrates how to use Symulate SDK with your own OpenAI API key
 * completely free without needing a Symulate Platform account.
 *
 * Features demonstrated:
 * - BYOK configuration with OpenAI API key
 * - Local persistence (filesystem in Node.js, localStorage in browser)
 * - Full CRUD operations on collections
 * - AI-generated realistic data
 */

import { defineCollection, configureSymulate, m, type Infer } from "../src/index";

// Configure Symulate with your OpenAI API key
configureSymulate({
  // BYOK: Use your own OpenAI API key
  openaiApiKey: process.env.OPENAI_API_KEY || "sk-...", // Get from https://platform.openai.com/api-keys

  // Use AI generation
  generateMode: "ai",

  // Configure local persistence
  collections: {
    persistence: {
      mode: "local", // Will use filesystem in Node.js, localStorage in browser
      filePath: ".symulate-byok-example.json", // Custom file path
    },
  },

  // Optional: Enable caching to save API calls
  cacheEnabled: true,
});

// Define a product schema
const ProductSchema = m.object({
  id: m.uuid(),
  name: m.string(),
  description: m.string(),
  price: m.number({ min: 10, max: 1000 }),
  category: m.string(),
  brand: m.string(),
  inStock: m.boolean(),
  rating: m.number({ min: 1, max: 5 }),
  reviewCount: m.number({ min: 0, max: 1000 }),
  imageUrl: m.internet.url(),
  tags: m.array(m.string(), { min: 2, max: 5 }),
});

// Infer TypeScript type
export type Product = Infer<typeof ProductSchema>;

// Define a collection with AI-generated seed data
export const products = defineCollection<Product>({
  name: "products",
  basePath: "/api/products",
  schema: ProductSchema,
  seedCount: 20,
  seedInstruction: `Generate realistic e-commerce products.
    Categories: Electronics, Clothing, Home & Garden, Sports, Books.
    Brands: Mix of well-known brands (Apple, Nike, etc.) and fictional brands.
    Prices should be realistic for each category.
    Stock status: 80% in stock, 20% out of stock.
    Ratings: Mostly 3-5 stars with realistic distribution.`,
});

// Example usage
async function main() {
  console.log("🚀 Symulate BYOK Example\n");

  // 1. List all products (loads from persistence or generates on first run)
  console.log("📦 Listing products...");
  const { data: allProducts, pagination } = await products.list({
    page: 1,
    limit: 5,
  });
  console.log(`Found ${pagination.total} products (showing ${allProducts.length}):
`);
  allProducts.forEach((p) => {
    console.log(`  - ${p.name} ($${p.price}) - ${p.inStock ? "✅ In Stock" : "❌ Out of Stock"}`);
  });

  // 2. Get a single product
  if (allProducts.length > 0) {
    console.log(`
🔍 Getting product details...`);
    const firstProduct = allProducts[0];
    const productDetail = await products.get(firstProduct.id);
    console.log(`Product: ${productDetail?.name}`);
    console.log(`Description: ${productDetail?.description}`);
    console.log(`Rating: ${productDetail?.rating}⭐ (${productDetail?.reviewCount} reviews)`);
  }

  // 3. Create a new product
  console.log(`
➕ Creating new product...`);
  const newProduct = await products.create({
    name: "Custom Gaming Laptop",
    description: "High-performance laptop for gaming and content creation",
    price: 1499.99,
    category: "Electronics",
    brand: "TechPro",
    inStock: true,
    rating: 4.5,
    reviewCount: 127,
    imageUrl: "https://example.com/gaming-laptop.jpg",
    tags: ["gaming", "laptop", "high-performance", "RGB"],
  });
  console.log(`Created: ${newProduct.name} (ID: ${newProduct.id})`);

  // 4. Update the product
  console.log(`
✏️  Updating product price...`);
  const updated = await products.update(newProduct.id, {
    price: 1299.99, // Price drop!
    inStock: true,
  });
  console.log(`Updated price: $${updated?.price}`);

  // 5. Query with filters
  console.log(`
🔎 Searching for electronics under $500...`);
  const filtered = await products.list({
    filter: {
      category: "Electronics",
      price: { $lt: 500 },
      inStock: true,
    },
    limit: 3,
  });
  console.log(`Found ${filtered.data.length} matching products`);

  // 6. Delete the product
  console.log(`
🗑️  Deleting test product...`);
  const deleted = await products.delete(newProduct.id);
  console.log(`Deleted: ${deleted ? "✅ Success" : "❌ Failed"}`);

  // 7. Show final count
  console.log(`
📊 Final product count: ${await products.count()}`);

  console.log(`
✅ Example completed!

💾 Data persisted to: .symulate-byok-example.json
🔄 Run this example again to see data loaded from persistence!
💰 OpenAI API cost: ~$0.01-0.02 (first run only, then cached)
`);
}

// Run the example
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
}
