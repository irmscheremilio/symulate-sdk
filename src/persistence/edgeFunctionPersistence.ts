import { getConfig } from '../config';
import { PLATFORM_CONFIG } from '../platformConfig';

/**
 * Persistence layer that calls the Symulate edge function
 * Used in browser environments where direct Supabase access isn't available
 */

const EDGE_FUNCTION_URL = `${PLATFORM_CONFIG.supabase.url}/functions/v1/symulate`;

/**
 * Load collection data from edge function
 */
export async function loadFromEdgeFunction<T>(collectionName: string, schema: any, seedInstruction?: string): Promise<T[] | null> {
  try {
    const config = getConfig();

    if (!config.symulateApiKey || !config.projectId) {
      throw new Error('API key and project ID required. Configure with configureSymulate()');
    }

    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mockend-API-Key': config.symulateApiKey,
        'X-Mockend-Project-Id': config.projectId,
        'X-Symulate-Stateful-Operation': 'list',
      },
      body: JSON.stringify({
        collectionName,
        schema,
        instruction: seedInstruction,
        operation: 'list',
        page: 1,
        limit: 10000, // Get all items
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to load collection: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.warn(`Failed to load ${collectionName} from edge function:`, error);
    return null;
  }
}

/**
 * Save collection data via edge function
 * Note: This is handled transparently by CRUD operations
 */
export async function saveToEdgeFunction<T>(collectionName: string, data: T[]): Promise<void> {
  // Not needed - each operation (create/update/delete) handles persistence
  // This exists for API compatibility
  return;
}

/**
 * Create a new item in collection via edge function
 */
export async function createInEdgeFunction<T>(collectionName: string, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
  const config = getConfig();

  if (!config.symulateApiKey || !config.projectId) {
    throw new Error('API key and project ID required. Configure with configureSymulate()');
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Mockend-API-Key': config.symulateApiKey,
      'X-Mockend-Project-Id': config.projectId,
      'X-Symulate-Stateful-Operation': 'create',
    },
    body: JSON.stringify({
      collectionName,
      operation: 'create',
      data,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to create item: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Update an item in collection via edge function
 */
export async function updateInEdgeFunction<T>(collectionName: string, id: string, data: Partial<T>): Promise<T> {
  const config = getConfig();

  if (!config.symulateApiKey || !config.projectId) {
    throw new Error('API key and project ID required. Configure with configureSymulate()');
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Mockend-API-Key': config.symulateApiKey,
      'X-Mockend-Project-Id': config.projectId,
      'X-Symulate-Stateful-Operation': 'update',
    },
    body: JSON.stringify({
      collectionName,
      operation: 'update',
      id,
      data,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to update item: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Delete an item from collection via edge function
 */
export async function deleteFromEdgeFunction(collectionName: string, id: string): Promise<void> {
  const config = getConfig();

  if (!config.symulateApiKey || !config.projectId) {
    throw new Error('API key and project ID required. Configure with configureSymulate()');
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Mockend-API-Key': config.symulateApiKey,
      'X-Mockend-Project-Id': config.projectId,
      'X-Symulate-Stateful-Operation': 'delete',
    },
    body: JSON.stringify({
      collectionName,
      operation: 'delete',
      id,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to delete item: ${response.statusText}`);
  }
}

/**
 * Query collection with filters/pagination via edge function
 */
export async function queryEdgeFunction<T>(
  collectionName: string,
  schema: any,
  seedInstruction: string | undefined,
  filters?: Record<string, any>,
  page?: number,
  limit?: number,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): Promise<{ data: T[]; pagination: any }> {
  const config = getConfig();

  if (!config.symulateApiKey || !config.projectId) {
    throw new Error('API key and project ID required. Configure with configureSymulate()');
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Mockend-API-Key': config.symulateApiKey,
      'X-Mockend-Project-Id': config.projectId,
      'X-Symulate-Stateful-Operation': 'list',
    },
    body: JSON.stringify({
      collectionName,
      schema,
      instruction: seedInstruction,
      operation: 'list',
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to query collection: ${response.statusText}`);
  }

  return await response.json();
}
