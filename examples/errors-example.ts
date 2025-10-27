import { defineEndpoint, m } from "@symulate/sdk";

// Example 1: Endpoint with custom error responses
const getUserWithErrors = defineEndpoint({
  path: "/api/users/:id",
  method: "GET",
  schema: m.object({
    id: m.uuid(),
    name: m.string(),
    email: m.email(),
  }),
  errors: [
    {
      code: 404,
      description: "User not found",
      schema: m.object({
        error: m.object({
          message: m.string(),
          code: m.string(),
          userId: m.uuid(),
        }),
      }),
    },
    {
      code: 403,
      description: "Insufficient permissions to access this user",
      schema: m.object({
        error: m.object({
          message: m.string(),
          requiredPermission: m.string(),
        }),
      }),
    },
  ],
});

// Example 2: Endpoint with failNow for testing error states
const createUserWithValidation = defineEndpoint({
  path: "/api/users",
  method: "POST",
  schema: m.object({
    id: m.uuid(),
    name: m.string(),
    email: m.email(),
    createdAt: m.date(),
  }),
  errors: [
    {
      code: 400,
      description: "Invalid user data",
      schema: m.object({
        error: m.object({
          message: m.string(),
          validationErrors: m.array(
            m.object({
              field: m.string(),
              message: m.string(),
            })
          ),
        }),
      }),
      failNow: true, // This will make the request fail immediately with this error
    },
    {
      code: 409,
      description: "User with this email already exists",
      schema: m.object({
        error: m.object({
          message: m.string(),
          existingUserId: m.uuid(),
        }),
      }),
    },
  ],
});

// Example 3: Endpoint without custom errors (will use defaults in OpenAPI spec)
const listUsers = defineEndpoint({
  path: "/api/users",
  method: "GET",
  schema: m.object({
    id: m.uuid(),
    name: m.string(),
    email: m.email(),
  }),
  mock: {
    count: 10,
  },
  // No errors specified - OpenAPI spec will include default 400, 404, 500 responses
});

// Usage examples
async function examples() {
  try {
    // Normal success case
    const user = await getUserWithErrors({ id: "123" });
    console.log(user);
  } catch (error) {
    // Will receive error response matching one of the defined error schemas
    console.error(error);
  }

  try {
    // This will fail immediately due to failNow: true
    const newUser = await createUserWithValidation({
      name: "John Doe",
      email: "invalid-email", // Will trigger validation error
    });
    console.log(newUser);
  } catch (error) {
    // Will receive 400 error with validation errors
    console.error(error);
  }

  // List users - will succeed normally
  const users = await listUsers();
  console.log(users);
}
