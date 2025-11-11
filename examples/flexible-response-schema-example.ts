/**
 * Flexible Response Schema Example
 *
 * This example demonstrates how to use custom response schemas with meta fields
 * and aggregate fields for collection list operations.
 *
 * Supported meta fields:
 * - Basic: m.collectionsMeta.page(), .limit(), .total(), .totalPages()
 * - Aggregates: m.collectionsMeta.avg("field"), .sum("field"), .min("field"), .max("field")
 * - Count: m.collectionsMeta.count("field", value)
 */

import { defineCollection, configureSymulate, m, type Infer } from "../src/index";

// Configure Symulate
configureSymulate({
  openaiApiKey: process.env.OPENAI_API_KEY || "sk-...",
  generateMode: "faker", // Using faker for quick example
  collections: {
    persistence: { mode: "memory" },
  },
});

// Define product schema
const ProductSchema = m.object({
  id: m.uuid(),
  name: m.string(),
  category: m.string(),
  price: m.number({ min: 10, max: 500 }),
  rating: m.number({ min: 1, max: 5 }),
  inStock: m.boolean(),
  views: m.number({ min: 0, max: 10000 }),
});

export type Product = Infer<typeof ProductSchema>;

// Example 1: Default response (standard pagination)
export const productsDefault = defineCollection<Product>({
  name: "productsDefault",
  basePath: "/api/products-default",
  schema: ProductSchema,
  seedCount: 50,
  // No custom responseSchema - returns default { data: [], pagination: {} }
});

// Example 2: Custom response with renamed fields
export const productsCustom = defineCollection<Product>({
  name: "productsCustom",
  basePath: "/api/products-custom",
  schema: ProductSchema,
  seedCount: 50,
  operations: {
    list: {
      responseSchema: m.object({
        items: [ProductSchema], // Array location - will contain the paginated items
        currentPage: m.collectionsMeta.page(),
        pageSize: m.collectionsMeta.limit(),
        totalItems: m.collectionsMeta.total(),
        totalPages: m.collectionsMeta.totalPages(),
      }),
    },
  },
});

// Example 3: Response with aggregates
export const productsWithAggregates = defineCollection<Product>({
  name: "productsWithAggregates",
  basePath: "/api/products-aggregates",
  schema: ProductSchema,
  seedCount: 50,
  operations: {
    list: {
      responseSchema: m.object({
        products: [ProductSchema],
        meta: m.object({
          page: m.collectionsMeta.page(),
          limit: m.collectionsMeta.limit(),
          total: m.collectionsMeta.total(),
          totalPages: m.collectionsMeta.totalPages(),
        }),
        stats: m.object({
          averagePrice: m.collectionsMeta.avg("price"),
          totalViews: m.collectionsMeta.sum("views"),
          minPrice: m.collectionsMeta.min("price"),
          maxPrice: m.collectionsMeta.max("price"),
          averageRating: m.collectionsMeta.avg("rating"),
          inStockCount: m.collectionsMeta.count("inStock", true),
          outOfStockCount: m.collectionsMeta.count("inStock", false),
        }),
      }),
    },
  },
});

// Example 4: Nested response structure
export const productsNested = defineCollection<Product>({
  name: "productsNested",
  basePath: "/api/products-nested",
  schema: ProductSchema,
  seedCount: 50,
  operations: {
    list: {
      responseSchema: m.object({
        result: m.object({
          data: [ProductSchema],
          pagination: m.object({
            current: m.collectionsMeta.page(),
            perPage: m.collectionsMeta.limit(),
            total: m.collectionsMeta.total(),
            pages: m.collectionsMeta.totalPages(),
          }),
        }),
        analytics: m.object({
          pricing: m.object({
            average: m.collectionsMeta.avg("price"),
            lowest: m.collectionsMeta.min("price"),
            highest: m.collectionsMeta.max("price"),
          }),
          inventory: m.object({
            available: m.collectionsMeta.count("inStock", true),
            unavailable: m.collectionsMeta.count("inStock", false),
          }),
        }),
      }),
    },
  },
});

// Usage examples
async function main() {
  console.log("🎯 Flexible Response Schema Examples\n");

  // Example 1: Default response
  console.log("1️⃣ Default Response (standard pagination):");
  const default1 = await productsDefault.list({ page: 1, limit: 5 });
  console.log("Structure:", Object.keys(default1));
  console.log("Has 'data' field:", "data" in default1);
  console.log("Has 'pagination' field:", "pagination" in default1);
  console.log(`Returned ${default1.data.length} items\n`);

  // Example 2: Custom renamed fields
  console.log("2️⃣ Custom Response (renamed fields):");
  const custom = await productsCustom.list({ page: 1, limit: 5 });
  console.log("Structure:", Object.keys(custom));
  console.log("Has 'items' field:", "items" in custom);
  console.log("Has 'currentPage' field:", "currentPage" in custom);
  console.log("Page:", custom.currentPage);
  console.log("Page size:", custom.pageSize);
  console.log("Total items:", custom.totalItems);
  console.log(`Returned ${custom.items.length} items\n`);

  // Example 3: With aggregates
  console.log("3️⃣ Response with Statistics:");
  const withStats = await productsWithAggregates.list({ page: 1, limit: 10 });
  console.log("Structure:", Object.keys(withStats));
  console.log("Products:", withStats.products.length);
  console.log("Meta:", withStats.meta);
  console.log("Statistics:");
  console.log("  Average price: $" + withStats.stats.averagePrice?.toFixed(2));
  console.log("  Price range: $" + withStats.stats.minPrice + " - $" + withStats.stats.maxPrice);
  console.log("  Average rating:", withStats.stats.averageRating?.toFixed(1) + "⭐");
  console.log("  Total views:", withStats.stats.totalViews);
  console.log("  In stock:", withStats.stats.inStockCount);
  console.log("  Out of stock:", withStats.stats.outOfStockCount);
  console.log();

  // Example 4: Nested structure
  console.log("4️⃣ Nested Response Structure:");
  const nested = await productsNested.list({ page: 1, limit: 5 });
  console.log("Top-level keys:", Object.keys(nested));
  console.log("Result keys:", Object.keys(nested.result));
  console.log("Analytics keys:", Object.keys(nested.analytics));
  console.log("Products:", nested.result.data.length);
  console.log("Pagination:", nested.result.pagination);
  console.log("Pricing analytics:", nested.analytics.pricing);
  console.log("Inventory analytics:", nested.analytics.inventory);
  console.log();

  console.log("✅ Examples completed!");
  console.log();
  console.log("💡 Key Takeaways:");
  console.log("- Use m.collectionsMeta.page() for basic pagination fields (page, limit, total, totalPages)");
  console.log("- Use m.collectionsMeta.avg('field') for averages");
  console.log("- Use m.collectionsMeta.sum('field') for sums");
  console.log("- Use m.collectionsMeta.min('field') / max('field') for ranges");
  console.log("- Use m.collectionsMeta.count('field', value) for conditional counts");
  console.log("- Arrays in schema ([Schema]) mark where paginated items go");
  console.log("- Response structure is fully customizable!");
}

// Run the example
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });
}
