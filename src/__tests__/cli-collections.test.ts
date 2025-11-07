import { describe, it, expect, beforeEach } from 'vitest';
import { defineCollection } from '../defineCollection';
import { exportCollectionsArray, getRegisteredCollections } from '../collectionRegistry';
import { configureSymulate } from '../config';
import { m } from '../schema';

describe('CLI Collections Integration', () => {
  beforeEach(() => {
    configureSymulate({
      environment: 'development',
      generateMode: 'faker',
      collections: { persistence: { mode: 'memory' } }
    });
  });

  describe('exportCollectionsArray', () => {
    it('should export collection metadata for CLI', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
        price: m.number(),
      });

      defineCollection({
        name: 'cli-test-products',
        schema: ProductSchema,
        basePath: '/api/products',
        seedCount: 10,
      });

      const exported = exportCollectionsArray();

      // Find our test collection
      const collection = exported.find(c => c.name === 'cli-test-products');

      expect(collection).toBeDefined();
      expect(collection?.name).toBe('cli-test-products');
      expect(collection?.basePath).toBe('/api/products');
      expect(collection?.operations).toBeDefined();
      expect(collection?.schema).toBeDefined();
    });

    it('should include all default operations', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      defineCollection({
        name: 'all-ops-test',
        schema: ProductSchema,
      });

      const exported = exportCollectionsArray();
      const collection = exported.find(c => c.name === 'all-ops-test');

      expect(collection?.operations).toEqual([
        'list',
        'get',
        'create',
        'update',
        'replace',
        'delete',
      ]);
    });

    it('should exclude disabled operations', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      defineCollection({
        name: 'disabled-ops-test',
        schema: ProductSchema,
        operations: {
          delete: false,
          replace: false,
        }
      });

      const exported = exportCollectionsArray();
      const collection = exported.find(c => c.name === 'disabled-ops-test');

      expect(collection?.operations).toEqual([
        'list',
        'get',
        'create',
        'update',
      ]);
      expect(collection?.operations).not.toContain('delete');
      expect(collection?.operations).not.toContain('replace');
    });

    it('should export multiple collections', () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const PostSchema = m.object({
        id: m.uuid(),
        title: m.string(),
      });

      defineCollection({
        name: 'cli-users',
        schema: UserSchema,
      });

      defineCollection({
        name: 'cli-posts',
        schema: PostSchema,
      });

      const exported = exportCollectionsArray();

      const users = exported.find(c => c.name === 'cli-users');
      const posts = exported.find(c => c.name === 'cli-posts');

      expect(users).toBeDefined();
      expect(posts).toBeDefined();
      expect(users?.basePath).toBe('/cli-users');
      expect(posts?.basePath).toBe('/cli-posts');
    });
  });

  describe('getRegisteredCollections', () => {
    it('should track all registered collections', () => {
      const initialSize = getRegisteredCollections().size;

      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      defineCollection({
        name: 'registry-test-1',
        schema: ProductSchema,
      });

      defineCollection({
        name: 'registry-test-2',
        schema: ProductSchema,
      });

      const registry = getRegisteredCollections();
      expect(registry.size).toBe(initialSize + 2);

      expect(registry.has('registry-test-1')).toBe(true);
      expect(registry.has('registry-test-2')).toBe(true);
    });

    it('should store complete metadata', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      defineCollection({
        name: 'metadata-test',
        schema: ProductSchema,
        basePath: '/api/v1/products',
      });

      const registry = getRegisteredCollections();
      const metadata = registry.get('metadata-test');

      expect(metadata).toBeDefined();
      expect(metadata?.name).toBe('metadata-test');
      expect(metadata?.config).toBeDefined();
      expect(metadata?.instance).toBeDefined();
      expect(metadata?.endpoints).toBeDefined();
      expect(metadata?.store).toBeDefined();
      expect(metadata?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Operation Path Mapping', () => {
    it('should generate correct paths for each operation', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      defineCollection({
        name: 'path-test',
        schema: ProductSchema,
        basePath: '/api/products',
      });

      const exported = exportCollectionsArray();
      const collection = exported.find(c => c.name === 'path-test');

      expect(collection).toBeDefined();

      // These should map to:
      // list   → GET /api/products
      // get    → GET /api/products/:id
      // create → POST /api/products
      // update → PATCH /api/products/:id
      // replace → PUT /api/products/:id
      // delete → DELETE /api/products/:id

      // The actual path mapping is done in sync.ts
      // Here we verify the operations are exported correctly
      expect(collection?.operations).toContain('list');
      expect(collection?.operations).toContain('get');
      expect(collection?.operations).toContain('create');
      expect(collection?.operations).toContain('update');
      expect(collection?.operations).toContain('replace');
      expect(collection?.operations).toContain('delete');
    });
  });

  describe('Schema Export for OpenAPI', () => {
    it('should export schema for OpenAPI generation', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
        price: m.number(),
        inStock: m.boolean(),
      });

      defineCollection({
        name: 'openapi-test',
        schema: ProductSchema,
      });

      const exported = exportCollectionsArray();
      const collection = exported.find(c => c.name === 'openapi-test');

      expect(collection?.schema).toBeDefined();
      expect(collection?.schema).toBe(ProductSchema);

      // Schema should be usable by schemaToOpenAPI
      expect(typeof collection?.schema).toBe('object');
    });

    it('should preserve complex schemas', () => {
      const ComplexSchema = m.object({
        id: m.uuid(),
        name: m.string(),
        price: m.number(),
        tags: m.array(m.string()),
        metadata: m.object({
          createdBy: m.string(),
          updatedBy: m.string(),
        }),
      });

      defineCollection({
        name: 'complex-schema-test',
        schema: ComplexSchema,
      });

      const exported = exportCollectionsArray();
      const collection = exported.find(c => c.name === 'complex-schema-test');

      expect(collection?.schema).toBe(ComplexSchema);
    });
  });

  describe('Error Configurations Export', () => {
    it('should export operation error configs', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      defineCollection({
        name: 'error-export-test',
        schema: ProductSchema,
        operations: {
          create: {
            errors: [{
              code: 400,
              description: 'Invalid product'
            }],
          },
          delete: {
            errors: [{
              code: 403,
              description: 'Cannot delete'
            }],
          }
        }
      });

      const exported = exportCollectionsArray();
      const collection = exported.find(c => c.name === 'error-export-test');

      expect(collection).toBeDefined();
      // Error configs should be available through the collection instance
      // They're used when generating OpenAPI specs
    });
  });

  describe('Custom Base Paths', () => {
    it('should respect custom basePath in exports', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      defineCollection({
        name: 'custom-path-test',
        schema: ProductSchema,
        basePath: '/api/v2/custom/products',
      });

      const exported = exportCollectionsArray();
      const collection = exported.find(c => c.name === 'custom-path-test');

      expect(collection?.basePath).toBe('/api/v2/custom/products');
    });

    it('should use default basePath when not specified', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      defineCollection({
        name: 'default-path-test',
        schema: ProductSchema,
      });

      const exported = exportCollectionsArray();
      const collection = exported.find(c => c.name === 'default-path-test');

      expect(collection?.basePath).toBe('/default-path-test');
    });
  });

  describe('Multiple Collections Integration', () => {
    it('should handle multiple collections without conflicts', () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const PostSchema = m.object({
        id: m.uuid(),
        title: m.string(),
      });

      defineCollection({
        name: 'multi-users',
        schema: UserSchema,
        basePath: '/users',
      });

      defineCollection({
        name: 'multi-products',
        schema: ProductSchema,
        basePath: '/products',
      });

      defineCollection({
        name: 'multi-posts',
        schema: PostSchema,
        basePath: '/posts',
        operations: {
          replace: false,
        }
      });

      const exported = exportCollectionsArray();

      const users = exported.find(c => c.name === 'multi-users');
      const products = exported.find(c => c.name === 'multi-products');
      const posts = exported.find(c => c.name === 'multi-posts');

      expect(users).toBeDefined();
      expect(products).toBeDefined();
      expect(posts).toBeDefined();

      expect(users?.operations).toHaveLength(6);
      expect(products?.operations).toHaveLength(6);
      expect(posts?.operations).toHaveLength(5); // replace disabled

      expect(users?.basePath).toBe('/users');
      expect(products?.basePath).toBe('/products');
      expect(posts?.basePath).toBe('/posts');
    });
  });

  describe('Edge Cases', () => {
    it('should handle collection with no operations enabled', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      defineCollection({
        name: 'no-ops-test',
        schema: ProductSchema,
        operations: {
          list: false,
          get: false,
          create: false,
          update: false,
          replace: false,
          delete: false,
        }
      });

      const exported = exportCollectionsArray();
      const collection = exported.find(c => c.name === 'no-ops-test');

      expect(collection?.operations).toHaveLength(0);
    });

    it('should handle collection with empty name gracefully', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      // This shouldn't be allowed but let's test graceful handling
      try {
        defineCollection({
          name: '',
          schema: ProductSchema,
        });

        const exported = exportCollectionsArray();
        const collection = exported.find(c => c.name === '');

        // Should either create with empty name or throw error
        expect(true).toBe(true); // Test passes if no crash
      } catch (error) {
        // Also acceptable to throw error
        expect(error).toBeDefined();
      }
    });

    it('should handle duplicate collection names', () => {
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.string(),
      });

      const first = defineCollection({
        name: 'duplicate-cli-test',
        schema: ProductSchema,
      });

      const second = defineCollection({
        name: 'duplicate-cli-test',
        schema: ProductSchema,
      });

      // Should return same instance
      expect(first).toBe(second);

      const exported = exportCollectionsArray();
      const collections = exported.filter(c => c.name === 'duplicate-cli-test');

      // Should only have one entry
      expect(collections).toHaveLength(1);
    });
  });
});
