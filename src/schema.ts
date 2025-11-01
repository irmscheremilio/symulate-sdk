/**
 * Schema builder for Mockend - defines both TypeScript types and runtime schema information
 * Similar to Zod, but optimized for mock data generation
 */

export type SchemaType =
  | "uuid"
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "email"
  | "url"
  | "phoneNumber"
  | "person.fullName"
  | "person.firstName"
  | "person.lastName"
  | "person.jobTitle"
  | "internet.userName"
  | "internet.avatar"
  | "location.street"
  | "location.city"
  | "location.state"
  | "location.zipCode"
  | "location.country"
  | "location.latitude"
  | "location.longitude"
  | "commerce.productName"
  | "commerce.department"
  | "commerce.price"
  | "lorem.word"
  | "lorem.sentence"
  | "lorem.paragraph";

export interface BaseSchema<T = any> {
  _type: T;
  _meta: {
    schemaType: SchemaType | "object" | "array";
    description?: string;
  };
}

export interface StringSchema extends BaseSchema<string> {
  _meta: {
    schemaType: SchemaType;
    description?: string;
    dbReference?: {
      table: string;
      column: string;
    };
  };
}

export interface NumberSchema extends BaseSchema<number> {
  _meta: {
    schemaType: "number" | "commerce.price";
    description?: string;
    dbReference?: {
      table: string;
      column: string;
    };
  };
}

export interface BooleanSchema extends BaseSchema<boolean> {
  _meta: {
    schemaType: "boolean";
    description?: string;
    dbReference?: {
      table: string;
      column: string;
    };
  };
}

export interface ObjectSchema<T extends Record<string, any>> extends BaseSchema<T> {
  _meta: {
    schemaType: "object";
    description?: string;
  };
  _shape: { [K in keyof T]: BaseSchema<T[K]> };
}

export interface ArraySchema<T> extends BaseSchema<T[]> {
  _meta: {
    schemaType: "array";
    description?: string;
  };
  _element: BaseSchema<T>;
}

// Type inference helper
export type Infer<T extends BaseSchema> = T["_type"];

// Schema builders
class SchemaBuilder {
  // Primitive types
  uuid(description?: string): StringSchema {
    return {
      _type: "" as string,
      _meta: { schemaType: "uuid", description },
    };
  }

  string(description?: string): StringSchema {
    return {
      _type: "" as string,
      _meta: { schemaType: "string", description },
    };
  }

  number(description?: string): NumberSchema {
    return {
      _type: 0 as number,
      _meta: { schemaType: "number", description },
    };
  }

  boolean(description?: string): BooleanSchema {
    return {
      _type: false as boolean,
      _meta: { schemaType: "boolean", description },
    };
  }

  date(description?: string): StringSchema {
    return {
      _type: "" as string,
      _meta: { schemaType: "date", description },
    };
  }

  email(description?: string): StringSchema {
    return {
      _type: "" as string,
      _meta: { schemaType: "email", description },
    };
  }

  url(description?: string): StringSchema {
    return {
      _type: "" as string,
      _meta: { schemaType: "url", description },
    };
  }

  phoneNumber(description?: string): StringSchema {
    return {
      _type: "" as string,
      _meta: { schemaType: "phoneNumber", description },
    };
  }

  // Person fields
  person = {
    fullName: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "person.fullName", description },
    }),
    firstName: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "person.firstName", description },
    }),
    lastName: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "person.lastName", description },
    }),
    jobTitle: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "person.jobTitle", description },
    }),
  };

  // Internet fields
  internet = {
    userName: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "internet.userName", description },
    }),
    avatar: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "internet.avatar", description },
    }),
  };

  // Location fields
  location = {
    street: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "location.street", description },
    }),
    city: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "location.city", description },
    }),
    state: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "location.state", description },
    }),
    zipCode: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "location.zipCode", description },
    }),
    country: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "location.country", description },
    }),
    latitude: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "location.latitude", description },
    }),
    longitude: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "location.longitude", description },
    }),
  };

  // Commerce fields
  commerce = {
    productName: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "commerce.productName", description },
    }),
    department: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "commerce.department", description },
    }),
    price: (description?: string): NumberSchema => ({
      _type: 0 as number,
      _meta: { schemaType: "commerce.price", description },
    }),
  };

  // Lorem fields
  lorem = {
    word: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "lorem.word", description },
    }),
    sentence: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "lorem.sentence", description },
    }),
    paragraph: (description?: string): StringSchema => ({
      _type: "" as string,
      _meta: { schemaType: "lorem.paragraph", description },
    }),
  };

  // Database type reference
  db(
    tableDotColumn: string,
    description?: string
  ): StringSchema | NumberSchema | BooleanSchema {
    const parts = tableDotColumn.split(".");

    if (parts.length !== 2) {
      throw new Error(
        `Invalid db reference format. Expected "table.column", got "${tableDotColumn}"`
      );
    }

    const [table, column] = parts;

    // Try to load database types from imported file
    let dbType: string | undefined;
    try {
      // This will be populated when user runs import-schema command
      const { DatabaseTypes } = require("./databaseTypes");
      dbType = DatabaseTypes?.[table]?.[column];
    } catch {
      // DatabaseTypes not imported yet, will use generic type
    }

    // Map database type to schema type
    const schemaType = mapDbTypeToSchemaType(dbType || "string");

    // Return appropriate schema based on inferred type
    if (
      schemaType === "number" ||
      schemaType === "commerce.price"
    ) {
      return {
        _type: 0 as number,
        _meta: {
          schemaType: "number",
          description,
          dbReference: { table, column },
        },
      };
    }

    if (schemaType === "boolean") {
      return {
        _type: false as boolean,
        _meta: {
          schemaType: "boolean",
          description,
          dbReference: { table, column },
        },
      };
    }

    // Default to string
    return {
      _type: "" as string,
      _meta: {
        schemaType: dbType ? mapDbTypeToSchemaType(dbType) : "string",
        description,
        dbReference: { table, column },
      },
    };
  }

  // Complex types
  object<T extends Record<string, BaseSchema>>(
    shape: T,
    description?: string
  ): ObjectSchema<{ [K in keyof T]: Infer<T[K]> }> {
    return {
      _type: {} as { [K in keyof T]: Infer<T[K]> },
      _meta: { schemaType: "object", description },
      _shape: shape,
    };
  }

  array<T extends BaseSchema>(
    element: T,
    description?: string
  ): ArraySchema<Infer<T>> {
    return {
      _type: [] as Infer<T>[],
      _meta: { schemaType: "array", description },
      _element: element,
    };
  }
}

// Helper function to map database types to schema types
function mapDbTypeToSchemaType(dbType: string): SchemaType {
  const type = dbType.toLowerCase().split("(")[0];

  const typeMap: Record<string, SchemaType> = {
    // String types
    varchar: "string",
    char: "string",
    text: "string",
    uuid: "uuid",

    // Number types
    integer: "number",
    int: "number",
    smallint: "number",
    bigint: "number",
    decimal: "number",
    numeric: "number",
    real: "number",
    "double precision": "number",
    serial: "number",
    bigserial: "number",

    // Boolean
    boolean: "boolean",
    bool: "boolean",

    // Date/Time
    timestamp: "date",
    timestamptz: "date",
    "timestamp with time zone": "date",
    date: "date",
    time: "string",
    timetz: "string",
  };

  return typeMap[type] || "string";
}

export const m = new SchemaBuilder();

/**
 * Converts a schema to type descriptions for AI prompts
 */
export function schemaToTypeDescription(schema: BaseSchema): any {
  if (schema._meta.schemaType === "object") {
    const objSchema = schema as ObjectSchema<any>;
    const result: any = {};
    for (const key in objSchema._shape) {
      result[key] = schemaToTypeDescription(objSchema._shape[key]);
    }
    return result;
  }

  if (schema._meta.schemaType === "array") {
    const arrSchema = schema as ArraySchema<any>;
    return [schemaToTypeDescription(arrSchema._element)];
  }

  // Return a descriptive string for the AI
  const typeDescriptions: Record<string, string> = {
    uuid: "UUID string",
    string: "string",
    number: "number",
    boolean: "boolean",
    date: "ISO date string",
    email: "email address",
    url: "URL",
    phoneNumber: "phone number",
    "person.fullName": "full name",
    "person.firstName": "first name",
    "person.lastName": "last name",
    "person.jobTitle": "job title",
    "internet.userName": "username",
    "internet.avatar": "avatar URL",
    "location.street": "street address",
    "location.city": "city",
    "location.state": "state",
    "location.zipCode": "ZIP code",
    "location.country": "country",
    "location.latitude": "latitude coordinate",
    "location.longitude": "longitude coordinate",
    "commerce.productName": "product name",
    "commerce.department": "department/category name",
    "commerce.price": "price (number)",
    "lorem.word": "word",
    "lorem.sentence": "sentence",
    "lorem.paragraph": "paragraph",
  };

  const desc = typeDescriptions[schema._meta.schemaType as string] || schema._meta.schemaType;
  return schema._meta.description ? `${desc} (${schema._meta.description})` : desc;
}
