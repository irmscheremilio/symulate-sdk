import { faker } from "@faker-js/faker";
import type { MockFieldConfig } from "./types";
import type { BaseSchema } from "./schema";

// Store generated entities for FK relationships
const entityCache = new Map<string, Map<string, any>>();

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

/**
 * Generate value from database type
 */
export function generateFromDbType(
  dbType: string,
  tableName: string,
  columnName: string,
  dbReference?: { table: string; column: string }
): any {
  const type = dbType.toLowerCase().split("(")[0];

  // Handle foreign key relationships
  if (dbReference) {
    // Check if we have cached entities for the referenced table
    const refTableCache = entityCache.get(dbReference.table);
    if (refTableCache && refTableCache.size > 0) {
      // Pick a random existing entity's referenced column value
      const cachedIds = Array.from(refTableCache.values());
      const randomEntity =
        cachedIds[Math.floor(Math.random() * cachedIds.length)];
      return randomEntity[dbReference.column];
    }
  }

  // Generate based on SQL type
  switch (type) {
    case "uuid":
      return faker.string.uuid();

    case "varchar":
    case "char":
    case "text":
      // Try to infer context from column name
      const columnLower = columnName.toLowerCase();
      if (columnLower.includes("email")) return faker.internet.email();
      if (columnLower.includes("url") || columnLower.includes("website"))
        return faker.internet.url();
      if (columnLower.includes("phone")) return faker.phone.number();
      if (columnLower.includes("name")) return faker.person.fullName();
      if (columnLower.includes("title")) return faker.lorem.sentence(5);
      if (columnLower.includes("description") || columnLower.includes("content"))
        return faker.lorem.paragraph();
      if (columnLower.includes("city")) return faker.location.city();
      if (columnLower.includes("country")) return faker.location.country();
      if (columnLower.includes("address") || columnLower.includes("street"))
        return faker.location.streetAddress();
      return faker.lorem.words(3);

    case "integer":
    case "int":
    case "smallint":
      return faker.number.int({ min: 1, max: 1000 });

    case "bigint":
    case "serial":
    case "bigserial":
      return faker.number.int({ min: 1, max: 1000000 });

    case "decimal":
    case "numeric":
    case "real":
    case "double precision":
      return faker.number.float({ min: 0, max: 1000, fractionDigits: 2 });

    case "boolean":
    case "bool":
      return faker.datatype.boolean();

    case "timestamp":
    case "timestamptz":
    case "timestamp with time zone":
      return faker.date.recent().toISOString();

    case "date":
      return faker.date.recent().toISOString().split("T")[0];

    case "time":
    case "timetz":
      return faker.date.recent().toISOString().split("T")[1];

    case "json":
    case "jsonb":
      return { example: "json", value: faker.lorem.word() };

    case "array":
      return [faker.lorem.word(), faker.lorem.word()];

    default:
      return faker.lorem.word();
  }
}

/**
 * Cache an entity for FK relationship consistency
 */
export function cacheEntity(tableName: string, entityId: string, entity: any) {
  if (!entityCache.has(tableName)) {
    entityCache.set(tableName, new Map());
  }
  entityCache.get(tableName)!.set(entityId, entity);
}

/**
 * Clear entity cache
 */
export function clearEntityCache() {
  entityCache.clear();
}

/**
 * Generate mock data from schema with DB type support
 */
export function generateFromSchema(
  schema: BaseSchema,
  tableName?: string
): any {
  const meta = schema._meta;

  // Check if this is a DB reference
  if (meta.dbReference) {
    const { table, column } = meta.dbReference;

    // Try to load database types
    let dbType: string | undefined;
    try {
      const { DatabaseTypes } = require("./databaseTypes");
      dbType = DatabaseTypes?.[table]?.[column];
    } catch {
      // DatabaseTypes not available
    }

    if (dbType) {
      return generateFromDbType(dbType, table, column, meta.dbReference);
    }
  }

  // Fall back to regular schema generation
  if (meta.description) {
    return generateFromFaker(meta.description);
  }

  return generateFromFaker(meta.schemaType as string);
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
