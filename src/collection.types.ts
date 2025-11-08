import { BaseSchema, Infer } from './schema';
import { ErrorConfig, ParameterConfig, MockConfig } from './types';

/**
 * HTTP methods supported for CRUD operations
 */
export type CRUDMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Standard CRUD operation names
 */
export type OperationName = 'list' | 'get' | 'create' | 'update' | 'replace' | 'delete';

/**
 * Configuration for a single CRUD operation
 * Has same capabilities as defineEndpoint for consistency
 */
export interface OperationConfig {
  /**
   * Enable/disable this operation
   * @default true
   */
  enabled?: boolean;

  /**
   * Custom path for this operation
   * If not provided, uses convention-based path
   * @example '/api/users' or '/api/users/:id'
   */
  path?: string;

  /**
   * HTTP method override (rarely needed)
   * @default Convention-based (GET for list/get, POST for create, etc.)
   */
  method?: CRUDMethod;

  /**
   * Response schema for this operation
   * Defines the structure of data returned by this specific operation
   * Different from the collection's entity schema
   *
   * Examples:
   * - list: Response with { data: T[], pagination: {...} }
   * - get: Single entity T
   * - create/update/replace: Created/updated entity T
   * - delete: void or { success: boolean }
   *
   * Note: Should only use fields from the collection's entity schema
   */
  responseSchema?: BaseSchema<any>;

  /**
   * Parameter definitions (path, query, body, headers)
   * Same as defineEndpoint params
   *
   * @example
   * params: [
   *   { name: 'id', location: 'path', schema: m.string(), required: true },
   *   { name: 'page', location: 'query', schema: m.number() }
   * ]
   */
  params?: ParameterConfig[];

  /**
   * Error configurations for this operation
   * Each error can have a failIf condition to trigger it conditionally
   * Same as defineEndpoint errors config
   */
  errors?: ErrorConfig[];

  /**
   * Custom mock configuration for this operation
   * Same as defineEndpoint mock config
   */
  mock?: MockConfig;

  /**
   * Override environment mode for this operation
   * @default Uses global config
   */
  mode?: 'mock' | 'production';

  /**
   * Disable automatic query parameters (pagination, sorting, filtering) for this operation
   * Overrides global disableQueryParams setting
   * @default false (query params are enabled)
   */
  disableQueryParams?: boolean;

}

/**
 * Configuration for all CRUD operations
 */
export interface OperationsConfig {
  list?: boolean | OperationConfig;
  get?: boolean | OperationConfig;
  create?: boolean | OperationConfig;
  update?: boolean | OperationConfig;
  replace?: boolean | OperationConfig;
  delete?: boolean | OperationConfig;
}

/**
 * Configuration for a related collection
 */
export interface RelationConfig {
  /**
   * Name of the related collection
   */
  collection: string;

  /**
   * Foreign key field name
   * @example 'userId' for posts.userId
   */
  foreignKey: string;

  /**
   * Type of relationship
   * @default 'oneToMany'
   */
  type?: 'oneToMany' | 'manyToOne' | 'manyToMany';

  /**
   * Method name for accessing relation
   * If not provided, uses 'get' + capitalized collection name
   * @example 'getPosts' for users.getPosts(userId)
   */
  methodName?: string;
}

/**
 * Main configuration for defineCollection
 */
export interface CollectionConfig<T = any> {
  /**
   * Unique name for this collection
   * Used to generate method names and default paths
   * @example 'users' → users.list(), /users
   */
  name: string;

  /**
   * Schema definition for the collection.
   * This is what will be generated and stored for this collection.
   * Using the oprations, you will be able to perform some actions on the stored collection.
   * Uses Symulate schema builder (m.object(...))
   */
  schema: BaseSchema<T>;

  /**
   * Base path for all endpoints
   * @default `/${name}`
   * @example '/api/v1/users'
   */
  basePath?: string;

  /**
   * Number of seed items to generate
   * @default 10
   */
  seedCount?: number;

  /**
   * Seed data generation instruction for AI
   * @example 'Generate realistic employees from a tech company'
   */
  seedInstruction?: string;

  /**
   * Configure which operations to generate
   * @default All operations enabled
   */
  operations?: OperationsConfig;

  /**
   * Define relationships to other collections
   */
  relations?: Record<string, RelationConfig>;

  /**
   * Custom plural form for naming
   * @example { name: 'person', plural: 'people' }
   */
  plural?: string;

  /**
   * Lifecycle hooks (future enhancement)
   */
  hooks?: {
    beforeCreate?: (data: T) => T | Promise<T>;
    afterCreate?: (data: T) => void | Promise<void>;
    beforeUpdate?: (id: string, data: Partial<T>) => Partial<T> | Promise<Partial<T>>;
    afterUpdate?: (data: T) => void | Promise<void>;
    beforeDelete?: (id: string) => boolean | Promise<boolean>;
    afterDelete?: (id: string) => void | Promise<void>;
  };
}

/**
 * Query options for list operation
 */
export interface QueryOptions {
  /**
   * Page number (1-indexed)
   */
  page?: number;

  /**
   * Items per page
   * @default 20
   */
  limit?: number;

  /**
   * Field to sort by
   */
  sortBy?: string;

  /**
   * Sort order
   * @default 'asc'
   */
  sortOrder?: 'asc' | 'desc';

  /**
   * Filter criteria (future enhancement)
   */
  filter?: Record<string, any>;

  /**
   * Custom fetch implementation for this specific operation
   * Overrides global fetch configuration
   */
  fetch?: typeof fetch;
}

/**
 * Options for single-item operations (get, update, replace, delete)
 */
export interface OperationOptions {
  /**
   * Custom fetch implementation for this specific operation
   * Overrides global fetch configuration
   */
  fetch?: typeof fetch;
}

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Collection instance returned by defineCollection
 */
export interface Collection<T = any> {
  /**
   * Collection name
   */
  readonly name: string;

  /**
   * Base path for all endpoints
   */
  readonly basePath: string;

  /**
   * Schema definition
   */
  readonly schema: BaseSchema<T>;

  /**
   * Generated endpoints map
   * Key: operation name, Value: endpoint config
   */
  readonly endpoints: Map<OperationName, any>;

  /**
   * Internal data store (for advanced use)
   */
  readonly store: any;

  // CRUD Operations

  /**
   * List all items with pagination
   * GET /{basePath}
   */
  list(options?: QueryOptions): Promise<PaginatedResponse<T>>;

  /**
   * Get single item by ID
   * GET /{basePath}/:id
   */
  get(id: string, options?: OperationOptions): Promise<T>;

  /**
   * Create new item
   * POST /{basePath}
   */
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>, options?: OperationOptions): Promise<T>;

  /**
   * Partial update (PATCH)
   * PATCH /{basePath}/:id
   */
  update(id: string, data: Partial<T>, options?: OperationOptions): Promise<T>;

  /**
   * Full replacement (PUT)
   * PUT /{basePath}/:id
   */
  replace(id: string, data: Omit<T, 'id'>, options?: OperationOptions): Promise<T>;

  /**
   * Delete item
   * DELETE /{basePath}/:id
   */
  delete(id: string, options?: OperationOptions): Promise<void>;

  // Dynamic relation methods added at runtime
  // e.g., getPosts(userId: string): Promise<Post[]>
  [key: string]: any;
}

/**
 * Internal metadata for collection registry
 */
export interface CollectionMetadata<T = any> {
  name: string;
  config: CollectionConfig<T>;
  instance: Collection<T>;
  endpoints: Map<OperationName, any>;
  store: any;
  createdAt: Date;
}

/**
 * Configuration for collection persistence
 */
export interface PersistenceConfig {
  /**
   * Persistence mode
   * - 'memory': In-memory only (default)
   * - 'local': localStorage (browser) or file (Node.js)
   * - 'cloud': Cloud sync via Supabase
   */
  mode: 'memory' | 'local' | 'cloud';

  /**
   * File path for local file persistence in Node.js
   * @default '.symulate-data.json'
   */
  filePath?: string;

  /**
   * Auto-save interval in milliseconds
   * @default 5000 (5 seconds)
   */
  autoSaveInterval?: number;
}

/**
 * Extract inferred type from schema
 */
export type InferCollection<C extends Collection<any>> =
  C extends Collection<infer T> ? T : never;

/**
 * Helper to ensure operation config is normalized
 */
export type NormalizedOperationConfig = Required<OperationConfig> & {
  enabled: true;
};

/**
 * Map of operation name to normalized config
 */
export type NormalizedOperations = Partial<Record<OperationName, NormalizedOperationConfig>>;
