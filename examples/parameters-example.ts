import { defineEndpoint, m } from "@symulate/sdk";

// ============================================================================
// Example 1: Path Parameters
// ============================================================================
const getUserById = defineEndpoint({
  path: "/api/users/:id",
  method: "GET",
  params: [
    {
      name: "id",
      location: "path",
      required: true,
      schema: m.uuid(),
      description: "The unique identifier of the user",
    },
  ],
  schema: m.object({
    id: m.uuid(),
    name: m.string(),
    email: m.email(),
    created_at: m.date(),
  }),
});

// Usage
async function example1() {
  // Path parameters are automatically extracted from the URL
  const user = await getUserById({ id: "123e4567-e89b-12d3-a456-426614174000" });
  console.log(user);
}

// ============================================================================
// Example 2: Query Parameters
// ============================================================================
const listUsers = defineEndpoint({
  path: "/api/users",
  method: "GET",
  params: [
    {
      name: "page",
      location: "query",
      required: false,
      schema: m.number(),
      description: "Page number for pagination",
      example: 1,
    },
    {
      name: "limit",
      location: "query",
      required: false,
      schema: m.number(),
      description: "Number of items per page",
      example: 10,
    },
    {
      name: "search",
      location: "query",
      required: false,
      schema: m.string(),
      description: "Search term to filter users",
      example: "john",
    },
    {
      name: "role",
      location: "query",
      required: false,
      schema: m.string(),
      description: "Filter by user role",
      example: "admin",
    },
  ],
  schema: m.object({
    id: m.uuid(),
    name: m.string(),
    email: m.email(),
  }),
  mock: {
    count: 10,
    instruction: "Generate a list of diverse users",
  },
});

// Usage
async function example2() {
  // Optional query parameters
  const users = await listUsers({ page: 1, limit: 20, search: "john" });
  console.log(users);

  // Can be called without parameters (all optional)
  const allUsers = await listUsers();
  console.log(allUsers);
}

// ============================================================================
// Example 3: Header Parameters
// ============================================================================
const getProtectedResource = defineEndpoint({
  path: "/api/protected/data",
  method: "GET",
  params: [
    {
      name: "Authorization",
      location: "header",
      required: true,
      schema: m.string(),
      description: "Bearer token for authentication",
      example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    },
    {
      name: "X-API-Key",
      location: "header",
      required: false,
      schema: m.string(),
      description: "Optional API key for additional security",
    },
  ],
  schema: m.object({
    data: m.string(),
    timestamp: m.date(),
  }),
});

// Usage
async function example3() {
  try {
    const data = await getProtectedResource({
      Authorization: "Bearer token-123",
      "X-API-Key": "api-key-456",
    });
    console.log(data);
  } catch (error) {
    console.error("Missing required header:", error);
  }
}

// ============================================================================
// Example 4: Mixed Parameters (Path + Query)
// ============================================================================
const getOrganizationMembers = defineEndpoint({
  path: "/api/organizations/:orgId/members",
  method: "GET",
  params: [
    {
      name: "orgId",
      location: "path",
      required: true,
      schema: m.uuid(),
      description: "Organization ID",
    },
    {
      name: "role",
      location: "query",
      required: false,
      schema: m.string(),
      description: "Filter members by role",
      example: "admin",
    },
    {
      name: "status",
      location: "query",
      required: false,
      schema: m.string(),
      description: "Filter by member status (active, pending, suspended)",
      example: "active",
    },
  ],
  schema: m.object({
    id: m.uuid(),
    name: m.string(),
    email: m.email(),
    role: m.string(),
    status: m.string(),
  }),
  mock: {
    count: 5,
  },
});

// Usage
async function example4() {
  const members = await getOrganizationMembers({
    orgId: "org-123",
    role: "admin",
    status: "active",
  });
  console.log(members);
}

// ============================================================================
// Example 5: POST with Query Parameters
// ============================================================================
const createOffer = defineEndpoint({
  path: "/api/offers",
  method: "POST",
  params: [
    {
      name: "notify",
      location: "query",
      required: false,
      schema: m.boolean(),
      description: "Send notification email to customer",
      example: true,
    },
    {
      name: "draft",
      location: "query",
      required: false,
      schema: m.boolean(),
      description: "Save as draft instead of sending",
      example: false,
    },
  ],
  schema: m.object({
    id: m.uuid(),
    customer_name: m.string(),
    customer_email: m.email(),
    amount: m.number(),
    status: m.string(),
    created_at: m.date(),
  }),
  mock: {
    instruction: "Generate a realistic offer with professional details",
  },
});

// Usage
async function example5() {
  const offer = await createOffer({
    customer_name: "Acme Corp",
    customer_email: "contact@acme.com",
    amount: 5000,
    notify: true,
    draft: false,
  });
  console.log(offer);
}

// ============================================================================
// Example 6: Required vs Optional Parameters
// ============================================================================
const searchProducts = defineEndpoint({
  path: "/api/products/search",
  method: "GET",
  params: [
    {
      name: "q",
      location: "query",
      required: true, // Required parameter
      schema: m.string(),
      description: "Search query (required)",
      example: "laptop",
    },
    {
      name: "category",
      location: "query",
      required: false, // Optional parameter
      schema: m.string(),
      description: "Filter by category",
      example: "electronics",
    },
    {
      name: "min_price",
      location: "query",
      required: false,
      schema: m.number(),
      description: "Minimum price filter",
      example: 100,
    },
    {
      name: "max_price",
      location: "query",
      required: false,
      schema: m.number(),
      description: "Maximum price filter",
      example: 1000,
    },
  ],
  schema: m.object({
    id: m.uuid(),
    name: m.string(),
    price: m.number(),
    category: m.string(),
  }),
  mock: {
    count: 15,
    instruction: "Generate diverse products matching search criteria",
  },
});

// Usage
async function example6() {
  try {
    // This works - required parameter provided
    const products = await searchProducts({
      q: "laptop",
      category: "electronics",
      min_price: 500,
    });
    console.log(products);

    // This will throw an error - missing required 'q' parameter
    // const noQuery = await searchProducts({ category: "electronics" });
  } catch (error) {
    console.error(error);
  }
}

// ============================================================================
// Run all examples
// ============================================================================
async function runExamples() {
  console.log("=== Example 1: Path Parameters ===");
  await example1();

  console.log("\n=== Example 2: Query Parameters ===");
  await example2();

  console.log("\n=== Example 3: Header Parameters ===");
  await example3();

  console.log("\n=== Example 4: Mixed Parameters ===");
  await example4();

  console.log("\n=== Example 5: POST with Query Parameters ===");
  await example5();

  console.log("\n=== Example 6: Required vs Optional ===");
  await example6();
}

// Uncomment to run
// runExamples().catch(console.error);
