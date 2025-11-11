import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { configureSymulate } from '../config';
import { defineCollection } from '../defineCollection';
import { m } from '../schema';
import { clearCollections } from '../collectionRegistry';
import { DataStore } from '../dataStore';

describe('FK Integrity', () => {
  beforeEach(() => {
    // Clear any existing collections
    clearCollections();

    // Configure for testing with Faker mode
    configureSymulate({
      environment: 'development',
      generateMode: 'faker',
      collections: {
        persistence: {
          mode: 'memory',
        },
      },
    });
  });

  afterEach(() => {
    clearCollections();
    vi.restoreAllMocks();
  });

  describe('Basic FK Integrity', () => {
    it('should generate orders with userId referencing actual users', async () => {
      // Define User schema
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.person.fullName(),
        email: m.email(),
      });

      // Define Order schema with FK to User
      const OrderSchema = m.object({
        id: m.uuid(),
        userId: m.uuid(), // FK to User
        orderNumber: m.string(),
        total: m.number(),
      });

      // Create collections with relations
      const users = defineCollection({
        name: 'users',
        basePath: '/api/users',
        schema: UserSchema,
        seedCount: 10,
      });

      const orders = defineCollection({
        name: 'orders',
        basePath: '/api/orders',
        schema: OrderSchema,
        relations: {
          user: {
            type: 'belongsTo',
            collection: 'users',
            foreignKey: 'userId',
            references: 'id',
          },
        },
        seedCount: 25,
      });

      // Load data (use higher limit to get all items)
      const usersResult = await users.list({ limit: 100 });
      const ordersResult = await orders.list({ limit: 100 });

      expect(usersResult.data).toHaveLength(10);
      expect(ordersResult.data).toHaveLength(25);

      // Extract user IDs
      const userIds = usersResult.data.map((u: any) => u.id);

      // Verify every order has a userId that references an actual user
      ordersResult.data.forEach((order: any) => {
        expect(userIds).toContain(order.userId);
      });
    });

    it('should seed collections in dependency order', async () => {
      const initializationOrder: string[] = [];

      // Spy on DataStore initialization
      const originalInitializeWithFK = DataStore.prototype.initializeWithFKIntegrity;
      vi.spyOn(DataStore.prototype, 'initializeWithFKIntegrity').mockImplementation(async function (this: any, fkValuePools: Map<string, string[]>) {
        initializationOrder.push(this.collectionName);
        return originalInitializeWithFK.call(this, fkValuePools);
      });

      // Define schemas
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.person.fullName(),
      });

      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.commerce.productName(),
      });

      const OrderSchema = m.object({
        id: m.uuid(),
        userId: m.uuid(),
        total: m.number(),
      });

      const OrderItemSchema = m.object({
        id: m.uuid(),
        orderId: m.uuid(),
        productId: m.uuid(),
        quantity: m.number(),
      });

      // Create collections
      defineCollection({
        name: 'users',
        basePath: '/api/users',
        schema: UserSchema,
        seedCount: 5,
      });

      defineCollection({
        name: 'products',
        basePath: '/api/products',
        schema: ProductSchema,
        seedCount: 10,
      });

      defineCollection({
        name: 'orders',
        basePath: '/api/orders',
        schema: OrderSchema,
        relations: {
          user: {
            type: 'belongsTo',
            collection: 'users',
            foreignKey: 'userId',
            references: 'id',
          },
        },
        seedCount: 15,
      });

      defineCollection({
        name: 'orderItems',
        basePath: '/api/order-items',
        schema: OrderItemSchema,
        relations: {
          order: {
            type: 'belongsTo',
            collection: 'orders',
            foreignKey: 'orderId',
            references: 'id',
          },
          product: {
            type: 'belongsTo',
            collection: 'products',
            foreignKey: 'productId',
            references: 'id',
          },
        },
        seedCount: 30,
      });

      // Trigger initialization by accessing any collection
      const orders = await (globalThis as any)[Symbol.for('@@symulate/registeredCollections')].get('orders').instance.list();

      // Verify order: users and products have no dependencies, so they should come first
      // orders depends on users
      // orderItems depends on orders and products
      expect(initializationOrder).toContain('users');
      expect(initializationOrder).toContain('products');
      expect(initializationOrder).toContain('orders');
      expect(initializationOrder).toContain('orderItems');

      const usersIndex = initializationOrder.indexOf('users');
      const ordersIndex = initializationOrder.indexOf('orders');
      const orderItemsIndex = initializationOrder.indexOf('orderItems');

      // Users should be initialized before orders
      expect(usersIndex).toBeLessThan(ordersIndex);

      // Orders should be initialized before orderItems
      expect(ordersIndex).toBeLessThan(orderItemsIndex);
    });
  });

  describe('Multi-level FK Integrity', () => {
    it('should handle multiple FK fields in the same collection', async () => {
      // User schema
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.person.fullName(),
      });

      // Product schema
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.commerce.productName(),
      });

      // Order schema
      const OrderSchema = m.object({
        id: m.uuid(),
        userId: m.uuid(),
        orderNumber: m.string(),
      });

      // OrderItem with TWO FKs
      const OrderItemSchema = m.object({
        id: m.uuid(),
        orderId: m.uuid(), // FK to Order
        productId: m.uuid(), // FK to Product
        quantity: m.number(),
      });

      // Create collections
      const users = defineCollection({
        name: 'users',
        basePath: '/api/users',
        schema: UserSchema,
        seedCount: 5,
      });

      const products = defineCollection({
        name: 'products',
        basePath: '/api/products',
        schema: ProductSchema,
        seedCount: 10,
      });

      const orders = defineCollection({
        name: 'orders',
        basePath: '/api/orders',
        schema: OrderSchema,
        relations: {
          user: {
            type: 'belongsTo',
            collection: 'users',
            foreignKey: 'userId',
            references: 'id',
          },
        },
        seedCount: 15,
      });

      const orderItems = defineCollection({
        name: 'orderItems',
        basePath: '/api/order-items',
        schema: OrderItemSchema,
        relations: {
          order: {
            type: 'belongsTo',
            collection: 'orders',
            foreignKey: 'orderId',
            references: 'id',
          },
          product: {
            type: 'belongsTo',
            collection: 'products',
            foreignKey: 'productId',
            references: 'id',
          },
        },
        seedCount: 30,
      });

      // Load data
      const ordersResult = await orders.list({ limit: 100 });
      const productsResult = await products.list({ limit: 100 });
      const orderItemsResult = await orderItems.list({ limit: 100 });

      // Extract IDs
      const orderIds = ordersResult.data.map((o: any) => o.id);
      const productIds = productsResult.data.map((p: any) => p.id);

      // Verify every orderItem has valid FKs
      orderItemsResult.data.forEach((item: any) => {
        expect(orderIds).toContain(item.orderId);
        expect(productIds).toContain(item.productId);
      });
    });

    it('should handle deep FK chains (orderItems -> orders -> users)', async () => {
      // User schema
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.person.fullName(),
      });

      // Product schema
      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.commerce.productName(),
      });

      // Order schema with FK to User
      const OrderSchema = m.object({
        id: m.uuid(),
        userId: m.uuid(),
        total: m.number(),
      });

      // OrderItem with FK to Order (which has FK to User)
      const OrderItemSchema = m.object({
        id: m.uuid(),
        orderId: m.uuid(),
        productId: m.uuid(),
        quantity: m.number(),
      });

      // Create collections
      const users = defineCollection({
        name: 'users',
        basePath: '/api/users',
        schema: UserSchema,
        seedCount: 3,
      });

      const products = defineCollection({
        name: 'products',
        basePath: '/api/products',
        schema: ProductSchema,
        seedCount: 5,
      });

      const orders = defineCollection({
        name: 'orders',
        basePath: '/api/orders',
        schema: OrderSchema,
        relations: {
          user: {
            type: 'belongsTo',
            collection: 'users',
            foreignKey: 'userId',
            references: 'id',
          },
        },
        seedCount: 10,
      });

      const orderItems = defineCollection({
        name: 'orderItems',
        basePath: '/api/order-items',
        schema: OrderItemSchema,
        relations: {
          order: {
            type: 'belongsTo',
            collection: 'orders',
            foreignKey: 'orderId',
            references: 'id',
          },
          product: {
            type: 'belongsTo',
            collection: 'products',
            foreignKey: 'productId',
            references: 'id',
          },
        },
        seedCount: 20,
      });

      // Load all data
      const usersResult = await users.list({ limit: 100 });
      const ordersResult = await orders.list({ limit: 100 });
      const orderItemsResult = await orderItems.list({ limit: 100 });

      // Verify FK integrity at each level
      const userIds = usersResult.data.map((u: any) => u.id);
      const orderIds = ordersResult.data.map((o: any) => o.id);

      // Level 1: Orders reference actual users
      ordersResult.data.forEach((order: any) => {
        expect(userIds).toContain(order.userId);
      });

      // Level 2: OrderItems reference actual orders
      orderItemsResult.data.forEach((item: any) => {
        expect(orderIds).toContain(item.orderId);
      });

      // Deep check: Through orderItems -> orders, we can trace back to users
      orderItemsResult.data.forEach((item: any) => {
        const relatedOrder = ordersResult.data.find((o: any) => o.id === item.orderId);
        expect(relatedOrder).toBeDefined();
        expect(userIds).toContain(relatedOrder.userId);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle collections with no relations (independent collections)', async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.person.fullName(),
      });

      const ProductSchema = m.object({
        id: m.uuid(),
        name: m.commerce.productName(),
      });

      // Two collections with no relations between them
      const users = defineCollection({
        name: 'users',
        basePath: '/api/users',
        schema: UserSchema,
        seedCount: 10,
      });

      const products = defineCollection({
        name: 'products',
        basePath: '/api/products',
        schema: ProductSchema,
        seedCount: 15,
      });

      const usersResult = await users.list({ limit: 100 });
      const productsResult = await products.list({ limit: 100 });

      expect(usersResult.data).toHaveLength(10);
      expect(productsResult.data).toHaveLength(15);
    });

    it('should handle empty related collections gracefully', async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.person.fullName(),
      });

      const OrderSchema = m.object({
        id: m.uuid(),
        userId: m.uuid(),
        total: m.number(),
      });

      // Create user collection with 0 seed count
      defineCollection({
        name: 'users',
        basePath: '/api/users',
        schema: UserSchema,
        seedCount: 0,
      });

      // Create order collection that depends on users
      const orders = defineCollection({
        name: 'orders',
        basePath: '/api/orders',
        schema: OrderSchema,
        relations: {
          user: {
            type: 'belongsTo',
            collection: 'users',
            foreignKey: 'userId',
            references: 'id',
          },
        },
        seedCount: 5,
      });

      const ordersResult = await orders.list();

      // Orders should still be generated, but userId will be random UUIDs
      // since there are no users to reference
      expect(ordersResult.data).toHaveLength(5);
    });

    it('should handle collections accessed out of dependency order', async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.person.fullName(),
      });

      const OrderSchema = m.object({
        id: m.uuid(),
        userId: m.uuid(),
        total: m.number(),
      });

      defineCollection({
        name: 'users',
        basePath: '/api/users',
        schema: UserSchema,
        seedCount: 5,
      });

      const orders = defineCollection({
        name: 'orders',
        basePath: '/api/orders',
        schema: OrderSchema,
        relations: {
          user: {
            type: 'belongsTo',
            collection: 'users',
            foreignKey: 'userId',
            references: 'id',
          },
        },
        seedCount: 10,
      });

      // Access orders FIRST (even though it depends on users)
      // The FK integrity system should handle this automatically
      const ordersResult = await orders.list();

      expect(ordersResult.data).toHaveLength(10);

      // Now verify FK integrity
      const users = (globalThis as any)[Symbol.for('@@symulate/registeredCollections')].get('users').instance;
      const usersResult = await users.list({ limit: 100 });
      const userIds = usersResult.data.map((u: any) => u.id);

      ordersResult.data.forEach((order: any) => {
        expect(userIds).toContain(order.userId);
      });
    });
  });

  describe('FK Distribution', () => {
    it('should distribute FK values across all available IDs', async () => {
      const UserSchema = m.object({
        id: m.uuid(),
        name: m.person.fullName(),
      });

      const OrderSchema = m.object({
        id: m.uuid(),
        userId: m.uuid(),
        total: m.number(),
      });

      const users = defineCollection({
        name: 'users',
        basePath: '/api/users',
        schema: UserSchema,
        seedCount: 3,
      });

      const orders = defineCollection({
        name: 'orders',
        basePath: '/api/orders',
        schema: OrderSchema,
        relations: {
          user: {
            type: 'belongsTo',
            collection: 'users',
            foreignKey: 'userId',
            references: 'id',
          },
        },
        seedCount: 30, // 10x more orders than users
      });

      const usersResult = await users.list({ limit: 100 });
      const ordersResult = await orders.list({ limit: 100 });

      const userIds = usersResult.data.map((u: any) => u.id);

      // Count how many orders each user has
      const orderCountByUser = new Map<string, number>();
      ordersResult.data.forEach((order: any) => {
        const count = orderCountByUser.get(order.userId) || 0;
        orderCountByUser.set(order.userId, count + 1);
      });

      // All users should have at least one order (with 30 orders and 3 users)
      userIds.forEach(userId => {
        expect(orderCountByUser.has(userId)).toBe(true);
        expect(orderCountByUser.get(userId)).toBeGreaterThan(0);
      });
    });
  });
});
