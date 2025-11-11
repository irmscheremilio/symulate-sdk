import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineCollection } from '../defineCollection';
import { m } from '../schema';
import { configureSymulate } from '../config';

describe('Collection Delay Simulation', () => {
  const ProductSchema = m.object({
    id: m.uuid(),
    name: m.string(),
    price: m.number(),
    inStock: m.boolean(),
  });

  beforeEach(() => {
    configureSymulate({
      environment: 'development',
      generateMode: 'faker',
      collections: {
        persistence: { mode: 'memory' }
      }
    });

    vi.clearAllMocks();
  });

  describe('list operation delay', () => {
    it('should apply delay to list operation when configured', async () => {
      const products = defineCollection({
        name: 'products-with-list-delay',
        schema: ProductSchema,
        seedCount: 3,
        operations: {
          list: {
            mock: {
              delay: 100 // 100ms delay
            }
          }
        }
      });

      const startTime = Date.now();
      await products.list();
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      // Should take at least 100ms
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow small margin for test timing
    });

    it('should not delay when delay is not configured', async () => {
      const products = defineCollection({
        name: 'products-no-delay',
        schema: ProductSchema,
        seedCount: 3,
        operations: {
          list: true // No delay configured
        }
      });

      const startTime = Date.now();
      await products.list();
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      // Should be very fast (less than 50ms typically)
      expect(elapsed).toBeLessThan(100);
    });

    it('should not delay when delay is 0', async () => {
      const products = defineCollection({
        name: 'products-zero-delay',
        schema: ProductSchema,
        seedCount: 3,
        operations: {
          list: {
            mock: {
              delay: 0
            }
          }
        }
      });

      const startTime = Date.now();
      await products.list();
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('get operation delay', () => {
    it('should apply delay to get operation when configured', async () => {
      const products = defineCollection({
        name: 'products-with-get-delay',
        schema: ProductSchema,
        seedCount: 3,
        operations: {
          get: {
            mock: {
              delay: 150
            }
          }
        }
      });

      // First get an item to get its ID
      const list = await products.list();
      const id = list.data[0].id;

      const startTime = Date.now();
      await products.get(id);
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(145);
    });
  });

  describe('create operation delay', () => {
    it('should apply delay to create operation when configured', async () => {
      const products = defineCollection({
        name: 'products-with-create-delay',
        schema: ProductSchema,
        seedCount: 3,
        operations: {
          create: {
            mock: {
              delay: 200
            }
          }
        }
      });

      const startTime = Date.now();
      await products.create({
        name: 'New Product',
        price: 100,
        inStock: true,
      });
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(195);
    });
  });

  describe('update operation delay', () => {
    it('should apply delay to update operation when configured', async () => {
      const products = defineCollection({
        name: 'products-with-update-delay',
        schema: ProductSchema,
        seedCount: 3,
        operations: {
          update: {
            mock: {
              delay: 250
            }
          }
        }
      });

      // Get an item to update
      const list = await products.list();
      const id = list.data[0].id;

      const startTime = Date.now();
      await products.update(id, { price: 999 });
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(245);
    });
  });

  describe('replace operation delay', () => {
    it('should apply delay to replace operation when configured', async () => {
      const products = defineCollection({
        name: 'products-with-replace-delay',
        schema: ProductSchema,
        seedCount: 3,
        operations: {
          replace: {
            mock: {
              delay: 300
            }
          }
        }
      });

      // Get an item to replace
      const list = await products.list();
      const id = list.data[0].id;

      const startTime = Date.now();
      await products.replace(id, {
        name: 'Replaced Product',
        price: 500,
        inStock: false,
      });
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(295);
    });
  });

  describe('delete operation delay', () => {
    it('should apply delay to delete operation when configured', async () => {
      const products = defineCollection({
        name: 'products-with-delete-delay',
        schema: ProductSchema,
        seedCount: 3,
        operations: {
          delete: {
            mock: {
              delay: 350
            }
          }
        }
      });

      // Get an item to delete
      const list = await products.list();
      const id = list.data[0].id;

      const startTime = Date.now();
      await products.delete(id);
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(345);
    });
  });

  describe('multiple operations with different delays', () => {
    it('should apply different delays to different operations', async () => {
      const products = defineCollection({
        name: 'products-multi-delay',
        schema: ProductSchema,
        seedCount: 3,
        operations: {
          list: {
            mock: { delay: 100 }
          },
          get: {
            mock: { delay: 200 }
          },
          create: {
            mock: { delay: 300 }
          }
        }
      });

      // Test list delay
      let start = Date.now();
      const list = await products.list();
      let elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(95);
      expect(elapsed).toBeLessThan(200);

      // Test get delay
      start = Date.now();
      await products.get(list.data[0].id);
      elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(195);
      expect(elapsed).toBeLessThan(300);

      // Test create delay
      start = Date.now();
      await products.create({
        name: 'New Product',
        price: 100,
        inStock: true,
      });
      elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(295);
    });
  });

  describe('delay with custom response schema', () => {
    it('should apply delay when using custom response schema', async () => {
      const products = defineCollection({
        name: 'products-delay-custom-schema',
        schema: ProductSchema,
        seedCount: 5,
        operations: {
          list: {
            responseSchema: m.object({
              items: m.array(ProductSchema),
              meta: m.object({
                total: m.collectionsMeta.total(),
              })
            }),
            mock: {
              delay: 150
            }
          }
        }
      });

      const startTime = Date.now();
      const result = await products.list();
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(145);

      // Verify custom schema still works
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('meta');
      expect(result.meta.total).toBe(5);
    });
  });

  describe('console logging', () => {
    it('should log delay simulation message', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const products = defineCollection({
        name: 'products-log-test',
        schema: ProductSchema,
        seedCount: 2,
        operations: {
          list: {
            mock: { delay: 50 }
          }
        }
      });

      await products.list();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Symulate] ⏱ Simulating 50ms loading delay...')
      );

      consoleSpy.mockRestore();
    });

    it('should not log when no delay configured', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const products = defineCollection({
        name: 'products-no-log',
        schema: ProductSchema,
        seedCount: 2,
      });

      await products.list();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Simulating')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle negative delay as no delay', async () => {
      const products = defineCollection({
        name: 'products-negative-delay',
        schema: ProductSchema,
        seedCount: 2,
        operations: {
          list: {
            mock: { delay: -100 }
          }
        }
      });

      const startTime = Date.now();
      await products.list();
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      // Should not delay
      expect(elapsed).toBeLessThan(50);
    });

    it('should handle very large delay', async () => {
      const products = defineCollection({
        name: 'products-large-delay',
        schema: ProductSchema,
        seedCount: 2,
        operations: {
          list: {
            mock: { delay: 500 }
          }
        }
      });

      const startTime = Date.now();
      await products.list();
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(495);
    }, 10000); // Increase test timeout for this case
  });
});
