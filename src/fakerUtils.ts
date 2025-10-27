import { faker } from "@faker-js/faker";
import type { MockFieldConfig } from "./types";

export function generateFromFaker(instruction: string): any {
  const parts = instruction.split(".");

  if (parts.length === 1) {
    // Handle simple types
    switch (instruction.toLowerCase()) {
      case "uuid":
        return faker.string.uuid();
      case "string":
        return faker.lorem.word();
      case "number":
        return faker.number.int({ min: 1, max: 1000 });
      case "boolean":
        return faker.datatype.boolean();
      case "date":
        return faker.date.recent().toISOString();
      case "email":
        return faker.internet.email();
      case "url":
        return faker.internet.url();
      default:
        return faker.lorem.word();
    }
  }

  // Handle nested faker methods like "person.fullName"
  try {
    let result: any = faker;
    for (const part of parts) {
      result = result[part];
    }
    if (typeof result === "function") {
      return result();
    }
    return result;
  } catch {
    return faker.lorem.word();
  }
}

export function randomizeTemplate(template: any, mockConfig?: MockFieldConfig): any {
  if (Array.isArray(template)) {
    return template.map((item) => randomizeTemplate(item, mockConfig));
  }

  if (template && typeof template === "object") {
    const randomized: any = {};
    for (const key in template) {
      const instruction = mockConfig?.fields?.[key];
      if (typeof instruction === "string") {
        randomized[key] = generateFromFaker(instruction);
      } else if (instruction && typeof instruction === "object") {
        randomized[key] = randomizeTemplate(template[key], instruction as any);
      } else {
        randomized[key] = randomizeValue(template[key]);
      }
    }
    return randomized;
  }

  return randomizeValue(template);
}

function randomizeValue(value: any): any {
  if (typeof value === "string") {
    // Try to detect the type of string and generate similar
    if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return faker.string.uuid();
    }
    if (value.includes("@")) {
      return faker.internet.email();
    }
    if (value.startsWith("http")) {
      return faker.internet.url();
    }
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
      return faker.date.recent().toISOString();
    }
    return faker.lorem.words(value.split(" ").length);
  }

  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return faker.number.int({ min: 1, max: 1000 });
    }
    return faker.number.float({ min: 0, max: 1000, fractionDigits: 2 });
  }

  if (typeof value === "boolean") {
    return faker.datatype.boolean();
  }

  return value;
}

export function generateMockFromFields(fields: MockFieldConfig, count?: number): any {
  const generateSingle = () => {
    const result: any = {};
    for (const key in fields) {
      const instruction = fields[key];
      if (typeof instruction === "string") {
        result[key] = generateFromFaker(instruction);
      } else if (Array.isArray(instruction)) {
        result[key] = instruction.map((item) =>
          typeof item === "string" ? generateFromFaker(item) : generateMockFromFields(item as MockFieldConfig)
        );
      } else if (typeof instruction === "object") {
        result[key] = generateMockFromFields(instruction as MockFieldConfig);
      }
    }
    return result;
  };

  if (count && count > 1) {
    return Array.from({ length: count }, () => generateSingle());
  }

  return count === 1 ? [generateSingle()] : generateSingle();
}
