import { faker } from "@faker-js/faker";
import type { BaseSchema, ObjectSchema, ArraySchema } from "./schema";
import { getConfig } from "./config";

/**
 * Generates mock data using Faker.js based on the schema
 * This mode works offline and is perfect for CI/CD pipelines
 */
export function generateWithFaker<T>(schema: BaseSchema<T>, count: number = 1): T {
  const config = getConfig();

  // Set seed for deterministic generation if provided
  if (config.fakerSeed !== undefined) {
    faker.seed(config.fakerSeed);
  }

  // If count > 1, generate array
  if (count > 1) {
    return Array.from({ length: count }, () => generateSingleValue(schema)) as T;
  }

  return generateSingleValue(schema) as T;
}

function generateSingleValue(schema: BaseSchema): any {
  const schemaType = schema._meta.schemaType;

  // Handle object schemas
  if (schemaType === "object") {
    const objSchema = schema as ObjectSchema<any>;
    const result: any = {};
    for (const key in objSchema._shape) {
      result[key] = generateSingleValue(objSchema._shape[key]);
    }
    return result;
  }

  // Handle array schemas
  if (schemaType === "array") {
    const arrSchema = schema as ArraySchema<any>;
    // Generate 3-5 items for arrays by default
    const arrayLength = faker.number.int({ min: 3, max: 5 });
    return Array.from({ length: arrayLength }, () => generateSingleValue(arrSchema._element));
  }

  // Handle primitive types - map to Faker.js methods
  switch (schemaType) {
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

    case "phoneNumber":
      return faker.phone.number();

    // Person fields
    case "person.fullName":
      return faker.person.fullName();

    case "person.firstName":
      return faker.person.firstName();

    case "person.lastName":
      return faker.person.lastName();

    case "person.jobTitle":
      return faker.person.jobTitle();

    // Internet fields
    case "internet.userName":
      return faker.internet.userName();

    case "internet.avatar":
      return faker.image.avatar();

    // Location fields
    case "location.street":
      return faker.location.streetAddress();

    case "location.city":
      return faker.location.city();

    case "location.state":
      return faker.location.state();

    case "location.zipCode":
      return faker.location.zipCode();

    case "location.country":
      return faker.location.country();

    case "location.latitude":
      return faker.location.latitude().toString();

    case "location.longitude":
      return faker.location.longitude().toString();

    // Commerce fields
    case "commerce.productName":
      return faker.commerce.productName();

    case "commerce.department":
      return faker.commerce.department();

    case "commerce.price":
      return parseFloat(faker.commerce.price());

    // Lorem fields
    case "lorem.word":
      return faker.lorem.word();

    case "lorem.sentence":
      return faker.lorem.sentence();

    case "lorem.paragraph":
      return faker.lorem.paragraph();

    default:
      // Fallback for unknown types
      return faker.lorem.word();
  }
}
