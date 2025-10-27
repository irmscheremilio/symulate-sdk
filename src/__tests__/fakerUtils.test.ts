import { describe, it, expect } from "vitest";
import { generateFromFaker, generateMockFromFields, randomizeTemplate } from "../fakerUtils";

describe("fakerUtils", () => {
  describe("generateFromFaker", () => {
    it("should generate UUID", () => {
      const result = generateFromFaker("uuid");
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it("should generate email", () => {
      const result = generateFromFaker("email");
      expect(result).toContain("@");
    });

    it("should generate nested faker methods", () => {
      const result = generateFromFaker("person.fullName");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should generate number", () => {
      const result = generateFromFaker("number");
      expect(typeof result).toBe("number");
    });

    it("should generate boolean", () => {
      const result = generateFromFaker("boolean");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("generateMockFromFields", () => {
    it("should generate single object from fields", () => {
      const result = generateMockFromFields({
        id: "uuid",
        name: "person.fullName",
        email: "internet.email",
      });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("email");
      expect(result.email).toContain("@");
    });

    it("should generate array of objects when count is specified", () => {
      const result = generateMockFromFields(
        {
          id: "uuid",
          name: "person.fullName",
        },
        5
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
    });

    it("should handle nested objects", () => {
      const result = generateMockFromFields({
        id: "uuid",
        user: {
          name: "person.fullName",
          email: "internet.email",
        },
      });

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("user");
      expect(result.user).toHaveProperty("name");
      expect(result.user).toHaveProperty("email");
    });
  });

  describe("randomizeTemplate", () => {
    it("should randomize template values", () => {
      const template = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "John Doe",
        email: "john@example.com",
      };

      const result = randomizeTemplate(template);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("email");
      expect(result.id).not.toBe(template.id);
      expect(result.name).not.toBe(template.name);
      expect(result.email).not.toBe(template.email);
    });

    it("should handle arrays", () => {
      const template = [
        { id: "1", name: "John" },
        { id: "2", name: "Jane" },
      ];

      const result = randomizeTemplate(template);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
    });
  });
});
