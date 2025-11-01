import { defineEndpoint, configureSymulate, m } from '@symulate/sdk'

// Configure Symulate
configureSymulate({
  symulateApiKey: 'sym_live_3695dc5046e74ba9b6f51ad434f07404',
  projectId: '',
  generateMode: 'auto',
  fakerSeed: 12345,
  environment: 'development',
  cacheEnabled: true,
})

// Product schema
const ProductSchema = m.object({
  id: m.uuid(),
  name: m.commerce.productName(),
  description: m.lorem.sentence(),
  price: m.commerce.price(),
  image: m.internet.avatar(),
  category: m.commerce.department(),
  inStock: m.boolean(),
  rating: m.number(),
})

// Category schema
const CategorySchema = m.object({
  id: m.uuid(),
  name: m.commerce.department(),
  productCount: m.number(),
})

// Cart item schema
const CartItemSchema = m.object({
  id: m.uuid(),
  productId: m.uuid(),
  name: m.commerce.productName(),
  price: m.commerce.price(),
  quantity: m.number(),
  image: m.internet.avatar(),
})

// Define endpoints
export const getProducts = defineEndpoint({
  path: '/api/products',
  method: 'GET',
  schema: ProductSchema,
  mock: {
    count: 12,
    instruction: 'Generate modern tech products like laptops, phones, headphones, smartwatches',
  },
})

export const getProduct = defineEndpoint({
  path: '/api/products/:id',
  method: 'GET',
  schema: ProductSchema,
  mock: {
    instruction: 'Generate a detailed product with realistic specs',
  },
})

export const getCategories = defineEndpoint({
  path: '/api/categories',
  method: 'GET',
  schema: CategorySchema,
  mock: {
    count: 6,
    instruction: 'Generate tech product categories',
  },
})

export const getCart = defineEndpoint({
  path: '/api/cart',
  method: 'GET',
  schema: CartItemSchema,
  mock: {
    count: 3,
    instruction: 'Generate cart items with quantities between 1-3',
  },
})
