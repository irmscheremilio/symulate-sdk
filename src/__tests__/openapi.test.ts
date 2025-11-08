import { describe, it, expect } from 'vitest';
import { generateOpenAPISpec } from '../cli/openapi';
import { m } from '../schema';

describe('OpenAPI Generation', () => {
  describe('Collection Query Parameters', () => {
    const ProductSchema = m.object({
      id: m.uuid(),
      name: m.string(),
      price: m.number(),
    });

    it('should use default parameter names when no queryParams config', () => {
      const spec = generateOpenAPISpec(new Map(), {
        collections: [{
          name: 'products',
          basePath: '/api/products',
          operations: ['list'],
          schema: ProductSchema,
        }],
      });

      const listOp = spec.paths['/api/products']?.get;
      expect(listOp).toBeDefined();
      expect(listOp.parameters).toBeDefined();

      const paramNames = listOp.parameters.map((p: any) => p.name);
      expect(paramNames).toContain('page');
      expect(paramNames).toContain('limit');
      expect(paramNames).toContain('sortBy');
      expect(paramNames).toContain('sortOrder');

      // All should be in query
      listOp.parameters.forEach((p: any) => {
        expect(p.in).toBe('query');
      });
    });

    it('should use custom parameter names from role-based params', () => {
      const spec = generateOpenAPISpec(new Map(), {
        collections: [{
          name: 'products',
          basePath: '/api/products',
          operations: ['list'],
          schema: ProductSchema,
          config: {
            operations: {
              list: {
                params: [
                  { name: 'pageNumber', location: 'query', role: 'pagination.page', schema: m.number() },
                  { name: 'pageSize', location: 'query', role: 'pagination.limit', schema: m.number() },
                  { name: 'orderBy', location: 'query', role: 'sort.field', schema: m.string() },
                  { name: 'direction', location: 'query', role: 'sort.order', schema: m.string() },
                ]
              },
            },
          },
        }],
      });

      const listOp = spec.paths['/api/products']?.get;
      expect(listOp).toBeDefined();
      expect(listOp.parameters).toBeDefined();

      const paramNames = listOp.parameters.map((p: any) => p.name);
      expect(paramNames).toContain('pageNumber');
      expect(paramNames).toContain('pageSize');
      expect(paramNames).toContain('orderBy');
      expect(paramNames).toContain('direction');

      // Should not contain default names
      expect(paramNames).not.toContain('page');
      expect(paramNames).not.toContain('limit');
      expect(paramNames).not.toContain('sortBy');
      expect(paramNames).not.toContain('sortOrder');
    });

    it('should respect parameter location: header', () => {
      const spec = generateOpenAPISpec(new Map(), {
        collections: [{
          name: 'products',
          basePath: '/api/products',
          operations: ['list'],
          schema: ProductSchema,
          config: {
            operations: {
              list: {
                params: [
                  { name: 'X-Sort-By', location: 'header', role: 'sort.field', schema: m.string() },
                ]
              },
            },
          },
        }],
      });

      const listOp = spec.paths['/api/products']?.get;
      expect(listOp).toBeDefined();
      expect(listOp.parameters).toBeDefined();

      const sortByParam = listOp.parameters.find((p: any) => p.name === 'X-Sort-By');
      expect(sortByParam).toBeDefined();
      expect(sortByParam.in).toBe('header');
    });

    it('should create request body when location is body', () => {
      const spec = generateOpenAPISpec(new Map(), {
        collections: [{
          name: 'products',
          basePath: '/api/products',
          operations: ['list'],
          schema: ProductSchema,
          config: {
            operations: {
              list: {
                params: [
                  { name: 'filter', location: 'body', role: 'filter', schema: m.object({
                    name: m.string(),
                    category: m.string(),
                  }) },
                ]
              },
            },
          },
        }],
      });

      const listOp = spec.paths['/api/products']?.get;
      expect(listOp).toBeDefined();

      // Should have request body
      expect(listOp.requestBody).toBeDefined();
      expect(listOp.requestBody.content['application/json']).toBeDefined();

      const bodySchema = listOp.requestBody.content['application/json'].schema;
      expect(bodySchema.properties).toBeDefined();
      expect(bodySchema.properties.filter).toBeDefined();
    });

    it('should mix different parameter locations', () => {
      const spec = generateOpenAPISpec(new Map(), {
        collections: [{
          name: 'products',
          basePath: '/api/products',
          operations: ['list'],
          schema: ProductSchema,
          config: {
            operations: {
              list: {
                params: [
                  { name: 'page', location: 'query', role: 'pagination.page', schema: m.number() },
                  { name: 'limit', location: 'query', role: 'pagination.limit', schema: m.number() },
                  { name: 'filter', location: 'body', role: 'filter', schema: m.object({
                    name: m.string(),
                    category: m.string(),
                  }) },
                  { name: 'X-Sort-By', location: 'header', role: 'sort.field', schema: m.string() },
                ]
              },
            },
          },
        }],
      });

      const listOp = spec.paths['/api/products']?.get;
      expect(listOp).toBeDefined();

      // Should have parameters array
      expect(listOp.parameters).toBeDefined();

      // Check query parameters
      const queryParams = listOp.parameters.filter((p: any) => p.in === 'query');
      const queryNames = queryParams.map((p: any) => p.name);
      expect(queryNames).toContain('page');
      expect(queryNames).toContain('limit');

      // Check header parameters
      const headerParams = listOp.parameters.filter((p: any) => p.in === 'header');
      const headerNames = headerParams.map((p: any) => p.name);
      expect(headerNames).toContain('X-Sort-By');

      // Check body parameters
      expect(listOp.requestBody).toBeDefined();
      const bodySchema = listOp.requestBody.content['application/json'].schema;
      expect(bodySchema.properties.filter).toBeDefined();
    });

    it('should include all CRUD operations for collection', () => {
      const spec = generateOpenAPISpec(new Map(), {
        collections: [{
          name: 'products',
          basePath: '/api/products',
          operations: ['list', 'get', 'create', 'update', 'delete'],
          schema: ProductSchema,
        }],
      });

      // List operation
      expect(spec.paths['/api/products']?.get).toBeDefined();

      // Get operation
      expect(spec.paths['/api/products/{id}']?.get).toBeDefined();

      // Create operation
      expect(spec.paths['/api/products']?.post).toBeDefined();

      // Update operation
      expect(spec.paths['/api/products/{id}']?.patch).toBeDefined();

      // Delete operation
      expect(spec.paths['/api/products/{id}']?.delete).toBeDefined();
    });
  });
});
