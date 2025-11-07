#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import type { EndpointConfig } from "../types";
import type { BaseSchema, ObjectSchema, ArraySchema } from "../schema";

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers?: Array<{ url: string; description: string }>;
  paths: Record<string, any>;
  components?: {
    schemas?: Record<string, any>;
  };
}

export function generateOpenAPISpec(
  endpoints: Map<string, EndpointConfig<any>>,
  options: {
    title?: string;
    version?: string;
    description?: string;
    serverUrl?: string;
    collections?: Array<{
      name: string;
      basePath: string;
      operations: string[];
      schema: any;
    }>;
  } = {}
): OpenAPISpec {
  const spec: OpenAPISpec = {
    openapi: "3.0.0",
    info: {
      title: options.title || "Symulate Generated API",
      version: options.version || "1.0.0",
      description: options.description || "API specification generated from Symulate endpoint definitions",
    },
    paths: {},
    components: {
      schemas: {},
    },
  };

  // Add server URL if provided
  if (options.serverUrl) {
    spec.servers = [
      {
        url: options.serverUrl,
        description: "API server",
      },
    ];
  }

  for (const [key, config] of endpoints.entries()) {
    const { path: apiPath, method, schema, mock, errors } = config;

    if (!spec.paths[apiPath]) {
      spec.paths[apiPath] = {};
    }

    // Build responses object starting with success response
    const responses: Record<string, any> = {
      "200": {
        description: "Successful response",
        content: {
          "application/json": {
            schema: schema ? schemaToOpenAPI(schema) : { type: "object" },
          },
        },
      },
    };

    // Add error responses from configuration or use defaults
    if (errors && errors.length > 0) {
      for (const error of errors) {
        responses[error.code.toString()] = {
          description: error.description || getDefaultErrorDescription(error.code),
          content: {
            "application/json": {
              schema: error.schema ? schemaToOpenAPI(error.schema) : getDefaultErrorSchema(),
            },
          },
        };
      }
    } else {
      // Add default error responses
      responses["400"] = {
        description: "Bad request",
        content: {
          "application/json": {
            schema: getDefaultErrorSchema(),
          },
        },
      };
      responses["404"] = {
        description: "Not found",
        content: {
          "application/json": {
            schema: getDefaultErrorSchema(),
          },
        },
      };
      responses["500"] = {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: getDefaultErrorSchema(),
          },
        },
      };
    }

    const operation: any = {
      summary: `${method} ${apiPath}`,
      description: mock?.instruction || `${method} operation for ${apiPath}`,
      operationId: key.replace(/\s+/g, "_").toLowerCase(),
      tags: [extractTagFromPath(apiPath)],
      responses,
    };

    // Build parameters from config.params if available
    if (config.params && config.params.length > 0) {
      const parameters: any[] = [];
      const bodyProperties: Record<string, any> = {};
      const bodyRequired: string[] = [];

      for (const param of config.params) {
        if (param.location === "path" || param.location === "query" || param.location === "header") {
          // Add to operation.parameters
          parameters.push({
            name: param.name,
            in: param.location,
            required: param.required !== false,
            description: param.description || `The ${param.name} parameter`,
            schema: param.schema ? schemaToOpenAPI(param.schema) : { type: "string" },
            ...(param.example && { example: param.example }),
          });
        } else if (param.location === "body") {
          // Collect body parameters
          bodyProperties[param.name] = param.schema ? schemaToOpenAPI(param.schema) : { type: "string" };
          if (param.required !== false) {
            bodyRequired.push(param.name);
          }
        }
      }

      if (parameters.length > 0) {
        operation.parameters = parameters;
      }

      // Add request body if there are body parameters
      if (Object.keys(bodyProperties).length > 0) {
        operation.requestBody = {
          required: bodyRequired.length > 0,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: bodyProperties,
                required: bodyRequired.length > 0 ? bodyRequired : undefined,
              },
            },
          },
        };
      }
    } else {
      // Fallback: Add parameters if path contains variables (e.g., /users/:id)
      const pathParams = apiPath.match(/:(\w+)/g);
      if (pathParams) {
        operation.parameters = pathParams.map((param) => ({
          name: param.substring(1),
          in: "path",
          required: true,
          description: `The ${param.substring(1)} identifier`,
          schema: { type: "string" },
        }));
      }

      // Add request body for POST/PUT/PATCH methods (legacy behavior)
      if (["POST", "PUT", "PATCH"].includes(method) && schema) {
        operation.requestBody = {
          required: true,
          content: {
            "application/json": {
              schema: schemaToOpenAPI(schema),
            },
          },
        };
      }
    }

    spec.paths[apiPath][method.toLowerCase()] = operation;
  }

  // Process collections
  if (options.collections && options.collections.length > 0) {
    for (const collection of options.collections) {
      // Add schema to components
      const schemaName = capitalize(collection.name);
      if (spec.components && spec.components.schemas) {
        spec.components.schemas[schemaName] = schemaToOpenAPI(collection.schema);
      }

      // Generate endpoints for each operation
      for (const operation of collection.operations) {
        const path = getCollectionOperationPath(collection.basePath, operation);
        const method = getCollectionOperationMethod(operation).toLowerCase();

        if (!spec.paths[path]) {
          spec.paths[path] = {};
        }

        spec.paths[path][method] = createCollectionOperation(
          operation,
          collection.name,
          schemaName
        );
      }
    }
  }

  return spec;
}

/**
 * Extract a tag name from the API path for better organization
 */
function extractTagFromPath(path: string): string {
  const segments = path.split("/").filter((s) => s && !s.startsWith(":"));
  return segments[segments.length - 1] || "default";
}

/**
 * Convert Symulate schema to OpenAPI schema
 */
function schemaToOpenAPI(schema: BaseSchema<any>): any {
  return convertSchemaToOpenAPI(schema);
}

/**
 * Recursively convert Symulate schema to OpenAPI schema
 */
function convertSchemaToOpenAPI(schema: BaseSchema<any>): any {
  const schemaType = schema._meta?.schemaType;

  if (!schemaType) {
    return { type: "object" };
  }

  // Handle object schemas
  if (schemaType === "object") {
    const objSchema = schema as ObjectSchema<any>;
    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(objSchema._shape)) {
      properties[key] = convertSchemaToOpenAPI(value as BaseSchema<any>);
      // Mark as required by default (could be enhanced with optional() support)
      required.push(key);
    }

    return {
      type: "object",
      properties,
      required: required.length > 0 ? required : undefined,
    };
  }

  // Handle array schemas
  if (schemaType === "array") {
    const arrSchema = schema as ArraySchema<any>;
    return {
      type: "array",
      items: convertSchemaToOpenAPI(arrSchema._element),
    };
  }

  // Map Symulate primitive types to OpenAPI types
  return mapTypeToOpenAPI(schemaType);
}

/**
 * Map Symulate schema types to OpenAPI types
 */
function mapTypeToOpenAPI(schemaType: string): any {
  switch (schemaType) {
    case "uuid":
      return { type: "string", format: "uuid" };
    case "string":
      return { type: "string" };
    case "number":
      return { type: "number" };
    case "boolean":
      return { type: "boolean" };
    case "date":
      return { type: "string", format: "date-time" };
    case "email":
      return { type: "string", format: "email" };
    case "url":
      return { type: "string", format: "uri" };
    case "phoneNumber":
      return { type: "string", pattern: "^[+]?[(]?[0-9]{1,4}[)]?[-\\s\\./0-9]*$" };
    case "person.fullName":
    case "person.firstName":
    case "person.lastName":
      return { type: "string" };
    case "person.jobTitle":
      return { type: "string" };
    case "internet.userName":
      return { type: "string" };
    case "internet.avatar":
      return { type: "string", format: "uri" };
    case "location.street":
    case "location.city":
    case "location.state":
    case "location.country":
    case "location.zipCode":
      return { type: "string" };
    case "location.latitude":
    case "location.longitude":
      return { type: "string" };
    case "commerce.productName":
    case "commerce.department":
      return { type: "string" };
    case "commerce.price":
      return { type: "number", minimum: 0 };
    case "lorem.word":
    case "lorem.sentence":
    case "lorem.paragraph":
      return { type: "string" };
    case "company.name":
    case "company.catchPhrase":
    case "company.industry":
      return { type: "string" };
    default:
      return { type: "string" };
  }
}

/**
 * Get default error description based on HTTP status code
 */
function getDefaultErrorDescription(code: number): string {
  const descriptions: Record<number, string> = {
    400: "Bad request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not found",
    409: "Conflict",
    422: "Unprocessable entity",
    429: "Too many requests",
    500: "Internal server error",
    502: "Bad gateway",
    503: "Service unavailable",
    504: "Gateway timeout",
  };
  return descriptions[code] || `Error ${code}`;
}

/**
 * Get default error schema for error responses
 */
function getDefaultErrorSchema(): any {
  return {
    type: "object",
    properties: {
      error: {
        type: "object",
        properties: {
          message: { type: "string" },
          code: { type: "string" },
          details: { type: "object" },
        },
        required: ["message"],
      },
    },
    required: ["error"],
  };
}

/**
 * Capitalize first letter of string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get path for collection operation
 */
function getCollectionOperationPath(basePath: string, operation: string): string {
  const needsId = ['get', 'update', 'replace', 'delete'];
  return needsId.includes(operation) ? `${basePath}/{id}` : basePath;
}

/**
 * Get HTTP method for collection operation
 */
function getCollectionOperationMethod(operation: string): string {
  const methodMap: Record<string, string> = {
    list: 'GET',
    get: 'GET',
    create: 'POST',
    update: 'PATCH',
    replace: 'PUT',
    delete: 'DELETE',
  };
  return methodMap[operation] || 'GET';
}

/**
 * Create OpenAPI operation for collection
 */
function createCollectionOperation(
  operation: string,
  collectionName: string,
  schemaName: string
): any {
  const op: any = {
    summary: `${capitalize(operation)} ${collectionName}`,
    tags: [collectionName],
    operationId: `${operation}${capitalize(collectionName)}`,
    responses: {},
  };

  switch (operation) {
    case 'list':
      op.responses['200'] = {
        description: `List of ${collectionName}`,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                data: {
                  type: 'array',
                  items: { $ref: `#/components/schemas/${schemaName}` },
                },
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      };
      op.parameters = [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        { name: 'sortBy', in: 'query', schema: { type: 'string' } },
        { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
      ];
      break;

    case 'get':
      op.parameters = [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ];
      op.responses['200'] = {
        description: `Single ${collectionName}`,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${schemaName}` },
          },
        },
      };
      op.responses['404'] = {
        description: 'Not found',
      };
      break;

    case 'create':
      op.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${schemaName}` },
          },
        },
      };
      op.responses['201'] = {
        description: 'Created',
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${schemaName}` },
          },
        },
      };
      break;

    case 'update':
    case 'replace':
      op.parameters = [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ];
      op.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${schemaName}` },
          },
        },
      };
      op.responses['200'] = {
        description: 'Updated',
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${schemaName}` },
          },
        },
      };
      op.responses['404'] = {
        description: 'Not found',
      };
      break;

    case 'delete':
      op.parameters = [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      ];
      op.responses['204'] = {
        description: 'Deleted',
      };
      op.responses['404'] = {
        description: 'Not found',
      };
      break;
  }

  return op;
}

export function saveOpenAPISpec(spec: OpenAPISpec, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2), "utf-8");
  console.log(`✓ OpenAPI specification generated at: ${outputPath}`);
}
