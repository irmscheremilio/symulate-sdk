// Browser-safe entry point - excludes all Node.js-specific modules
// This ensures the SDK can be used in browser environments without bundling Node.js modules

export { defineEndpoint, getRegisteredEndpoints } from "./defineEndpoint";
export { configureSymulate, getConfig, isDevelopment, isProduction, clearQuotaState } from "./config";
export { clearCache, debugCache } from "./cache";
export { TypeValidationError } from "./validator";
export * from "./types";
export { m, SchemaBuilder, type Infer, type BaseSchema, type ObjectSchema, type ArraySchema, type JoinSchema } from "./schema";
export type { GenerateMode } from "./types";

// Database Table Schemas
export { dbTable } from "./dbTable";
export type { DbTableOptions, ExtendableSchema } from "./dbTable";

// Relations
export { resolveJoins, buildDependencyGraph, getCollectionSeedOrder, getAllRelatedCollections } from "./relations";

// Stateful Collections API
export { defineCollection } from "./defineCollection";
export { getRegisteredCollections, getCollection, hasCollection, exportCollectionsArray } from "./collectionRegistry";
export type {
  Collection,
  CollectionConfig,
  QueryOptions,
  PaginatedResponse,
  OperationConfig,
  OperationsConfig,
  RelationConfig,
  CollectionMetadata,
  PersistenceConfig,
  OperationName,
  InferCollection,
} from "./collection.types";

// Note: Auth, CLI, and Node.js-specific features are NOT exported in browser build
// For Node.js/CLI usage, import from '@symulate/sdk' directly
