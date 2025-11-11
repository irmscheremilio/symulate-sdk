// Quick test to see what orders.list() returns
const { defineCollection, m, configureSymulate } = require('./dist/index.js');

// Configure
configureSymulate({
  environment: 'development',
  generateMode: 'faker',
  collections: {
    persistence: { mode: 'memory' },
  },
});

// Define schemas
const UserSchema = m.object({
  id: m.uuid(),
  name: m.person.fullName(),
  email: m.email(),
});

const OrderSchema = m.object({
  id: m.uuid(),
  userId: m.uuid(),
  orderNumber: m.string(),
  total: m.number(),
  createdAt: m.date(),
  updatedAt: m.date(),
});

// Response schema with joins
const OrderResponseSchema = m.object({
  id: m.uuid(),
  userId: m.uuid(),
  orderNumber: m.string(),
  total: m.number(),
  createdAt: m.date(),
  updatedAt: m.date(),
  userName: m.join('user', 'name'),
  userEmail: m.join('user', 'email'),
});

// Create collections
const users = defineCollection({
  name: 'users',
  basePath: '/api/users',
  schema: UserSchema,
  seedCount: 5,
});

const orders = defineCollection({
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
  seedCount: 10,
});

// Test
(async () => {
  console.log('\n=== Testing orders.list() ===\n');

  const result = await orders.list({ limit: 100 });

  console.log('Result type:', typeof result);
  console.log('Result is array?', Array.isArray(result));
  console.log('Result keys:', result ? Object.keys(result) : 'null');
  console.log('Result.data:', result?.data);
  console.log('Result.data length:', result?.data?.length);
  console.log('Result.pagination:', result?.pagination);

  if (result?.data && result.data.length > 0) {
    console.log('\nFirst order:');
    console.log(JSON.stringify(result.data[0], null, 2));
  }
})();
