import { CollectionConfig, OperationName, OperationConfig, PaginatedResponse } from '../collection.types';
import { DataStore } from '../dataStore';
import { defineEndpoint } from '../defineEndpoint';
import { m } from '../schema';

/**
 * Generate all enabled operation endpoints for a collection
 * Each operation is implemented using defineEndpoint() for consistency
 */
export function generateOperationEndpoints<T>(
  config: CollectionConfig<T>,
  basePath: string,
  store: DataStore<T>
): Map<OperationName, any> {
  const endpoints = new Map<OperationName, any>();

  const operations = config.operations || {};

  // Generate endpoints for each enabled operation
  if (isEnabled(operations.list)) {
    endpoints.set('list', createListEndpoint(config, basePath, store));
  }

  if (isEnabled(operations.get)) {
    endpoints.set('get', createGetEndpoint(config, basePath, store));
  }

  if (isEnabled(operations.create)) {
    endpoints.set('create', createCreateEndpoint(config, basePath, store));
  }

  if (isEnabled(operations.update)) {
    endpoints.set('update', createUpdateEndpoint(config, basePath, store));
  }

  if (isEnabled(operations.replace)) {
    endpoints.set('replace', createReplaceEndpoint(config, basePath, store));
  }

  if (isEnabled(operations.delete)) {
    endpoints.set('delete', createDeleteEndpoint(config, basePath, store));
  }

  return endpoints;
}

/**
 * Create LIST endpoint - GET /basePath
 */
function createListEndpoint<T>(
  config: CollectionConfig<T>,
  basePath: string,
  store: DataStore<T>
): any {
  const opConfig = getOpConfig(config.operations?.list);

  // Define paginated response schema
  const paginatedSchema = m.object({
    data: m.array(config.schema),
    pagination: m.object({
      page: m.number(),
      limit: m.number(),
      total: m.number(),
      totalPages: m.number(),
    }),
  });

  return defineEndpoint({
    path: basePath,
    method: 'GET',
    schema: paginatedSchema,
    errors: opConfig?.errors,
    mock: {
      count: 1, // Generate one paginated response
      instruction: config.seedInstruction
        ? `Generate a list of ${config.name}: ${config.seedInstruction}`
        : `Generate a list of ${config.name}`,
    },
  });
}

/**
 * Create GET endpoint - GET /basePath/:id
 */
function createGetEndpoint<T>(
  config: CollectionConfig<T>,
  basePath: string,
  store: DataStore<T>
): any {
  const opConfig = getOpConfig(config.operations?.get);

  return defineEndpoint({
    path: `${basePath}/:id`,
    method: 'GET',
    schema: config.schema,
    errors: opConfig?.errors,
    mock: {
      count: 1,
      instruction: config.seedInstruction
        ? `Generate a single ${config.name}: ${config.seedInstruction}`
        : `Generate a single ${config.name}`,
    },
  });
}

/**
 * Create CREATE endpoint - POST /basePath
 */
function createCreateEndpoint<T>(
  config: CollectionConfig<T>,
  basePath: string,
  store: DataStore<T>
): any {
  const opConfig = getOpConfig(config.operations?.create);

  return defineEndpoint({
    path: basePath,
    method: 'POST',
    schema: config.schema,
    errors: opConfig?.errors,
    mock: {
      count: 1,
      instruction: config.seedInstruction
        ? `Generate a new ${config.name}: ${config.seedInstruction}`
        : `Generate a new ${config.name}`,
    },
  });
}

/**
 * Create UPDATE endpoint - PATCH /basePath/:id
 */
function createUpdateEndpoint<T>(
  config: CollectionConfig<T>,
  basePath: string,
  store: DataStore<T>
): any {
  const opConfig = getOpConfig(config.operations?.update);

  return defineEndpoint({
    path: `${basePath}/:id`,
    method: 'PATCH',
    schema: config.schema,
    errors: opConfig?.errors,
    mock: {
      count: 1,
      instruction: config.seedInstruction
        ? `Generate an updated ${config.name}: ${config.seedInstruction}`
        : `Generate an updated ${config.name}`,
    },
  });
}

/**
 * Create REPLACE endpoint - PUT /basePath/:id
 */
function createReplaceEndpoint<T>(
  config: CollectionConfig<T>,
  basePath: string,
  store: DataStore<T>
): any {
  const opConfig = getOpConfig(config.operations?.replace);

  return defineEndpoint({
    path: `${basePath}/:id`,
    method: 'PUT',
    schema: config.schema,
    errors: opConfig?.errors,
    mock: {
      count: 1,
      instruction: config.seedInstruction
        ? `Generate a replaced ${config.name}: ${config.seedInstruction}`
        : `Generate a replaced ${config.name}`,
    },
  });
}

/**
 * Create DELETE endpoint - DELETE /basePath/:id
 */
function createDeleteEndpoint<T>(
  config: CollectionConfig<T>,
  basePath: string,
  store: DataStore<T>
): any {
  const opConfig = getOpConfig(config.operations?.delete);

  // Delete returns void, but we need to provide a schema
  // Use a simple success response schema
  const deleteSchema = m.object({
    success: m.boolean(),
  });

  return defineEndpoint({
    path: `${basePath}/:id`,
    method: 'DELETE',
    schema: deleteSchema,
    errors: opConfig?.errors,
    mock: {
      count: 1,
      instruction: `Confirm deletion of ${config.name}`,
    },
  });
}

/**
 * Check if an operation is enabled
 */
export function isEnabled(config: boolean | OperationConfig | undefined): boolean {
  if (config === undefined || config === true) return true;
  if (config === false) return false;
  if (typeof config === 'object') {
    return config.enabled !== false;
  }
  return true;
}

/**
 * Get operation config (normalized)
 */
export function getOpConfig(config: boolean | OperationConfig | undefined): OperationConfig | null {
  if (typeof config === 'boolean' || !config) return null;
  return config;
}
