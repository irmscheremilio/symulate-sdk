import { defineEndpoint, configureSymulate, m } from '@symulate/sdk'

// Configure Symulate
configureSymulate({
  symulateApiKey: 'demo_key_vue',
  generateMode: 'faker',
  fakerSeed: 54321,
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

// Featured deal schema
const FeaturedDealSchema = m.object({
  id: m.uuid(),
  title: m.lorem.sentence(),
  discount: m.number(),
  productId: m.uuid(),
})

// Define endpoints
export const getProducts = defineEndpoint({
  path: '/api/products',
  method: 'GET',
  schema: ProductSchema,
  mock: {
    count: 15,
    instruction: 'Generate premium lifestyle products like cameras, drones, tablets, speakers',
  },
})

export const getCategories = defineEndpoint({
  path: '/api/categories',
  method: 'GET',
  schema: CategorySchema,
  mock: {
    count: 8,
    instruction: 'Generate lifestyle product categories',
  },
})

export const getFeaturedDeals = defineEndpoint({
  path: '/api/deals',
  method: 'GET',
  schema: FeaturedDealSchema,
  mock: {
    count: 3,
    instruction: 'Generate flash sale deals with discounts between 10-50%',
  },
})
