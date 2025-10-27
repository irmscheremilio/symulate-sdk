export class TypeValidationError extends Error {
  constructor(
    public readonly path: string,
    public readonly expected: string,
    public readonly received: any,
    public readonly fullResponse: any
  ) {
    super(
      `Type validation failed at path "${path}":\n` +
      `  Expected: ${expected}\n` +
      `  Received: ${typeof received} (${JSON.stringify(received)})\n` +
      `\nFull response: ${JSON.stringify(fullResponse, null, 2)}\n\n` +
      `This usually means your backend response doesn't match the TypeScript type definition.\n` +
      `Please verify that your backend API returns data matching the expected structure.`
    );
    this.name = "TypeValidationError";
  }
}

/**
 * Validates response structure based on the mock template (AI-generated data)
 * Used to validate production backend responses against the expected structure
 */
export function validateResponseType<T>(
  response: unknown,
  mockTemplate?: any
): T {
  // Basic validation - ensure response exists
  if (response === null || response === undefined) {
    throw new TypeValidationError(
      "$",
      "data",
      response,
      response
    );
  }

  // If we have a mock template, validate structure matches
  if (mockTemplate) {
    // Handle schema format with fields property
    if (mockTemplate.fields !== undefined) {
      const expectedStructure = mockTemplate.fields;

      // Check if response is an array or object and validate accordingly
      if (Array.isArray(response)) {
        // Response is an array - validate each item
        response.forEach((item: any, index: number) => {
          validateStructureMatch(item, expectedStructure, `$[${index}]`, response);
        });
      } else if (mockTemplate.count !== undefined && mockTemplate.count > 1) {
        // Schema expects array (count > 1) but got single object
        throw new TypeValidationError(
          "$",
          "array",
          response,
          response
        );
      } else {
        // Single object response
        validateStructureMatch(response, expectedStructure, "$", response);
      }
    } else {
      // Direct template match (no fields property)
      validateStructureMatch(response, mockTemplate, "$", response);
    }
  }

  return response as T;
}

/**
 * Infer expected type from Faker instruction or type string
 */
function inferTypeFromInstruction(instruction: string): string {
  if (typeof instruction !== "string") {
    return typeof instruction;
  }

  // Direct type names
  if (instruction === "string") return "string";
  if (instruction === "number") return "number";
  if (instruction === "boolean") return "boolean";

  // Check for boolean first (most specific)
  if (instruction === "datatype.boolean" || instruction.includes("Boolean")) {
    return "boolean";
  }

  // Check for number types (be more specific to avoid false positives)
  // Only match if it's explicitly a number-generating Faker function
  if (
    instruction === "number" ||
    instruction === "datatype.number" ||
    instruction.startsWith("number.") ||
    instruction.startsWith("datatype.number") ||
    instruction === "finance.amount" ||
    instruction === "commerce.price" ||
    instruction.includes(".int(") ||
    instruction.includes(".float(") ||
    instruction.includes(".age") && !instruction.includes("inage") // "age" but not "lineage"
  ) {
    return "number";
  }

  // Default to string for most Faker instructions
  // This includes: uuid, person.fullName, internet.email, lorem.word, date, etc.
  return "string";
}

/**
 * Recursively validates that the actual response matches the expected structure
 */
function validateStructureMatch(
  actual: any,
  expected: any,
  path: string,
  fullResponse: any
): void {
  // Handle arrays
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) {
      throw new TypeValidationError(
        path,
        "array",
        actual,
        fullResponse
      );
    }

    // Validate each item in array if structure is defined
    if (expected.length > 0) {
      actual.forEach((item: any, index: number) => {
        validateStructureMatch(item, expected[0], `${path}[${index}]`, fullResponse);
      });
    }
    return;
  }

  // Handle objects
  if (typeof expected === "object" && expected !== null) {
    if (typeof actual !== "object" || actual === null || Array.isArray(actual)) {
      throw new TypeValidationError(
        path,
        "object",
        actual,
        fullResponse
      );
    }

    // Check if all expected keys exist and have correct types
    for (const key of Object.keys(expected)) {
      const keyPath = path === "$" ? `$.${key}` : `${path}.${key}`;

      if (!(key in actual)) {
        throw new TypeValidationError(
          keyPath,
          `property to exist`,
          undefined,
          fullResponse
        );
      }

      const actualValue = actual[key];
      const expectedValue = expected[key];

      // If expected value is a string (Faker instruction), infer type
      if (typeof expectedValue === "string") {
        const expectedType = inferTypeFromInstruction(expectedValue);
        const actualType = typeof actualValue;

        if (actualType !== expectedType) {
          throw new TypeValidationError(
            keyPath,
            expectedType,
            actualValue,
            fullResponse
          );
        }
      }
      // If expected value is an array, validate array structure
      else if (Array.isArray(expectedValue)) {
        if (!Array.isArray(actualValue)) {
          throw new TypeValidationError(
            keyPath,
            "array",
            actualValue,
            fullResponse
          );
        }
        // Validate array items if structure defined
        if (expectedValue.length > 0) {
          const expectedItemTemplate = expectedValue[0];

          // If the expected item is a string (type instruction), validate primitive types
          if (typeof expectedItemTemplate === "string") {
            const expectedItemType = inferTypeFromInstruction(expectedItemTemplate);
            actualValue.forEach((item: any, index: number) => {
              const actualItemType = typeof item;
              if (actualItemType !== expectedItemType) {
                throw new TypeValidationError(
                  `${keyPath}[${index}]`,
                  expectedItemType,
                  item,
                  fullResponse
                );
              }
            });
          } else {
            // For objects, recurse
            actualValue.forEach((item: any, index: number) => {
              validateStructureMatch(item, expectedItemTemplate, `${keyPath}[${index}]`, fullResponse);
            });
          }
        }
      }
      // If expected value is an object, recurse
      else if (typeof expectedValue === "object" && expectedValue !== null) {
        validateStructureMatch(actualValue, expectedValue, keyPath, fullResponse);
      }
      // For direct primitive values, check type
      else {
        if (typeof actualValue !== typeof expectedValue) {
          throw new TypeValidationError(
            keyPath,
            typeof expectedValue,
            actualValue,
            fullResponse
          );
        }
      }
    }
    return;
  }

  // For primitives, just check type
  if (typeof actual !== typeof expected) {
    throw new TypeValidationError(
      path,
      typeof expected,
      actual,
      fullResponse
    );
  }
}
