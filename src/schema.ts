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
  };
}

export interface NumberSchema extends BaseSchema<number> {
  _meta: {
    schemaType: "number" | "commerce.price";
    description?: string;
  };
}

export interface BooleanSchema extends BaseSchema<boolean> {
  _meta: {
    schemaType: "boolean";
    description?: string;
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
