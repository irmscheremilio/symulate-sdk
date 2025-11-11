import { defineCollection, m } from '@symulate/sdk';

// Import schemas
import { UserSchema } from './schemas/user.schema';
import { ProductSchema } from './schemas/product.schema';
import { OrderSchema } from './schemas/order.schema';
import { OrderItemSchema } from './schemas/order-item.schema';

// Import mock configurations
import { userMockConfig } from './mocks/user.mock';
import { productMockConfig } from './mocks/product.mock';
import { orderMockConfig } from './mocks/order.mock';
import { orderItemMockConfig } from './mocks/order-item.mock';

// ============================================
// LEVEL 3: ADVANCED RELATIONS & INTERCONNECTED DATA
// ============================================
// This demonstrates the most advanced features:
// - Collections with foreign key relationships
// - Response schemas with joins (m.join)
// - Nested joins for deep data inclusion
// - Realistic e-commerce scenario
// - FK integrity during seed generation

// ============================================
// USERS COLLECTION
// ============================================

export const users = defineCollection({
  name: 'users',
  basePath: '/api/users',
  schema: UserSchema,
  seedCount: userMockConfig.count,
  seedInstruction: userMockConfig.instruction,
});

// ============================================
// PRODUCTS COLLECTION
// ============================================

export const products = defineCollection({
  name: 'products',
  basePath: '/api/products',
  schema: ProductSchema,
  seedCount: productMockConfig.count,
  seedInstruction: productMockConfig.instruction,
});

// ============================================
// ORDERS COLLECTION (with User relation)
// ============================================

// Response schema includes user data via join
const OrderResponseSchema = m.object({
  id: m.uuid(),
  userId: m.uuid(),
  orderNumber: m.string(),
  status: m.string(),
  total: m.number(),
  subtotal: m.number(),
  tax: m.number(),
  shipping: m.number(),
  shippingAddress: m.object({
    street: m.string(),
    city: m.string(),
    state: m.string(),
    zipCode: m.string(),
    country: m.string(),
  }),
  createdAt: m.date(),
  updatedAt: m.date(),
  // Joined fields from User
  userName: m.join('user', 'name'),
  userEmail: m.join('user', 'email'),
});

export const orders = defineCollection({
  name: 'orders',
  basePath: '/api/orders',
  schema: OrderSchema,
  responseSchema: OrderResponseSchema,
  relations: {
    user: {
      type: 'belongsTo',
      collection: 'users',
      foreignKey: 'userId',
      references: 'id',
    },
  },
  seedCount: orderMockConfig.count,
  seedInstruction: orderMockConfig.instruction,
});

// ============================================
// ORDER ITEMS COLLECTION (with Order and Product relations)
// ============================================

// Response schema includes data from both Order and Product
const OrderItemResponseSchema = m.object({
  id: m.uuid(),
  orderId: m.uuid(),
  productId: m.uuid(),
  quantity: m.number(),
  unitPrice: m.number(),
  totalPrice: m.number(),
  // Joined fields from Product
  productName: m.join('product', 'name'),
  productCategory: m.join('product', 'category'),
  productImageUrl: m.join('product', 'imageUrl'),
  // Nested join: through Order to User
  orderStatus: m.join('order', 'status'),
  orderTotal: m.join('order', 'total'),
  // Deep nested join: order.user.name
  customerName: m.join('order.user', 'name'),
  customerEmail: m.join('order.user', 'email'),
});

export const orderItems = defineCollection({
  name: 'orderItems',
  basePath: '/api/order-items',
  schema: OrderItemSchema,
  responseSchema: OrderItemResponseSchema,
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
  seedCount: orderItemMockConfig.count,
  seedInstruction: orderItemMockConfig.instruction,
});
