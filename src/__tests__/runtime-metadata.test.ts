import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { defineEndpoint } from "../defineEndpoint";
import { configureSymulate } from "../config";
import { m } from "../schema";

describe("Runtime Metadata", () => {
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

  describe("Production Mode (Backend Calls)", () => {
    it("should not send metadata to backend in production mode", async () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
        price: m.number(),
      });

      const getProducts = defineEndpoint({
        path: "/api/products",
        method: "GET",
        schema: ProductSchema,
        mock: {
          count: 10,
          metadata: {
            category: "Electronics",
            priceRange: { min: 50, max: 2000 },
          },
        },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "123", name: "Laptop", price: 1200 }],
      });

      // Pass runtime metadata
      await getProducts({
        page: 1,
        limit: 10,
        metadata: {
          targetMarket: "Premium consumers",
        },
      });

      // Metadata should NOT be in query params
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/products?page=1&limit=10",
        expect.objectContaining({
          method: "GET",
          headers: { "Content-Type": "application/json" },
        })
      );

      // Ensure metadata is not in the URL
      const callUrl = fetchMock.mock.calls[0][0];
      expect(callUrl).not.toContain("metadata");
      expect(callUrl).not.toContain("targetMarket");
    });

    it("should not include metadata in POST body", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
        email: m.email(),
      });

      const createUser = defineEndpoint({
        path: "/api/users",
        method: "POST",
        schema: UserSchema,
        mock: { metadata: { industry: "Technology" } },
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "John", email: "john@example.com" }),
      });

      await createUser({
        name: "John Doe",
        email: "john@example.com",
        metadata: {
          companySize: "500-1000",
          region: "North America",
        },
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

      // Ensure metadata is not in the body
      const callBody = fetchMock.mock.calls[0][1].body;
      expect(callBody).not.toContain("metadata");
      expect(callBody).not.toContain("companySize");
      expect(callBody).not.toContain("region");
    });

    it("should handle path params correctly when metadata is present", async () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getProduct = defineEndpoint({
        path: "/api/products/:id",
        method: "GET",
        schema: ProductSchema,
        mock: {},
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123", name: "Product" }),
      });

      await getProduct({
        id: "123",
        metadata: { industry: "Electronics" },
      });

      // Path param should work correctly
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.example.com/api/products/123",
        expect.objectContaining({
          method: "GET",
        })
      );
    });
  });

  describe("Mock Mode (Metadata Usage)", () => {
    beforeEach(() => {
      // Switch to development mode for mock testing
      configureSymulate({
        symulateApiKey: "sym_live_test_key",
        projectId: "test-project-id",
        environment: "development",
        generateMode: "faker", // Use Faker to avoid AI calls
        cacheEnabled: false,
      });
    });

    it("should accept runtime metadata in mock mode", async () => {
      const EmployeeSchema = m.object({
        id: m.uuid(),
        name: m.string(),
        department: m.string(),
      });

      const getEmployees = defineEndpoint({
        path: "/api/employees",
        method: "GET",
        schema: EmployeeSchema,
        mock: {
          count: 5,
          instruction: "Generate employees from a tech company",
        },
      });

      // Should not throw error when passing metadata
      const result = await getEmployees({
        metadata: {
          industry: "Technology",
          companySize: "500-1000",
          departments: ["Engineering", "Product", "Sales"],
        },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });

    it("should merge runtime metadata with configured metadata", async () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
        price: m.number(),
      });

      const getProducts = defineEndpoint({
        path: "/api/products",
        method: "GET",
        schema: ProductSchema,
        mock: {
          count: 3,
          metadata: {
            category: "Electronics",
            brand: "TechPro",
          },
        },
      });

      const result = await getProducts({
        metadata: {
          priceRange: { min: 50, max: 2000 },
          brand: "SuperTech", // Override configured brand
        },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it("should work with no configured metadata", async () => {
      const CustomerSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getCustomers = defineEndpoint({
        path: "/api/customers",
        method: "GET",
        schema: CustomerSchema,
        mock: { count: 2 }, // No configured metadata
      });

      const result = await getCustomers({
        metadata: {
          region: "EMEA",
          customerType: "Enterprise",
        },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it("should work with no runtime metadata", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUsers = defineEndpoint({
        path: "/api/users",
        method: "GET",
        schema: UserSchema,
        mock: {
          count: 4,
          metadata: {
            industry: "Healthcare",
          },
        },
      });

      // No metadata passed at runtime
      const result = await getUsers();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(4);
    });

    it("should combine metadata with other parameters", async () => {
      const TaskSchema = m.object({
        id: m.uuid(),
        title: m.string(),
        status: m.string(),
      });

      const getProjectTasks = defineEndpoint({
        path: "/api/projects/:projectId/tasks",
        method: "GET",
        schema: TaskSchema,
        mock: {
          count: 3,
          instruction: "Generate {{status}} tasks",
        },
      });

      const result = await getProjectTasks({
        projectId: "proj-123",
        status: "in-progress",
        metadata: {
          projectType: "Enterprise",
          teamSize: "10-20",
        },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it("should handle empty metadata object", async () => {
      const OrderSchema = m.object({
        id: m.uuid(),
        total: m.number(),
      });

      const getOrders = defineEndpoint({
        path: "/api/orders",
        method: "GET",
        schema: OrderSchema,
        mock: { count: 2 },
      });

      const result = await getOrders({
        metadata: {}, // Empty metadata
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it("should handle nested metadata objects", async () => {
      const RestaurantSchema = m.object({
        id: m.uuid(),
        name: m.string(),
        cuisine: m.string(),
      });

      const getRestaurants = defineEndpoint({
        path: "/api/restaurants",
        method: "GET",
        schema: RestaurantSchema,
        mock: { count: 3 },
      });

      const result = await getRestaurants({
        metadata: {
          location: {
            city: "Berlin",
            country: "Germany",
          },
          pricing: {
            level: "$$-$$$",
            averageCheck: "30-50 EUR",
          },
          features: {
            cuisine: "Japanese",
            vegetarianOptions: true,
            outdoorSeating: false,
          },
        },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });

    it("should handle metadata with arrays", async () => {
      const CompanySchema = m.object({
        id: m.uuid(),
        name: m.string(),
        industry: m.string(),
      });

      const getCompanies = defineEndpoint({
        path: "/api/companies",
        method: "GET",
        schema: CompanySchema,
        mock: { count: 5 },
      });

      const result = await getCompanies({
        metadata: {
          industries: ["Technology", "Healthcare", "Finance"],
          complianceStandards: ["HIPAA", "GDPR", "SOC2"],
          regions: ["North America", "EMEA", "APAC"],
        },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });
  });

  describe("Parameter Validation", () => {
    beforeEach(() => {
      configureSymulate({
        symulateApiKey: "sym_live_test_key",
        projectId: "test-project-id",
        environment: "development",
        generateMode: "faker",
        cacheEnabled: false,
      });
    });

    it("should not validate metadata as a parameter", async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const getUsersWithParams = defineEndpoint({
        path: "/api/users",
        method: "GET",
        params: [
          {
            name: "page",
            location: "query",
            required: true,
            schema: m.number(),
          },
        ],
        schema: UserSchema,
        mock: { count: 2 },
      });

      // Should NOT fail even though metadata is not defined in params
      const result = await getUsersWithParams({
        page: 1,
        metadata: { industry: "Technology" },
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should still validate required parameters when metadata is present", async () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const searchProducts = defineEndpoint({
        path: "/api/products",
        method: "GET",
        params: [
          {
            name: "query",
            location: "query",
            required: true,
            schema: m.string(),
          },
        ],
        schema: ProductSchema,
        mock: { count: 3 },
      });

      // Should throw error for missing required parameter
      await expect(
        searchProducts({
          metadata: { category: "Electronics" },
          // Missing required 'query' parameter
        })
      ).rejects.toThrow("Missing required parameters");
    });
  });
});
