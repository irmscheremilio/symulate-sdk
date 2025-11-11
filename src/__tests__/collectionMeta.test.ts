import { describe, it, expect } from 'vitest';
import {
  buildResponseFromSchema,
  calculateAggregate,
  isCollectionsMetaField,
  parseMetaField,
  getBasicMetaValue,
} from '../collectionMeta';
import { m } from '../schema';

describe('collectionMeta', () => {
  describe('isCollectionsMetaField', () => {
    it('should identify collectionsMeta fields', () => {
      expect(isCollectionsMetaField('collectionsMeta.page')).toBe(true);
      expect(isCollectionsMetaField('collectionsMeta.avg:price')).toBe(true);
      expect(isCollectionsMetaField('collectionsMeta.count:inStock:true')).toBe(true);
      expect(isCollectionsMetaField('notAMetaField')).toBe(false);
      expect(isCollectionsMetaField('collections.page')).toBe(false);
    });
  });

  describe('parseMetaField', () => {
    it('should parse basic meta fields', () => {
      expect(parseMetaField('collectionsMeta.page')).toEqual({ type: 'page' });
      expect(parseMetaField('collectionsMeta.limit')).toEqual({ type: 'limit' });
      expect(parseMetaField('collectionsMeta.total')).toEqual({ type: 'total' });
      expect(parseMetaField('collectionsMeta.totalPages')).toEqual({ type: 'totalPages' });
    });

    it('should parse aggregate fields', () => {
      expect(parseMetaField('collectionsMeta.avg:price')).toEqual({
        type: 'avg',
        fieldName: 'price',
      });
      expect(parseMetaField('collectionsMeta.sum:views')).toEqual({
        type: 'sum',
        fieldName: 'views',
      });
      expect(parseMetaField('collectionsMeta.min:rating')).toEqual({
        type: 'min',
        fieldName: 'rating',
      });
      expect(parseMetaField('collectionsMeta.max:rating')).toEqual({
        type: 'max',
        fieldName: 'rating',
      });
    });

    it('should parse count fields', () => {
      expect(parseMetaField('collectionsMeta.count:inStock:true')).toEqual({
        type: 'count',
        fieldName: 'inStock',
        value: true,
      });
      expect(parseMetaField('collectionsMeta.count:status:"active"')).toEqual({
        type: 'count',
        fieldName: 'status',
        value: 'active',
      });
    });
  });

  describe('getBasicMetaValue', () => {
    const metaValues = { page: 2, limit: 10, total: 50, totalPages: 5 };

    it('should return correct basic meta values', () => {
      expect(getBasicMetaValue('page', metaValues)).toBe(2);
      expect(getBasicMetaValue('limit', metaValues)).toBe(10);
      expect(getBasicMetaValue('total', metaValues)).toBe(50);
      expect(getBasicMetaValue('totalPages', metaValues)).toBe(5);
    });

    it('should return undefined for unknown fields', () => {
      expect(getBasicMetaValue('unknown', metaValues)).toBeUndefined();
    });
  });

  describe('calculateAggregate', () => {
    const items = [
      { id: '1', price: 100, views: 50, inStock: true, rating: 4.5 },
      { id: '2', price: 200, views: 150, inStock: false, rating: 3.0 },
      { id: '3', price: 150, views: 100, inStock: true, rating: 5.0 },
    ];

    describe('avg', () => {
      it('should calculate average', () => {
        expect(calculateAggregate(items, 'avg', 'price')).toBe(150);
        expect(calculateAggregate(items, 'avg', 'rating')).toBe(4.166666666666667);
      });

      it('should return null for empty array', () => {
        expect(calculateAggregate([], 'avg', 'price')).toBeNull();
      });
    });

    describe('sum', () => {
      it('should calculate sum', () => {
        expect(calculateAggregate(items, 'sum', 'price')).toBe(450);
        expect(calculateAggregate(items, 'sum', 'views')).toBe(300);
      });
    });

    describe('min', () => {
      it('should calculate minimum', () => {
        expect(calculateAggregate(items, 'min', 'price')).toBe(100);
        expect(calculateAggregate(items, 'min', 'rating')).toBe(3.0);
      });
    });

    describe('max', () => {
      it('should calculate maximum', () => {
        expect(calculateAggregate(items, 'max', 'price')).toBe(200);
        expect(calculateAggregate(items, 'max', 'rating')).toBe(5.0);
      });
    });

    describe('count', () => {
      it('should count items matching value', () => {
        expect(calculateAggregate(items, 'count', 'inStock', true)).toBe(2);
        expect(calculateAggregate(items, 'count', 'inStock', false)).toBe(1);
      });

      it('should return total count when no filter value provided', () => {
        expect(calculateAggregate(items, 'count', 'id', undefined)).toBe(3);
      });
    });
  });

  describe('buildResponseFromSchema', () => {
    const dataArray = [
      { id: '1', name: 'Item 1', price: 100, inStock: true },
      { id: '2', name: 'Item 2', price: 200, inStock: false },
      { id: '3', name: 'Item 3', price: 150, inStock: true },
    ];

    const allItems = [
      ...dataArray,
      { id: '4', name: 'Item 4', price: 300, inStock: true },
      { id: '5', name: 'Item 5', price: 250, inStock: false },
    ];

    const metaValues = { page: 1, limit: 3, total: 5, totalPages: 2 };

    describe('with literal array syntax', () => {
      it('should place data array at array location', () => {
        const ItemSchema = m.object({
          id: m.string(),
          name: m.string(),
          price: m.number(),
        });

        const schema = {
          items: [ItemSchema],
          page: 'collectionsMeta.page',
        };

        const result = buildResponseFromSchema(schema, dataArray, allItems, metaValues);

        expect(result.items).toEqual(dataArray);
        expect(result.page).toBe(1);
      });
    });

    describe('with m.array() syntax', () => {
      it('should place data array at m.array() location', () => {
        const ItemSchema = m.object({
          id: m.string(),
          name: m.string(),
        });

        const schema = {
          data: m.array(ItemSchema),
          total: 'collectionsMeta.total',
        };

        const result = buildResponseFromSchema(schema, dataArray, allItems, metaValues);

        expect(result.data).toEqual(dataArray);
        expect(result.total).toBe(5);
      });
    });

    describe('with m.object() syntax', () => {
      it('should unwrap _shape from m.object()', () => {
        const schema = m.object({
          items: m.array(m.object({ id: m.string() })),
          page: m.collectionsMeta.page(),
          limit: m.collectionsMeta.limit(),
        });

        const result = buildResponseFromSchema(schema, dataArray, allItems, metaValues);

        expect(result.items).toEqual(dataArray);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(3);
      });
    });

    describe('with m.collectionsMeta.*() methods', () => {
      it('should handle basic meta fields from schema objects', () => {
        const schema = {
          currentPage: m.collectionsMeta.page(),
          pageSize: m.collectionsMeta.limit(),
          totalItems: m.collectionsMeta.total(),
          totalPages: m.collectionsMeta.totalPages(),
        };

        const result = buildResponseFromSchema(schema, dataArray, allItems, metaValues);

        expect(result.currentPage).toBe(1);
        expect(result.pageSize).toBe(3);
        expect(result.totalItems).toBe(5);
        expect(result.totalPages).toBe(2);
      });

      it('should handle aggregate fields from schema objects', () => {
        const schema = {
          avgPrice: m.collectionsMeta.avg('price'),
          totalPrice: m.collectionsMeta.sum('price'),
          minPrice: m.collectionsMeta.min('price'),
          maxPrice: m.collectionsMeta.max('price'),
          inStockCount: m.collectionsMeta.count('inStock', true),
        };

        const result = buildResponseFromSchema(schema, dataArray, allItems, metaValues);

        expect(result.avgPrice).toBe(200); // (100+200+150+300+250)/5
        expect(result.totalPrice).toBe(1000);
        expect(result.minPrice).toBe(100);
        expect(result.maxPrice).toBe(300);
        expect(result.inStockCount).toBe(3);
      });
    });

    describe('with nested structures', () => {
      it('should handle nested objects with meta fields', () => {
        const ItemSchema = m.object({
          id: m.string(),
          name: m.string(),
        });

        const schema = m.object({
          result: m.object({
            data: m.array(ItemSchema),
            pagination: m.object({
              current: m.collectionsMeta.page(),
              perPage: m.collectionsMeta.limit(),
            }),
          }),
          analytics: m.object({
            pricing: m.object({
              average: m.collectionsMeta.avg('price'),
              range: m.object({
                min: m.collectionsMeta.min('price'),
                max: m.collectionsMeta.max('price'),
              }),
            }),
          }),
        });

        const result = buildResponseFromSchema(schema, dataArray, allItems, metaValues);

        expect(result.result.data).toEqual(dataArray);
        expect(result.result.pagination.current).toBe(1);
        expect(result.result.pagination.perPage).toBe(3);
        expect(result.analytics.pricing.average).toBe(200);
        expect(result.analytics.pricing.range.min).toBe(100);
        expect(result.analytics.pricing.range.max).toBe(300);
      });
    });

    describe('top-level array schema', () => {
      it('should return data array when schema is array', () => {
        const ItemSchema = m.object({ id: m.string() });
        const schema = m.array(ItemSchema);

        const result = buildResponseFromSchema(schema, dataArray, allItems, metaValues);

        expect(result).toEqual(dataArray);
      });

      it('should return data array when schema is literal array', () => {
        const ItemSchema = m.object({ id: m.string() });
        const schema = [ItemSchema];

        const result = buildResponseFromSchema(schema, dataArray, allItems, metaValues);

        expect(result).toEqual(dataArray);
      });
    });

    describe('mixed syntax', () => {
      it('should handle mix of string literals and schema objects', () => {
        const schema = {
          data: m.array(m.object({ id: m.string() })),
          page: 'collectionsMeta.page', // string literal
          limit: m.collectionsMeta.limit(), // schema object
          avgPrice: 'collectionsMeta.avg:price', // string literal
          maxPrice: m.collectionsMeta.max('price'), // schema object
        };

        const result = buildResponseFromSchema(schema, dataArray, allItems, metaValues);

        expect(result.data).toEqual(dataArray);
        expect(result.page).toBe(1);
        expect(result.limit).toBe(3);
        expect(result.avgPrice).toBe(200);
        expect(result.maxPrice).toBe(300);
      });
    });

    describe('edge cases', () => {
      it('should skip internal schema properties (_type, _meta, _shape)', () => {
        const schema = {
          _type: 'should-be-skipped',
          _meta: 'should-be-skipped',
          _shape: 'should-be-skipped',
          data: m.array(m.object({ id: m.string() })),
        };

        const result = buildResponseFromSchema(schema, dataArray, allItems, metaValues);

        expect(result._type).toBeUndefined();
        expect(result._meta).toBeUndefined();
        expect(result._shape).toBeUndefined();
        expect(result.data).toEqual(dataArray);
      });

      it('should handle empty data array', () => {
        const schema = {
          items: m.array(m.object({ id: m.string() })),
          count: m.collectionsMeta.total(),
        };

        const result = buildResponseFromSchema(schema, [], [], { page: 1, limit: 10, total: 0, totalPages: 0 });

        expect(result.items).toEqual([]);
        expect(result.count).toBe(0);
      });
    });
  });
});
