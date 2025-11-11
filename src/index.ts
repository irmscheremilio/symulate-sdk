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
