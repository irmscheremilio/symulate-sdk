import { Collection, CollectionMetadata } from './collection.types';

/**
 * Global symbol for collection registry
 * Uses Symbol.for() to ensure same registry across module instances
 */
const REGISTRY_KEY = Symbol.for('@@symulate/registeredCollections');

/**
 * Get or create global registry
 */
function getRegistry(): Map<string, CollectionMetadata> {
  const globalObj = globalThis as any;

  if (!globalObj[REGISTRY_KEY]) {
    globalObj[REGISTRY_KEY] = new Map<string, CollectionMetadata>();
  }

  return globalObj[REGISTRY_KEY];
}

/**
 * Register a collection in the global registry
 */
export function registerCollection<T>(name: string, metadata: CollectionMetadata<T>): void {
  const registry = getRegistry();

  if (registry.has(name)) {
    console.warn(`Collection "${name}" is already registered. Using existing instance.`);
    return;
  }

  registry.set(name, metadata);
}

/**
 * Get a registered collection by name
 */
export function getCollection<T = any>(name: string): Collection<T> | undefined {
  const registry = getRegistry();
  const metadata = registry.get(name);
  return metadata?.instance as Collection<T>;
}

/**
 * Get all registered collections
 */
export function getRegisteredCollections(): Map<string, CollectionMetadata> {
  return new Map(getRegistry());
}

/**
 * Check if a collection is registered
 */
export function hasCollection(name: string): boolean {
  return getRegistry().has(name);
}

/**
 * Unregister a collection (useful for testing)
 */
export function unregisterCollection(name: string): boolean {
  return getRegistry().delete(name);
}

/**
 * Clear all registered collections (useful for testing)
 */
export function clearCollections(): void {
  getRegistry().clear();
}

/**
 * Get collection metadata (includes config, store, etc.)
 */
export function getCollectionMetadata<T = any>(name: string): CollectionMetadata<T> | undefined {
  return getRegistry().get(name) as CollectionMetadata<T> | undefined;
}

/**
 * Export all collections as array (for CLI tools)
 */
export function exportCollectionsArray(): Array<{
  name: string;
  basePath: string;
  operations: string[];
  schema: any;
}> {
  const registry = getRegistry();
  const collections: Array<any> = [];

  registry.forEach((metadata) => {
    const operations = Array.from(metadata.endpoints.keys());

    collections.push({
      name: metadata.name,
      basePath: metadata.instance.basePath,
      operations,
      schema: metadata.config.schema,
    });
  });

  return collections;
}
