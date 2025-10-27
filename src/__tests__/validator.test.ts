import { describe, it, expect } from "vitest";
import { validateResponseType, TypeValidationError } from "../validator";

describe("validator", () => {
  describe("validateResponseType", () => {
    describe("array responses", () => {
      it("should validate array response with correct structure", () => {
        const response = [
          { id: "123", name: "John", email: "john@example.com" },
          { id: "456", name: "Jane", email: "jane@example.com" },
        ];

        const schema = {
          count: 2,
          fields: {
            id: "uuid",
            name: "person.fullName",
            email: "internet.email",
          },
        };

        expect(() => validateResponseType(response, schema)).not.toThrow();
      });

      it("should throw when expecting array but receiving object", () => {
        const response = { id: "123", name: "John" };

        const schema = {
          count: 5,
          fields: {
            id: "uuid",
            name: "person.fullName",
          },
        };

        expect(() => validateResponseType(response, schema)).toThrow(TypeValidationError);
        expect(() => validateResponseType(response, schema)).toThrow(/Expected: array/);
      });

      it("should throw when array item is missing required field", () => {
        const response = [
          { id: "123", name: "John" },
          { id: "456" }, // Missing 'name'
        ];

        const schema = {
          count: 2,
          fields: {
            id: "uuid",
            name: "person.fullName",
          },
        };

        expect(() => validateResponseType(response, schema)).toThrow(TypeValidationError);
        expect(() => validateResponseType(response, schema)).toThrow(/\$\[1\]\.name/);
      });

      it("should throw when array item has wrong type", () => {
        const response = [
          { id: "123", name: "John", age: "25" }, // age should be number
        ];

        const schema = {
          count: 1,
          fields: {
            id: "uuid",
            name: "person.fullName",
            age: "number",
          },
        };

        expect(() => validateResponseType(response, schema)).toThrow(TypeValidationError);
        expect(() => validateResponseType(response, schema)).toThrow(/number/);
      });
    });

    describe("object responses", () => {
      it("should validate single object with correct structure", () => {
        const response = {
          id: "123",
          name: "John Doe",
          email: "john@example.com",
        };

        const schema = {
          fields: {
            id: "uuid",
            name: "person.fullName",
            email: "internet.email",
          },
        };

        expect(() => validateResponseType(response, schema)).not.toThrow();
      });

      it("should throw when field is missing", () => {
        const response = {
          id: "123",
          name: "John",
          // email is missing
        };

        const schema = {
          fields: {
            id: "uuid",
            name: "person.fullName",
            email: "internet.email",
          },
        };

        expect(() => validateResponseType(response, schema)).toThrow(TypeValidationError);
        expect(() => validateResponseType(response, schema)).toThrow(/\$\.email/);
      });

      it("should throw when field has wrong type", () => {
        const response = {
          id: "123",
          name: "John",
          isActive: "true", // Should be boolean
        };

        const schema = {
          fields: {
            id: "uuid",
            name: "person.fullName",
            isActive: "boolean",
          },
        };

        expect(() => validateResponseType(response, schema)).toThrow(TypeValidationError);
        expect(() => validateResponseType(response, schema)).toThrow(/boolean/);
      });

      it("should throw when response is not an object", () => {
        const response = "not an object";

        const schema = {
          fields: {
            id: "uuid",
          },
        };

        expect(() => validateResponseType(response, schema)).toThrow(TypeValidationError);
      });
    });

    describe("nested objects", () => {
      it("should validate nested object structure", () => {
        const response = {
          id: "123",
          user: {
            name: "John",
            email: "john@example.com",
          },
        };

        const schema = {
          fields: {
            id: "uuid",
            user: {
              name: "person.fullName",
              email: "internet.email",
            },
          },
        };

        expect(() => validateResponseType(response, schema)).not.toThrow();
      });

      it("should throw when nested field is missing", () => {
        const response = {
          id: "123",
          user: {
            name: "John",
            // email is missing
          },
        };

        const schema = {
          fields: {
            id: "uuid",
            user: {
              name: "person.fullName",
              email: "internet.email",
            },
          },
        };

        expect(() => validateResponseType(response, schema)).toThrow(TypeValidationError);
        expect(() => validateResponseType(response, schema)).toThrow(/\$\.user\.email/);
      });

      it("should validate deeply nested structures", () => {
        const response = {
          id: "123",
          order: {
            customer: {
              name: "John",
              address: {
                street: "123 Main St",
                city: "New York",
              },
            },
          },
        };

        const schema = {
          fields: {
            id: "uuid",
            order: {
              customer: {
                name: "person.fullName",
                address: {
                  street: "location.street",
                  city: "location.city",
                },
              },
            },
          },
        };

        expect(() => validateResponseType(response, schema)).not.toThrow();
      });
    });

    describe("array fields", () => {
      it("should validate array fields", () => {
        const response = {
          id: "123",
          tags: ["tag1", "tag2", "tag3"],
        };

        const schema = {
          fields: {
            id: "uuid",
            tags: ["string"],
          },
        };

        expect(() => validateResponseType(response, schema)).not.toThrow();
      });

      it("should throw when array field contains wrong type", () => {
        const response = {
          id: "123",
          scores: ["100", "200"], // Should be numbers
        };

        const schema = {
          fields: {
            id: "uuid",
            scores: ["number"],
          },
        };

        expect(() => validateResponseType(response, schema)).toThrow(TypeValidationError);
      });

      it("should validate array of objects", () => {
        const response = {
          id: "123",
          items: [
            { name: "Item 1", price: 10 },
            { name: "Item 2", price: 20 },
          ],
        };

        const schema = {
          fields: {
            id: "uuid",
            items: [
              {
                name: "string",
                price: "number",
              },
            ],
          },
        };

        expect(() => validateResponseType(response, schema)).not.toThrow();
      });

      it("should throw when array of objects has wrong structure", () => {
        const response = {
          id: "123",
          items: [
            { name: "Item 1", price: 10 },
            { name: "Item 2" }, // Missing price
          ],
        };

        const schema = {
          fields: {
            id: "uuid",
            items: [
              {
                name: "string",
                price: "number",
              },
            ],
          },
        };

        expect(() => validateResponseType(response, schema)).toThrow(TypeValidationError);
        expect(() => validateResponseType(response, schema)).toThrow(/\$\.items\[1\]\.price/);
      });
    });

    describe("type inference from Faker instructions", () => {
      it("should validate string types", () => {
        const stringInstructions = [
          "uuid",
          "person.fullName",
          "internet.email",
          "lorem.word",
          "date",
        ];

        stringInstructions.forEach((instruction) => {
          const response = { field: "string value" };
          const schema = { fields: { field: instruction } };

          expect(() => validateResponseType(response, schema)).not.toThrow();
        });
      });

      it("should validate number types", () => {
        const response = { price: 99.99 };
        const schema = { fields: { price: "number" } };

        expect(() => validateResponseType(response, schema)).not.toThrow();
      });

      it("should validate boolean types", () => {
        const response = { isActive: true };
        const schema = { fields: { isActive: "boolean" } };

        expect(() => validateResponseType(response, schema)).not.toThrow();
      });

      it("should throw detailed error with full response", () => {
        const response = {
          id: "123",
          name: "John",
          age: "25", // Wrong type
        };

        const schema = {
          fields: {
            id: "uuid",
            name: "person.fullName",
            age: "number",
          },
        };

        try {
          validateResponseType(response, schema);
          expect.fail("Should have thrown");
        } catch (error) {
          expect(error).toBeInstanceOf(TypeValidationError);
          if (error instanceof TypeValidationError) {
            expect(error.path).toBe("$.age");
            expect(error.expected).toContain("number");
            expect(error.received).toBe("25");
            expect(error.fullResponse).toEqual(response);
            expect(error.message).toContain("Full response:");
          }
        }
      });
    });

    describe("no schema validation", () => {
      it("should pass through when no schema is provided", () => {
        const response = { anything: "goes" };

        expect(() => validateResponseType(response)).not.toThrow();
      });

      it("should throw when response is null/undefined even without schema", () => {
        expect(() => validateResponseType(null)).toThrow(TypeValidationError);
        expect(() => validateResponseType(undefined)).toThrow(TypeValidationError);
      });
    });
  });

  describe("TypeValidationError", () => {
    it("should create error with helpful message", () => {
      const error = new TypeValidationError(
        "$.user.email",
        "string",
        123,
        { user: { email: 123 } }
      );

      expect(error.message).toContain("$.user.email");
      expect(error.message).toContain("Expected: string");
      expect(error.message).toContain("Received: number");
      expect(error.message).toContain("Full response:");
      expect(error.message).toContain("backend response doesn't match");
    });
  });
});
