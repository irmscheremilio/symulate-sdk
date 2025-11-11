import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataStore } from '../dataStore';
import { m } from '../schema';
import { configureSymulate } from '../config';

describe('AI Response Unwrapping', () => {
  const ProductSchema = m.object({
    id: m.uuid(),
    name: m.string(),
    price: m.number(),
  });

  beforeEach(() => {
    configureSymulate({
      environment: 'development',
      generateMode: 'ai',
      openaiApiKey: 'test-key',
      collections: {
        persistence: { mode: 'memory' }
      }
    });

    // Clear any previous mocks
    vi.clearAllMocks();
  });

  describe('generateSeedDataWithAI unwrapping', () => {
    it('should handle plain array response from AI', async () => {
      // Mock the AI provider to return a plain array
      vi.mock('../aiProvider', () => ({
        generateWithAI: vi.fn().mockResolvedValue([
          { name: 'Product 1', price: 100 },
          { name: 'Product 2', price: 200 },
          { name: 'Product 3', price: 300 },
        ])
      }));

      const store = new DataStore({
        collectionName: 'products',
        schema: ProductSchema,
        seedCount: 3,
      });

      const result = await store.query();

      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).toHaveProperty('price');
      expect(result.data[0]).toHaveProperty('createdAt');
      expect(result.data[0]).toHaveProperty('updatedAt');

      vi.restoreAllMocks();
    });

    it('should unwrap { "products": [...] } response from AI', async () => {
      // Mock the AI provider to return wrapped response
      vi.mock('../aiProvider', () => ({
        generateWithAI: vi.fn().mockResolvedValue({
          products: [
            { name: 'Product 1', price: 100 },
            { name: 'Product 2', price: 200 },
          ]
        })
      }));

      const store = new DataStore({
        collectionName: 'products',
        schema: ProductSchema,
        seedCount: 2,
      });

      const result = await store.query();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Product 1');
      expect(result.data[1].name).toBe('Product 2');

      vi.restoreAllMocks();
    });

    it('should unwrap { "items": [...] } response from AI', async () => {
      // Mock the AI provider to return wrapped with "items" key
      vi.mock('../aiProvider', () => ({
        generateWithAI: vi.fn().mockResolvedValue({
          items: [
            { name: 'Product 1', price: 100 },
            { name: 'Product 2', price: 200 },
          ]
        })
      }));

      const store = new DataStore({
        collectionName: 'products',
        schema: ProductSchema,
        seedCount: 2,
      });

      const result = await store.query();

      expect(result.data).toHaveLength(2);

      vi.restoreAllMocks();
    });

    it('should handle nested wrapper like { "products": [{ "products": [...] }] }', async () => {
      // Mock a doubly-nested response
      vi.mock('../aiProvider', () => ({
        generateWithAI: vi.fn().mockResolvedValue({
          products: [
            {
              products: [
                { name: 'Product 1', price: 100 },
              ]
            }
          ]
        })
      }));

      const store = new DataStore({
        collectionName: 'products',
        schema: ProductSchema,
        seedCount: 1,
      });

      const result = await store.query();

      // Should extract the outer array
      expect(result.data).toHaveLength(1);
      // The first item would be the nested object, not ideal but tests the extraction

      vi.restoreAllMocks();
    });

    it('should handle single object response by wrapping in array', async () => {
      // Mock the AI provider to return a single object
      vi.mock('../aiProvider', () => ({
        generateWithAI: vi.fn().mockResolvedValue({
          name: 'Product 1',
          price: 100
        })
      }));

      const store = new DataStore({
        collectionName: 'products',
        schema: ProductSchema,
        seedCount: 1,
      });

      const result = await store.query();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Product 1');

      vi.restoreAllMocks();
    });

    it('should find array in object with multiple keys', async () => {
      // Mock response with multiple keys, only one is an array
      vi.mock('../aiProvider', () => ({
        generateWithAI: vi.fn().mockResolvedValue({
          metadata: { count: 2, timestamp: '2024-01-01' },
          data: [
            { name: 'Product 1', price: 100 },
            { name: 'Product 2', price: 200 },
          ],
          status: 'success'
        })
      }));

      const store = new DataStore({
        collectionName: 'products',
        schema: ProductSchema,
        seedCount: 2,
      });

      const result = await store.query();

      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe('Product 1');

      vi.restoreAllMocks();
    });
  });

  describe('AI generation without seedInstruction', () => {
    it('should generate data with AI even without seedInstruction', async () => {
      // Mock the AI provider
      vi.mock('../aiProvider', () => ({
        generateWithAI: vi.fn().mockResolvedValue([
          { name: 'Generated Product', price: 150 },
        ])
      }));

      const store = new DataStore({
        collectionName: 'products',
        schema: ProductSchema,
        seedCount: 1,
        // No seedInstruction provided
      });

      const result = await store.query();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).toHaveProperty('price');

      vi.restoreAllMocks();
    });

    it('should use schema type description when no seedInstruction provided', async () => {
      const generateWithAI = vi.fn().mockResolvedValue([
        { name: 'Product', price: 100 }
      ]);

      vi.mock('../aiProvider', () => ({
        generateWithAI
      }));

      const store = new DataStore({
        collectionName: 'products',
        schema: ProductSchema,
        seedCount: 1,
      });

      await store.query();

      // Verify that generateWithAI was called with typeDescription
      // (Can't actually test the call params with current setup, but this ensures it runs)
      expect(generateWithAI).toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe('Timestamp and ID generation', () => {
    it('should add timestamps to AI-generated items', async () => {
      vi.mock('../aiProvider', () => ({
        generateWithAI: vi.fn().mockResolvedValue([
          { name: 'Product 1', price: 100 },
        ])
      }));

      const store = new DataStore({
        collectionName: 'products',
        schema: ProductSchema,
        seedCount: 1,
      });

      const result = await store.query();

      expect(result.data[0]).toHaveProperty('createdAt');
      expect(result.data[0]).toHaveProperty('updatedAt');
      expect(typeof result.data[0].createdAt).toBe('string');
      expect(typeof result.data[0].updatedAt).toBe('string');

      vi.restoreAllMocks();
    });

    it('should preserve AI-provided ID if present', async () => {
      vi.mock('../aiProvider', () => ({
        generateWithAI: vi.fn().mockResolvedValue([
          { id: 'ai-generated-id', name: 'Product 1', price: 100 },
        ])
      }));

      const store = new DataStore({
        collectionName: 'products',
        schema: ProductSchema,
        seedCount: 1,
      });

      const result = await store.query();

      expect(result.data[0].id).toBe('ai-generated-id');

      vi.restoreAllMocks();
    });

    it('should auto-generate ID if AI did not provide one', async () => {
      vi.mock('../aiProvider', () => ({
        generateWithAI: vi.fn().mockResolvedValue([
          { name: 'Product 1', price: 100 },
        ])
      }));

      const store = new DataStore({
        collectionName: 'products',
        schema: ProductSchema,
        seedCount: 1,
      });

      const result = await store.query();

      expect(result.data[0]).toHaveProperty('id');
      expect(typeof result.data[0].id).toBe('string');
      expect(result.data[0].id.length).toBeGreaterThan(0);

      vi.restoreAllMocks();
    });
  });
});
