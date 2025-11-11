import { defineEndpoint, m, type Infer } from '@symulate/sdk';

// ============================================
// LEVEL 1: SIMPLE ENDPOINT MOCKING
// ============================================
// This demonstrates the simplest way to use Symulate SDK.
// All mock configuration is inline, keeping it simple.

// Define User schema
export const UserSchema = m.object({
  id: m.uuid(),
  name: m.person.fullName(),
  email: m.email(),
  age: m.number(),
  // Test optional fields (25% chance of being undefined)
  bio: m.optional(m.lorem.sentence()),
  avatar: m.optional(m.internet.avatar()),
});

export type User = Infer<typeof UserSchema>;

// Define Product schema
export const ProductSchema = m.object({
  id: m.uuid(),
  name: m.commerce.productName(),
  price: m.commerce.price(),
  category: m.commerce.department(),
  inStock: m.boolean(),
});

export type Product = Infer<typeof ProductSchema>;

// ============================================
// ENDPOINTS
// ============================================

// GET /api/users - List all users
export const getUsers = defineEndpoint<User[]>({
  path: '/api/users',
  method: 'GET',
  schema: m.array(UserSchema),
  mock: {
    count: 15,
    instruction: 'Generate diverse software engineers from tech companies'
  },
});

// GET /api/users/:id - Get single user
export const getUser = defineEndpoint<User>({
  path: '/api/users/:id',
  method: 'GET',
  schema: UserSchema,
  params: [
    {
      name: 'id',
      location: 'path',
      required: true,
      schema: m.uuid(),
    },
  ],
});

// GET /api/products - List all products
export const getProducts = defineEndpoint<Product[]>({
  path: '/api/products',
  method: 'GET',
  schema: m.array(ProductSchema),
  mock: {
    count: 20,
    instruction: 'Generate realistic e-commerce products'
  },
});

// GET /api/products/:id - Get single product
export const getProduct = defineEndpoint<Product>({
  path: '/api/products/:id',
  method: 'GET',
  schema: ProductSchema,
  params: [
    {
      name: 'id',
      location: 'path',
      required: true,
      schema: m.uuid(),
    },
  ],
});
