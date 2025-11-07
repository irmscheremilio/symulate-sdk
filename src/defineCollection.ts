import { BaseSchema } from './schema';
import { Collection, CollectionConfig, OperationName, QueryOptions, PaginatedResponse } from './collection.types';
import { DataStore } from './dataStore';
import { getConfig, isDevelopment } from './config';
import { registerCollection, getCollection } from './collectionRegistry';
import { ErrorConfig } from './types';
import { schemaToTypeDescription } from './schema';
import { PLATFORM_CONFIG } from './platformConfig';

/**
 * Check if any error condition is met and throw appropriate error with generated response
 */
async function checkAndThrowError(errors: ErrorConfig[] | undefined, input: any, path: string, method: string): Promise<void> {
  if (!errors || errors.length === 0) return;

  for (const errorConfig of errors) {
    // Check failNow first
    if (errorConfig.failNow) {
      await throwGeneratedError(errorConfig, input, path, method);
    }

    // Check failIf condition
    if (errorConfig.failIf) {
      const shouldFail = await errorConfig.failIf(input);
      if (shouldFail) {
        await throwGeneratedError(errorConfig, input, path, method);
      }
    }
  }
}

/**
 * Throw error with generated response
 */
async function throwGeneratedError(errorConfig: ErrorConfig, input: any, path: string, method: string): Promise<never> {
  console.log(`[Symulate] ⚠️ Simulating error response (${errorConfig.code})`);

  const globalConfig = getConfig();
  let errorResponse: any;

  // Generate realistic error response if schema is provided
  if (errorConfig.schema) {
    try {
      // Call Symulate edge function to generate error response (non-stateful)
      const typeDescription = schemaToTypeDescription(errorConfig.schema);

      const response = await fetch(`${PLATFORM_CONFIG.supabase.url}/functions/v1/symulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mockend-api-key': globalConfig.symulateApiKey || '',
          'x-mockend-project-id': globalConfig.projectId || ''
        },
        body: JSON.stringify({
          schema: typeDescription,
          instruction: errorConfig.description || `Generate error response for HTTP ${errorConfig.code}`,
          count: 1,
        })
      });

      if (!response.ok) {
        throw new Error(`Edge function error: ${response.statusText}`);
      }

      const result: any = await response.json();
      errorResponse = result.data?.[0] || result.data || result;
    } catch (err) {
      console.warn('[Symulate] Failed to generate error response via edge function:', err);
      // Fallback to simple error if generation fails
      errorResponse = {
        error: errorConfig.description || 'Operation failed',
        code: errorConfig.code,
      };
    }
  } else {
    // Default error response
    errorResponse = {
      error: errorConfig.description || 'Operation failed',
      code: errorConfig.code,
    };
  }

  // Create error with status code and response
  const error: any = new Error(typeof errorResponse === 'string' ? errorResponse : (errorResponse.error || errorResponse.message || JSON.stringify(errorResponse)));
  error.status = errorConfig.code;
  error.response = errorResponse;
  throw error;
}

/**
 * Define a stateful CRUD collection
 *
 * @example
 * const users = defineCollection({
 *   name: 'users',
 *   schema: UserSchema,
 *   seedCount: 50
 * });
 *
 * await users.list();
 * await users.get('id');
 * await users.create(data);
 */
export function defineCollection<T extends Record<string, any>>(
  config: CollectionConfig<T>
): Collection<T> {
  // Check if already registered - only return if exact same config
  const existing = getCollection(config.name);
  if (existing) {
    console.warn(`Collection "${config.name}" already registered. Returning existing instance.`);
    return existing as Collection<T>;
  }

  // Normalize configuration
  const normalizedConfig = normalizeConfig(config);

  // Create DataStore
  const store = new DataStore<T>({
    collectionName: normalizedConfig.name,
    schema: normalizedConfig.schema,
    seedCount: normalizedConfig.seedCount,
    seedInstruction: normalizedConfig.seedInstruction,
  });

  // Generate base path
  const basePath = normalizedConfig.basePath;

  // Create endpoints map and track enabled operations
  const endpoints = new Map<OperationName, any>();

  // Check which operations are enabled
  const opsConfig = normalizedConfig.operations;
  const enabledOps = {
    list: isOperationEnabled(opsConfig.list),
    get: isOperationEnabled(opsConfig.get),
    create: isOperationEnabled(opsConfig.create),
    update: isOperationEnabled(opsConfig.update),
    replace: isOperationEnabled(opsConfig.replace),
    delete: isOperationEnabled(opsConfig.delete),
  };

  // Mark enabled operations in endpoints map
  Object.entries(enabledOps).forEach(([op, enabled]) => {
    if (enabled) {
      endpoints.set(op as OperationName, true);
    }
  });

  // Create collection object (start with metadata only)
  const collection: any = {
    // Metadata
    name: normalizedConfig.name,
    basePath,
    schema: normalizedConfig.schema,
    endpoints,
    store,
  };

  // Conditionally add CRUD methods based on enabled operations
  if (enabledOps.list) {
    collection.list = async function(options?: QueryOptions): Promise<PaginatedResponse<T>> {
      if (!isDevelopment()) {
        // Production: call real backend
        return await callBackendList(basePath, options);
      }

      // Check for error conditions
      const operationConfig = getOperationConfig(normalizedConfig, 'list');
      await checkAndThrowError(operationConfig?.errors, options, basePath, 'GET');

      // Map 'filters' to 'filter' for backward compatibility
      const queryOptions = options || {};
      if ((queryOptions as any).filters && !queryOptions.filter) {
        queryOptions.filter = (queryOptions as any).filters;
      }

      return await store.query(queryOptions);
    };
  }

  if (enabledOps.get) {
    collection.get = async function(id: string): Promise<T> {
      if (!isDevelopment()) {
        return await callBackendGet(basePath, id);
      }

      // Check for error conditions
      const operationConfig = getOperationConfig(normalizedConfig, 'get');
      await checkAndThrowError(operationConfig?.errors, { id }, `${basePath}/${id}`, 'GET');

      const item = await store.findById(id);
      if (!item) {
        throw new Error(`${normalizedConfig.name} not found: ${id}`);
      }
      return item;
    };
  }

  if (enabledOps.create) {
    collection.create = async function(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
      if (!isDevelopment()) {
        return await callBackendCreate(basePath, data);
      }

      // Check for error conditions
      const operationConfig = getOperationConfig(normalizedConfig, 'create');
      await checkAndThrowError(operationConfig?.errors, data, basePath, 'POST');

      // Run hooks if defined
      let processedData = data as any;
      if (normalizedConfig.hooks?.beforeCreate) {
        processedData = await normalizedConfig.hooks.beforeCreate(processedData);
      }

      const created = await store.insert(processedData);

      if (normalizedConfig.hooks?.afterCreate) {
        await normalizedConfig.hooks.afterCreate(created);
      }

      return created;
    };
  }

  if (enabledOps.update) {
    collection.update = async function(id: string, data: Partial<T>): Promise<T> {
      if (!isDevelopment()) {
        return await callBackendUpdate(basePath, id, data);
      }

      // Check for error conditions
      const operationConfig = getOperationConfig(normalizedConfig, 'update');
      await checkAndThrowError(operationConfig?.errors, { id, ...data }, `${basePath}/${id}`, 'PATCH');

      let processedData = data;
      if (normalizedConfig.hooks?.beforeUpdate) {
        processedData = await normalizedConfig.hooks.beforeUpdate(id, data);
      }

      const updated = await store.update(id, processedData);
      if (!updated) {
        throw new Error(`${normalizedConfig.name} not found: ${id}`);
      }

      if (normalizedConfig.hooks?.afterUpdate) {
        await normalizedConfig.hooks.afterUpdate(updated);
      }

      return updated;
    };
  }

  if (enabledOps.replace) {
    collection.replace = async function(id: string, data: Omit<T, 'id'>): Promise<T> {
      if (!isDevelopment()) {
        return await callBackendReplace(basePath, id, data);
      }

      // Check for error conditions
      const operationConfig = getOperationConfig(normalizedConfig, 'replace');
      await checkAndThrowError(operationConfig?.errors, { id, ...data }, `${basePath}/${id}`, 'PUT');

      const replaced = await store.replace(id, data as T);
      if (!replaced) {
        throw new Error(`${normalizedConfig.name} not found: ${id}`);
      }

      return replaced;
    };
  }

  if (enabledOps.delete) {
    collection.delete = async function(id: string): Promise<void> {
      if (!isDevelopment()) {
        return await callBackendDelete(basePath, id);
      }

      // Get the item first for error check
      const item = await store.findById(id);
      if (!item) {
        throw new Error(`${normalizedConfig.name} not found: ${id}`);
      }

      // Check for error conditions
      const operationConfig = getOperationConfig(normalizedConfig, 'delete');
      await checkAndThrowError(operationConfig?.errors, item, `${basePath}/${id}`, 'DELETE');

      if (normalizedConfig.hooks?.beforeDelete) {
        await normalizedConfig.hooks.beforeDelete(id);
      }

      const deleted = await store.delete(id);

      if (normalizedConfig.hooks?.afterDelete) {
        await normalizedConfig.hooks.afterDelete(id);
      }
    };
  }

  // Add relation methods dynamically
  if (normalizedConfig.relations) {
    Object.entries(normalizedConfig.relations).forEach(([key, relationConfig]) => {
      const methodName = relationConfig.methodName || `get${capitalize(key)}`;

      collection[methodName] = async (parentId: string) => {
        if (!isDevelopment()) {
          return await callBackendRelation(basePath, parentId, key);
        }

        // Get related collection
        const relatedCollection = getCollection(relationConfig.collection);
        if (!relatedCollection) {
          throw new Error(`Related collection not found: ${relationConfig.collection}`);
        }

        // Query related items by foreign key
        const relatedStore = relatedCollection.store;
        const allItems = await relatedStore.toArray();

        return allItems.filter((item: any) =>
          item[relationConfig.foreignKey] === parentId
        );
      };
    });
  }

  // Register collection globally
  registerCollection(normalizedConfig.name, {
    name: normalizedConfig.name,
    config: normalizedConfig,
    instance: collection,
    endpoints,
    store,
    createdAt: new Date(),
  });

  return collection;
}

/**
 * Normalize collection config with defaults
 */
function normalizeConfig<T>(config: CollectionConfig<T>): Required<CollectionConfig<T>> {
  return {
    name: config.name,
    schema: config.schema,
    basePath: config.basePath || `/${config.name}`,
    seedCount: config.seedCount ?? 10,
    seedInstruction: config.seedInstruction || '',
    operations: normalizeOperations(config.operations),
    relations: config.relations || {},
    plural: config.plural || pluralize(config.name),
    hooks: config.hooks || {},
  };
}

/**
 * Normalize operations config
 */
function normalizeOperations(ops: any): any {
  const defaults = {
    list: true,
    get: true,
    create: true,
    update: true,
    replace: true,
    delete: true,
  };

  if (!ops) return defaults;

  const normalized: any = {};

  Object.entries(defaults).forEach(([key, defaultValue]) => {
    const value = ops[key];

    if (value === undefined) {
      normalized[key] = defaultValue;
    } else if (typeof value === 'boolean') {
      normalized[key] = value;
    } else {
      // It's an OperationConfig object
      normalized[key] = { enabled: true, ...value };
    }
  });

  return normalized;
}

/**
 * Check if an operation is enabled
 */
function isOperationEnabled(config: boolean | any): boolean {
  if (config === undefined || config === true) return true;
  if (config === false) return false;
  if (typeof config === 'object') {
    return config.enabled !== false;
  }
  return true;
}

/**
 * Get operation config from normalized config
 */
function getOperationConfig(config: any, operation: OperationName): any {
  const opConfig = config.operations[operation];
  if (typeof opConfig === 'boolean') return null;
  return opConfig;
}

/**
 * Simple pluralization
 */
function pluralize(word: string): string {
  if (word.endsWith('y')) {
    return word.slice(0, -1) + 'ies';
  }
  if (word.endsWith('s')) {
    return word + 'es';
  }
  return word + 's';
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Production mode backend calls
// These make standard HTTP requests to the real backend

async function callBackendList(basePath: string, options?: QueryOptions): Promise<any> {
  const config = getConfig();
  const url = new URL(basePath, config.backendBaseUrl);

  if (options) {
    if (options.page) url.searchParams.set('page', options.page.toString());
    if (options.limit) url.searchParams.set('limit', options.limit.toString());
    if (options.sortBy) url.searchParams.set('sortBy', options.sortBy);
    if (options.sortOrder) url.searchParams.set('sortOrder', options.sortOrder);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch ${basePath}: ${response.statusText}`);
  }
  return await response.json();
}

async function callBackendGet(basePath: string, id: string): Promise<any> {
  const config = getConfig();
  const url = `${config.backendBaseUrl}${basePath}/${id}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${basePath}/${id}: ${response.statusText}`);
  }
  return await response.json();
}

async function callBackendCreate(basePath: string, data: any): Promise<any> {
  const config = getConfig();
  const url = `${config.backendBaseUrl}${basePath}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create ${basePath}: ${response.statusText}`);
  }
  return await response.json();
}

async function callBackendUpdate(basePath: string, id: string, data: any): Promise<any> {
  const config = getConfig();
  const url = `${config.backendBaseUrl}${basePath}/${id}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update ${basePath}/${id}: ${response.statusText}`);
  }
  return await response.json();
}

async function callBackendReplace(basePath: string, id: string, data: any): Promise<any> {
  const config = getConfig();
  const url = `${config.backendBaseUrl}${basePath}/${id}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to replace ${basePath}/${id}: ${response.statusText}`);
  }
  return await response.json();
}

async function callBackendDelete(basePath: string, id: string): Promise<void> {
  const config = getConfig();
  const url = `${config.backendBaseUrl}${basePath}/${id}`;

  const response = await fetch(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete ${basePath}/${id}: ${response.statusText}`);
  }
}

async function callBackendRelation(basePath: string, parentId: string, relationName: string): Promise<any> {
  const config = getConfig();
  const url = `${config.backendBaseUrl}${basePath}/${parentId}/${relationName}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${basePath}/${parentId}/${relationName}: ${response.statusText}`);
  }
  return await response.json();
}
