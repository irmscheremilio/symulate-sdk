/**
 * Relations resolver for interconnected collections
 * Handles joins at query time without storing denormalized data
 */

import type { BaseSchema, ObjectSchema, JoinSchema } from './schema';
import type { RelationConfig } from './collection.types';
import { getCollectionRegistry } from './collectionRegistry';

/**
 * Resolve join fields in a data object using relation configurations
 *
 * @param data - The data object to process
 * @param responseSchema - Schema with m.join() fields
 * @param relations - Relation configurations for this collection
 * @param collectionName - Name of the current collection
 * @returns Data with joined fields resolved
 */
export async function resolveJoins(
  data: any,
  responseSchema: BaseSchema,
  relations: Record<string, RelationConfig> | undefined,
  collectionName: string
): Promise<any> {
  if (!responseSchema || responseSchema._meta.schemaType !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    // Resolve joins for array of items
    return Promise.all(data.map(item => resolveJoinsForItem(item, responseSchema, relations, collectionName)));
  }

  // Resolve joins for single item
  return resolveJoinsForItem(data, responseSchema, relations, collectionName);
}

/**
 * Resolve joins for a single data item
 */
async function resolveJoinsForItem(
  item: any,
  responseSchema: BaseSchema,
  relations: Record<string, RelationConfig> | undefined,
  collectionName: string
): Promise<any> {
  if (!item || typeof item !== 'object' || !responseSchema || responseSchema._meta.schemaType !== 'object') {
    return item;
  }

  const objSchema = responseSchema as ObjectSchema<any>;
  const result = { ...item };

  // Process each field in the response schema
  for (const [fieldName, fieldSchema] of Object.entries(objSchema._shape)) {
    // Check if this is a join field
    if (fieldSchema._meta.schemaType === 'join') {
      const joinSchema = fieldSchema as JoinSchema;
      const { relationPath, field } = joinSchema._meta.join;

      try {
        // Resolve the join
        const joinedValue = await resolveJoinPath(item, relationPath, field, relations);
        result[fieldName] = joinedValue;
      } catch (error) {
        console.warn(`[Symulate] Failed to resolve join for field '${fieldName}':`, error);
        result[fieldName] = null;
      }
    }
  }

  return result;
}

/**
 * Resolve a join path (e.g., "user" or "purchase.user")
 * Supports nested joins using dot notation
 */
async function resolveJoinPath(
  item: any,
  relationPath: string,
  field: string | undefined,
  relations: Record<string, RelationConfig> | undefined
): Promise<any> {
  if (!relations) {
    throw new Error(`No relations configured for join path: ${relationPath}`);
  }

  const pathParts = relationPath.split('.');
  const firstRelation = pathParts[0];

  // Get the relation config
  const relationConfig = relations[firstRelation];
  if (!relationConfig) {
    throw new Error(`Relation '${firstRelation}' not found in relations config`);
  }

  // Get the related collection
  const registry = getCollectionRegistry();
  const relatedCollection = registry.get(relationConfig.collection);
  if (!relatedCollection) {
    throw new Error(`Related collection '${relationConfig.collection}' not found`);
  }

  // Get the foreign key value from the current item
  const foreignKeyValue = item[relationConfig.foreignKey];
  if (!foreignKeyValue) {
    return null; // No related data
  }

  // Fetch the related item
  const referencedField = relationConfig.references || 'id';
  let relatedItem: any;

  // Access raw store data directly to avoid recursive join resolution
  const store = relatedCollection.store;
  if (!store) {
    throw new Error(`Store not found for collection '${relationConfig.collection}'`);
  }

  // Ensure store is initialized
  await store.initialize();

  // Get all items from store without triggering joins
  const allRelatedItems = await store.toArray();

  // Handle different relation types
  if (relationConfig.type === 'belongsTo') {
    // For belongsTo, the FK is in this collection, references the related collection
    relatedItem = allRelatedItems.find((i: any) => i[referencedField] === foreignKeyValue);
  } else if (relationConfig.type === 'hasMany') {
    // For hasMany, the FK is in the related collection
    relatedItem = allRelatedItems.filter((i: any) => i[relationConfig.foreignKey] === item[referencedField]);
  } else if (relationConfig.type === 'hasOne') {
    // For hasOne, the FK is in the related collection
    relatedItem = allRelatedItems.find((i: any) => i[relationConfig.foreignKey] === item[referencedField]);
  }

  if (!relatedItem) {
    return null;
  }

  // If there are more path parts, recursively resolve
  if (pathParts.length > 1) {
    const remainingPath = pathParts.slice(1).join('.');
    return resolveJoinPath(relatedItem, remainingPath, field, relatedCollection.config.relations);
  }

  // Return the specified field or the whole object
  if (field) {
    return relatedItem[field];
  }

  return relatedItem;
}

/**
 * Build dependency graph for collections based on their relations
 * Used for eager loading and seed generation order
 */
export function buildDependencyGraph(): Map<string, Set<string>> {
  const registry = getCollectionRegistry();
  const graph = new Map<string, Set<string>>();

  // Initialize graph with all collections
  for (const [name] of registry.entries()) {
    graph.set(name, new Set());
  }

  // Build dependencies
  for (const [name, metadata] of registry.entries()) {
    const relations = metadata.config.relations;
    if (!relations) continue;

    for (const [_relationName, relationConfig] of Object.entries(relations)) {
      // For belongsTo, this collection depends on the related collection
      if (relationConfig.type === 'belongsTo') {
        const deps = graph.get(name) || new Set();
        deps.add(relationConfig.collection);
        graph.set(name, deps);
      }
    }
  }

  return graph;
}

/**
 * Get topological sort of collections (dependencies first)
 * Used to seed collections in correct order
 */
export function getCollectionSeedOrder(): string[] {
  const graph = buildDependencyGraph();
  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(name: string) {
    if (visited.has(name)) return;
    if (visiting.has(name)) {
      throw new Error(`Circular dependency detected involving collection: ${name}`);
    }

    visiting.add(name);

    const deps = graph.get(name) || new Set();
    for (const dep of deps) {
      visit(dep);
    }

    visiting.delete(name);
    visited.add(name);
    sorted.push(name);
  }

  for (const name of graph.keys()) {
    visit(name);
  }

  return sorted;
}

/**
 * Get all collections that depend on a given collection
 * Used for eager loading
 */
export function getDependentCollections(collectionName: string): Set<string> {
  const registry = getCollectionRegistry();
  const dependents = new Set<string>();

  for (const [name, metadata] of registry.entries()) {
    const relations = metadata.config.relations;
    if (!relations) continue;

    for (const relationConfig of Object.values(relations)) {
      if (relationConfig.collection === collectionName) {
        dependents.add(name);
      }
    }
  }

  return dependents;
}

/**
 * Get all collections that a given collection depends on
 * Used for eager loading
 */
export function getCollectionDependencies(collectionName: string): Set<string> {
  const registry = getCollectionRegistry();
  const metadata = registry.get(collectionName);
  if (!metadata || !metadata.config.relations) {
    return new Set();
  }

  const deps = new Set<string>();
  for (const relationConfig of Object.values(metadata.config.relations)) {
    if (relationConfig.type === 'belongsTo') {
      deps.add(relationConfig.collection);
    }
  }

  return deps;
}

/**
 * Recursively get all related collections (used for eager loading)
 */
export function getAllRelatedCollections(collectionName: string, visited = new Set<string>()): Set<string> {
  if (visited.has(collectionName)) {
    return visited;
  }

  visited.add(collectionName);

  // Get direct dependencies
  const deps = getCollectionDependencies(collectionName);
  for (const dep of deps) {
    getAllRelatedCollections(dep, visited);
  }

  // Get dependent collections
  const dependents = getDependentCollections(collectionName);
  for (const dependent of dependents) {
    getAllRelatedCollections(dependent, visited);
  }

  return visited;
}
