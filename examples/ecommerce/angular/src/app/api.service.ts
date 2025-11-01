import { Injectable } from '@angular/core';
import { defineEndpoint, configureSymulate, m } from '@symulate/sdk';

// Configure Symulate
configureSymulate({
  symulateApiKey: 'demo_key_angular',
  generateMode: 'faker',
  fakerSeed: 99999,
  environment: 'development',
  cacheEnabled: true,
});

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
  reviews: m.number(),
});

// Category schema
const CategorySchema = m.object({
  id: m.uuid(),
  name: m.commerce.department(),
  icon: m.string(),
});

// Review schema
const ReviewSchema = m.object({
  id: m.uuid(),
  author: m.person.fullName(),
  rating: m.number(),
  comment: m.lorem.sentence(),
  date: m.date(),
});

// Define endpoints
const getProducts = defineEndpoint({
  path: '/api/products',
  method: 'GET',
  schema: ProductSchema,
  mock: {
    count: 18,
    instruction: 'Generate luxury products like designer watches, jewelry, bags, perfumes',
  },
});

const getCategories = defineEndpoint({
  path: '/api/categories',
  method: 'GET',
  schema: CategorySchema,
  mock: {
    count: 6,
    instruction: 'Generate luxury product categories',
  },
});

const getReviews = defineEndpoint({
  path: '/api/reviews',
  method: 'GET',
  schema: ReviewSchema,
  mock: {
    count: 5,
    instruction: 'Generate positive product reviews with ratings 4-5',
  },
});

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  async getProducts() {
    return getProducts();
  }

  async getCategories() {
    return getCategories();
  }

  async getReviews() {
    return getReviews();
  }
}
