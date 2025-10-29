import type { BaseSchema } from "./schema";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type GenerateMode = "ai" | "faker" | "auto";

export interface MockConfig {
  count?: number;
  instruction?: string;
  delay?: number; // Simulated loading delay in milliseconds (only for cached data)
}

export interface ErrorConfig {
  code: number; // HTTP status code (e.g., 400, 404, 500)
  schema?: BaseSchema<any>; // Error response schema (optional - if not provided, generic error used)
  description?: string; // Error description for OpenAPI spec
  failNow?: boolean; // If true, the request will immediately fail with this error
}

export type ParameterLocation = "path" | "query" | "header" | "body";

export interface ParameterConfig {
  name: string;
  location: ParameterLocation;
  required?: boolean;
  schema: BaseSchema<any>;
  description?: string;
  example?: any;
}

// Type helper to extract path parameters from a path string
// e.g., "/users/:id/posts/:postId" -> "id" | "postId"
type ExtractPathParams<Path extends string> =
  Path extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? Param | ExtractPathParams<`/${Rest}`>
    : Path extends `${infer _Start}:${infer Param}`
    ? Param
    : never;

// Type helper to extract parameter names with location "path" from params array
type ExtractPathParamNames<Params extends readonly ParameterConfig[]> =
  Params extends readonly [infer First, ...infer Rest]
    ? First extends ParameterConfig
      ? First["location"] extends "path"
        ? First["name"] | (Rest extends readonly ParameterConfig[] ? ExtractPathParamNames<Rest> : never)
        : (Rest extends readonly ParameterConfig[] ? ExtractPathParamNames<Rest> : never)
      : never
    : never;

// Validation type that checks if all path parameters defined in params are present in the path
type ValidatePathParams<
  Path extends string,
  Params extends readonly ParameterConfig[] | undefined
> = Params extends readonly ParameterConfig[]
  ? ExtractPathParamNames<Params> extends never
    ? true // No path params defined, no validation needed
    : ExtractPathParams<Path> extends never
    ? ExtractPathParamNames<Params> extends never
      ? true
      : `Error: Path parameter '${ExtractPathParamNames<Params>}' is defined in params but not found in path '${Path}'. Add ':${ExtractPathParamNames<Params>}' to your path.`
    : ExtractPathParamNames<Params> extends ExtractPathParams<Path>
    ? true
    : `Error: Path parameter '${Exclude<ExtractPathParamNames<Params>, ExtractPathParams<Path>>}' is defined in params but not found in path '${Path}'. Add ':${Exclude<ExtractPathParamNames<Params>, ExtractPathParams<Path>>}' to your path.`
  : true; // No params defined, no validation needed

export interface EndpointConfig<T> {
  path: string;
  method: HttpMethod;
  schema?: BaseSchema<T>; // Schema-based definition (required for AI generation)
  mock?: MockConfig;
  params?: ParameterConfig[]; // Structured parameter definitions
  mode?: "mock" | "production"; // Override global environment setting for this specific endpoint
  errors?: ErrorConfig[]; // Possible error responses for this endpoint
}

// Type-safe endpoint config that validates path parameters at compile time
export type ValidatedEndpointConfig<T, Path extends string = string, Params extends readonly ParameterConfig[] | undefined = undefined> =
  EndpointConfig<T> & {
    path: Path;
    params?: Params;
  } & (ValidatePathParams<Path, Params> extends true
    ? {}
    : { __pathParamValidationError: ValidatePathParams<Path, Params> });

export interface MockendConfig {
  symulateApiKey?: string; // Mockend Platform API key (sym_live_xxx) - get yours at https://platform.symulate.dev
  projectId?: string; // Project ID for multi-project isolation (get from https://platform.symulate.dev)
  backendBaseUrl?: string;
  environment?: "development" | "production";
  cacheEnabled?: boolean;
  persistentCache?: boolean; // Use localStorage in browser to persist cache across reloads (default: false)
  generateMode?: GenerateMode; // "ai" = always use AI, "faker" = pure Faker.js (CI/CD), "auto" = try AI then fallback (default: "auto")
  fakerSeed?: number; // Seed for deterministic Faker.js generation (useful for reproducible tests in CI/CD)
  language?: string; // Language for AI-generated data (e.g., "en", "es", "fr", "de", "ja", "zh"). Premium feature - only works with AI mode (generateMode: "ai" or "auto"). Faker mode always generates English data.
  regenerateOnConfigChange?: boolean; // When true, cache is invalidated when endpoint config changes (method, mock.count, mock.instruction, etc.). Default: true
}

export interface CachedTemplate {
  template: any;
  timestamp: number;
  schemaHash: string;
  path?: string; // The endpoint path that generated this cache entry
}

export interface AIProviderOptions {
  schema: any;
  instruction?: string;
  typeDescription?: any; // Type descriptions for AI (from schema)
}

export type EndpointFunction<T> = (params?: Record<string, any>) => Promise<T>;
