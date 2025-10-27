import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { defineEndpoint } from "../defineEndpoint";
import { configureSymulate } from "../config";
import { m } from "../schema";

describe("defineEndpoint - Backend Integration", () => {
  // Mock fetch globally
  const originalFetch = global.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock as any;

    // Configure for production mode
    configureSymulate({
      symulateApiKey: "mk_test_key",
      backendBaseUrl: "https://api.example.com",
      environment: "production",
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("GET requests with query parameters", () => {
    it("should send query parameters correctly", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUsers = defineEndpoint({
        path: "/api/users",
        method: "GET",
        schema: UserSchema,
        mock: { count: 5 },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "123", name: "John" }],
      });

      await getUsers({ page: 2, limit: 20 });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/users?page=2&limit=20",
        expect.objectContaining({
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    it("should handle no parameters", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUsers = defineEndpoint({
        path: "/api/users",
        method: "GET",
        schema: UserSchema,
        mock: {},
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getUsers();

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/users",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should handle multiple query parameters", async () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const searchProducts = defineEndpoint({
        path: "/api/products",
        method: "GET",
        schema: ProductSchema,
        mock: { instruction: "Search for {{query}} in {{category}}" },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await searchProducts({
        query: "laptop",
        category: "electronics",
        minPrice: 500,
        maxPrice: 2000,
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/products?query=laptop&category=electronics&minPrice=500&maxPrice=2000",
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("GET requests with path parameters", () => {
    it("should replace path parameters correctly", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUser = defineEndpoint({
        path: "/api/users/:id",
        method: "GET",
        schema: UserSchema,
        mock: {},
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "John" }),
      });

      await getUser({ id: "123" });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/users/123",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should handle multiple path parameters", async () => {
      const TaskSchema = m.object({
        id: m.uuid(),
        title: m.string(),
      });

      const getProjectTask = defineEndpoint({
        path: "/api/projects/:projectId/tasks/:taskId",
        method: "GET",
        schema: TaskSchema,
        mock: {},
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "task-1", title: "Task" }),
      });

      await getProjectTask({ projectId: "proj-123", taskId: "task-456" });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/projects/proj-123/tasks/task-456",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should combine path and query parameters", async () => {
      const TaskSchema = m.object({
        id: m.uuid(),
        title: m.string(),
      });

      const getProjectTasks = defineEndpoint({
        path: "/api/projects/:projectId/tasks",
        method: "GET",
        schema: TaskSchema,
        mock: { instruction: "Get {{status}} tasks" },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getProjectTasks({
        projectId: "proj-123",
        status: "in-progress",
        assignee: "john@example.com",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/projects/proj-123/tasks?status=in-progress&assignee=john%40example.com",
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("POST/PUT/PATCH requests with body", () => {
    it("should send POST with JSON body", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
        email: m.email(),
      });

      const createUser = defineEndpoint({
        path: "/api/users",
        method: "POST",
        schema: UserSchema,
        mock: {},
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "John", email: "john@example.com" }),
      });

      await createUser({
        name: "John Doe",
        email: "john@example.com",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/users",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "John Doe",
            email: "john@example.com",
          }),
        })
      );
    });

    it("should send PUT with JSON body", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const updateUser = defineEndpoint({
        path: "/api/users/:id",
        method: "PUT",
        schema: UserSchema,
        mock: {},
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "Jane Doe" }),
      });

      await updateUser({
        id: "123",
        name: "Jane Doe",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/users/123",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            name: "Jane Doe",
          }),
        })
      );
    });

    it("should send PATCH with JSON body", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const patchUser = defineEndpoint({
        path: "/api/users/:id",
        method: "PATCH",
        schema: UserSchema,
        mock: {},
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "Updated Name" }),
      });

      await patchUser({
        id: "123",
        name: "Updated Name",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/users/123",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            name: "Updated Name",
          }),
        })
      );
    });
  });

  describe("Parameter interpolation (production mode)", () => {
    it("should not affect backend calls - params sent as-is", async () => {
      const OfferSchema = m.object({
        id: m.uuid(),
        title: m.string(),
      });

      const filterOffers = defineEndpoint({
        path: "/api/offers",
        method: "GET",
        schema: OfferSchema,
        mock: {
          instruction: "Generate {{filter}} offers for {{sector}} sector",
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await filterOffers({
        filter: "outgoing",
        sector: "construction",
      });

      // In production, instruction is ignored
      // Parameters sent directly to backend
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/offers?filter=outgoing&sector=construction",
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("Error handling", () => {
    it("should throw error on HTTP error response", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUsers = defineEndpoint({
        path: "/api/users",
        method: "GET",
        schema: UserSchema,
        mock: {},
      });

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(getUsers()).rejects.toThrow("Backend API error: 404 Not Found");
    });

    it("should throw error if backendBaseUrl not configured", async () => {
      configureSymulate({
        symulateApiKey: "mk_test_key",
        environment: "production",
        backendBaseUrl: undefined, // Explicitly clear backendBaseUrl
      });

      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUsers = defineEndpoint({
        path: "/api/users",
        method: "GET",
        schema: UserSchema,
        mock: {},
      });

      await expect(getUsers()).rejects.toThrow(
        "backendBaseUrl not configured. Please set it in configureSymulate() for production mode."
      );
    });
  });

  describe("Special characters in parameters", () => {
    it("should encode special characters in query params", async () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const searchProducts = defineEndpoint({
        path: "/api/products",
        method: "GET",
        schema: ProductSchema,
        mock: {},
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await searchProducts({
        query: "laptop & tablet",
        email: "user@example.com",
      });

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/products?query=laptop+%26+tablet&email=user%40example.com",
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("Mode Override (per-endpoint mock/production control)", () => {
    beforeEach(() => {
      // Reset config before mode override tests
      configureSymulate({
        symulateApiKey: "mk_test_key",
        backendBaseUrl: "https://api.example.com",
        environment: "production",
        cacheEnabled: false,
      });
    });

    it('should use mock data when mode is "mock" even in production environment', async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUser = defineEndpoint({
        path: "/api/users/:id",
        method: "GET",
        mode: "mock", // Force mock mode
        schema: UserSchema,
        mock: {},
      });

      // Should generate mock data without calling fetch
      const result = await getUser({ id: "123" });

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBeDefined();
      expect(fetchMock).not.toHaveBeenCalled(); // No backend call
    });

    it('should use production backend when mode is "production" even in development environment', async () => {
      configureSymulate({
        symulateApiKey: "mk_test_key",
        backendBaseUrl: "https://api.example.com",
        environment: "development", // Development environment
        cacheEnabled: false,
      });

      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUser = defineEndpoint({
        path: "/api/users/:id",
        method: "GET",
        mode: "production", // Force production mode
        schema: UserSchema,
        mock: {},
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "John" }),
      });

      await getUser({ id: "123" });

      // Should call backend even in development
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/users/123",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should fall back to global environment when no mode is specified", async () => {
      configureSymulate({
        symulateApiKey: "mk_test_key",
        backendBaseUrl: "https://api.example.com",
        environment: "production", // Production environment
        cacheEnabled: false,
      });

      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUser = defineEndpoint({
        path: "/api/users/:id",
        method: "GET",
        // No mode specified - should use global environment
        schema: UserSchema,
        mock: {},
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "John" }),
      });

      await getUser({ id: "123" });

      // Should call backend because global env is production
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/users/123",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should allow mixing mock and production endpoints in the same app", async () => {
      configureSymulate({
        symulateApiKey: "mk_test_key",
        backendBaseUrl: "https://api.example.com",
        environment: "production",
        cacheEnabled: false,
      });

      // Create one endpoint with mock mode (for testing new features)
      const getNewFeature = defineEndpoint({
        path: "/api/new-feature",
        method: "GET",
        mode: "mock", // Test this endpoint with mock data
        schema: m.object({
          featureName: m.string(),
          enabled: m.boolean(),
        }),
        mock: {},
      });

      // Create another endpoint with production mode (use real data)
      const getExistingData = defineEndpoint({
        path: "/api/existing-data",
        method: "GET",
        mode: "production", // Use real backend
        schema: m.object({
          data: m.string(),
        }),
        mock: {},
      });

      // Call mock endpoint - should NOT hit backend
      const mockResult = await getNewFeature();
      expect(mockResult).toBeDefined();
      expect(mockResult.featureName).toBeDefined();
      expect(fetchMock).not.toHaveBeenCalled();

      // Call production endpoint - should hit backend
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "real data" }),
      });

      const prodResult = await getExistingData();
      expect(prodResult).toEqual({ data: "real data" });
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/existing-data",
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("Error Configuration", () => {
    it("should accept errors configuration without affecting runtime behavior", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUser = defineEndpoint({
        path: "/api/users/:id",
        method: "GET",
        schema: UserSchema,
        mock: {},
        errors: [
          {
            code: 404,
            description: "User not found",
            schema: m.object({
              error: m.object({
                message: m.string(),
                code: m.string(),
              }),
            }),
          },
          {
            code: 403,
            description: "Access denied",
            schema: m.object({
              error: m.object({
                message: m.string(),
              }),
            }),
          },
        ],
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "John" }),
      });

      const result = await getUser({ id: "123" });

      // Errors config should not affect normal request behavior
      expect(result).toEqual({ id: "123", name: "John" });
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/users/123",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should throw error when failNow flag is true in mock mode", async () => {
      // Switch to development mode for this test
      configureSymulate({
        symulateApiKey: "mk_test_key",
        backendBaseUrl: "https://api.example.com",
        environment: "development",
        cacheEnabled: false,
      });

      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const createUser = defineEndpoint({
        path: "/api/users",
        method: "POST",
        schema: UserSchema,
        mock: {},
        errors: [
          {
            code: 400,
            description: "Validation error",
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
            failNow: true,
          },
        ],
      });

      // Should throw error with the error data
      await expect(createUser({ name: "John" })).rejects.toThrow("[Symulate Mock] HTTP 400: Validation error");

      // Reset to production mode for other tests
      configureSymulate({
        symulateApiKey: "mk_test_key",
        backendBaseUrl: "https://api.example.com",
        environment: "production",
        cacheEnabled: false,
      });
    });

    it("should accept errors configuration with minimal properties", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUser = defineEndpoint({
        path: "/api/users/:id",
        method: "GET",
        schema: UserSchema,
        mock: {},
        errors: [
          {
            code: 404,
            // No description, no schema - should use defaults
          },
        ],
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "John" }),
      });

      const result = await getUser({ id: "123" });

      expect(result).toBeDefined();
      expect(fetchMock).toHaveBeenCalled();
    });

    it("should accept multiple error codes", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUser = defineEndpoint({
        path: "/api/users/:id",
        method: "GET",
        schema: UserSchema,
        mock: {},
        errors: [
          { code: 400, description: "Bad request" },
          { code: 401, description: "Unauthorized" },
          { code: 403, description: "Forbidden" },
          { code: 404, description: "Not found" },
          { code: 429, description: "Too many requests" },
          { code: 500, description: "Internal server error" },
          { code: 503, description: "Service unavailable" },
        ],
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "John" }),
      });

      const result = await getUser({ id: "123" });

      expect(result).toBeDefined();
      expect(fetchMock).toHaveBeenCalled();
    });

    it("should work with no errors configuration", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUser = defineEndpoint({
        path: "/api/users/:id",
        method: "GET",
        schema: UserSchema,
        mock: {},
        // No errors property - should work fine
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "John" }),
      });

      const result = await getUser({ id: "123" });

      expect(result).toEqual({ id: "123", name: "John" });
    });

    it("should work with empty errors array", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUser = defineEndpoint({
        path: "/api/users/:id",
        method: "GET",
        schema: UserSchema,
        mock: {},
        errors: [],
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "John" }),
      });

      const result = await getUser({ id: "123" });

      expect(result).toEqual({ id: "123", name: "John" });
    });
  });
});
