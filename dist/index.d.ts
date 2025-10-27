/**
 * Schema builder for Mockend - defines both TypeScript types and runtime schema information
 * Similar to Zod, but optimized for mock data generation
 */
type SchemaType = "uuid" | "string" | "number" | "boolean" | "date" | "email" | "url" | "phoneNumber" | "person.fullName" | "person.firstName" | "person.lastName" | "person.jobTitle" | "internet.userName" | "internet.avatar" | "location.street" | "location.city" | "location.state" | "location.zipCode" | "location.country" | "location.latitude" | "location.longitude" | "commerce.productName" | "commerce.department" | "commerce.price" | "lorem.word" | "lorem.sentence" | "lorem.paragraph";
interface BaseSchema<T = any> {
    _type: T;
    _meta: {
        schemaType: SchemaType | "object" | "array";
        description?: string;
    };
}
interface StringSchema extends BaseSchema<string> {
    _meta: {
        schemaType: SchemaType;
        description?: string;
    };
}
interface NumberSchema extends BaseSchema<number> {
    _meta: {
        schemaType: "number" | "commerce.price";
        description?: string;
    };
}
interface BooleanSchema extends BaseSchema<boolean> {
    _meta: {
        schemaType: "boolean";
        description?: string;
    };
}
interface ObjectSchema<T extends Record<string, any>> extends BaseSchema<T> {
    _meta: {
        schemaType: "object";
        description?: string;
    };
    _shape: {
        [K in keyof T]: BaseSchema<T[K]>;
    };
}
interface ArraySchema<T> extends BaseSchema<T[]> {
    _meta: {
        schemaType: "array";
        description?: string;
    };
    _element: BaseSchema<T>;
}
type Infer<T extends BaseSchema> = T["_type"];
declare class SchemaBuilder {
    uuid(description?: string): StringSchema;
    string(description?: string): StringSchema;
    number(description?: string): NumberSchema;
    boolean(description?: string): BooleanSchema;
    date(description?: string): StringSchema;
    email(description?: string): StringSchema;
    url(description?: string): StringSchema;
    phoneNumber(description?: string): StringSchema;
    person: {
        fullName: (description?: string) => StringSchema;
        firstName: (description?: string) => StringSchema;
        lastName: (description?: string) => StringSchema;
        jobTitle: (description?: string) => StringSchema;
    };
    internet: {
        userName: (description?: string) => StringSchema;
        avatar: (description?: string) => StringSchema;
    };
    location: {
        street: (description?: string) => StringSchema;
        city: (description?: string) => StringSchema;
        state: (description?: string) => StringSchema;
        zipCode: (description?: string) => StringSchema;
        country: (description?: string) => StringSchema;
        latitude: (description?: string) => StringSchema;
        longitude: (description?: string) => StringSchema;
    };
    commerce: {
        productName: (description?: string) => StringSchema;
        department: (description?: string) => StringSchema;
        price: (description?: string) => NumberSchema;
    };
    lorem: {
        word: (description?: string) => StringSchema;
        sentence: (description?: string) => StringSchema;
        paragraph: (description?: string) => StringSchema;
    };
    object<T extends Record<string, BaseSchema>>(shape: T, description?: string): ObjectSchema<{
        [K in keyof T]: Infer<T[K]>;
    }>;
    array<T extends BaseSchema>(element: T, description?: string): ArraySchema<Infer<T>>;
}
declare const m: SchemaBuilder;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type GenerateMode = "ai" | "faker" | "auto";
interface MockConfig {
    count?: number;
    instruction?: string;
    delay?: number;
}
interface ErrorConfig {
    code: number;
    schema?: BaseSchema<any>;
    description?: string;
    failNow?: boolean;
}
type ParameterLocation = "path" | "query" | "header" | "body";
interface ParameterConfig {
    name: string;
    location: ParameterLocation;
    required?: boolean;
    schema: BaseSchema<any>;
    description?: string;
    example?: any;
}
type ExtractPathParams<Path extends string> = Path extends `${infer _Start}:${infer Param}/${infer Rest}` ? Param | ExtractPathParams<`/${Rest}`> : Path extends `${infer _Start}:${infer Param}` ? Param : never;
type ExtractPathParamNames<Params extends readonly ParameterConfig[]> = Params extends readonly [infer First, ...infer Rest] ? First extends ParameterConfig ? First["location"] extends "path" ? First["name"] | (Rest extends readonly ParameterConfig[] ? ExtractPathParamNames<Rest> : never) : (Rest extends readonly ParameterConfig[] ? ExtractPathParamNames<Rest> : never) : never : never;
type ValidatePathParams<Path extends string, Params extends readonly ParameterConfig[] | undefined> = Params extends readonly ParameterConfig[] ? ExtractPathParamNames<Params> extends never ? true : ExtractPathParams<Path> extends never ? ExtractPathParamNames<Params> extends never ? true : `Error: Path parameter '${ExtractPathParamNames<Params>}' is defined in params but not found in path '${Path}'. Add ':${ExtractPathParamNames<Params>}' to your path.` : ExtractPathParamNames<Params> extends ExtractPathParams<Path> ? true : `Error: Path parameter '${Exclude<ExtractPathParamNames<Params>, ExtractPathParams<Path>>}' is defined in params but not found in path '${Path}'. Add ':${Exclude<ExtractPathParamNames<Params>, ExtractPathParams<Path>>}' to your path.` : true;
interface EndpointConfig<T> {
    path: string;
    method: HttpMethod;
    schema?: BaseSchema<T>;
    mock?: MockConfig;
    params?: ParameterConfig[];
    mode?: "mock" | "production";
    errors?: ErrorConfig[];
}
type ValidatedEndpointConfig<T, Path extends string = string, Params extends readonly ParameterConfig[] | undefined = undefined> = EndpointConfig<T> & {
    path: Path;
    params?: Params;
} & (ValidatePathParams<Path, Params> extends true ? {} : {
    __pathParamValidationError: ValidatePathParams<Path, Params>;
});
interface MockendConfig {
    symulateApiKey?: string;
    projectId?: string;
    backendBaseUrl?: string;
    environment?: "development" | "production";
    cacheEnabled?: boolean;
    persistentCache?: boolean;
    generateMode?: GenerateMode;
    fakerSeed?: number;
    language?: string;
    regenerateOnConfigChange?: boolean;
}
interface CachedTemplate {
    template: any;
    timestamp: number;
    schemaHash: string;
}
interface AIProviderOptions {
    schema: any;
    instruction?: string;
    typeDescription?: any;
}
type EndpointFunction<T> = (params?: Record<string, any>) => Promise<T>;

declare function defineEndpoint<T, Path extends string, Params extends readonly ParameterConfig[]>(config: ValidatedEndpointConfig<T, Path, Params>): EndpointFunction<T>;
declare function defineEndpoint<T>(config: EndpointConfig<T>): EndpointFunction<T>;
declare function getRegisteredEndpoints(): Map<string, EndpointConfig<any>>;

declare function configureSymulate(config: MockendConfig): void;
declare function getConfig(): MockendConfig;
declare function isDevelopment(): boolean;
declare function isProduction(): boolean;
/**
 * Clear quota state (useful for testing or manual override)
 */
declare function clearQuotaState(apiKey?: string): void;

declare function clearCache(apiKeyId?: string): Promise<void>;
declare function debugCache(): void;

declare class TypeValidationError extends Error {
    readonly path: string;
    readonly expected: string;
    readonly received: any;
    readonly fullResponse: any;
    constructor(path: string, expected: string, received: any, fullResponse: any);
}

export { type AIProviderOptions, type ArraySchema, type BaseSchema, type CachedTemplate, type EndpointConfig, type EndpointFunction, type ErrorConfig, type GenerateMode, type HttpMethod, type Infer, type MockConfig, type MockendConfig, type ObjectSchema, type ParameterConfig, type ParameterLocation, TypeValidationError, type ValidatedEndpointConfig, clearCache, clearQuotaState, configureSymulate, debugCache, defineEndpoint, getConfig, getRegisteredEndpoints, isDevelopment, isProduction, m };
