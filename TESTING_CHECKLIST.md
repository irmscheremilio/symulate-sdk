# Stateful Collections Testing Checklist

## Prerequisites
- ✅ SDK built successfully (`npm run build`)
- ✅ Supabase migration deployed (`supabase db push`)
- ✅ Angular demo app installed (`npm install`)

## 1. Basic CRUD Operations (Angular Demo)

### Start the Demo
```bash
cd symulate-angular-dev
npm start
```
Open http://localhost:4200/products

### Test Create
- [ ] Click "Create Product" with valid data
- [ ] Verify product appears in the list immediately (read-after-write)
- [ ] Verify product has auto-generated ID
- [ ] Verify createdAt and updatedAt timestamps are present
- [ ] Try creating with empty name - should show alert
- [ ] Try creating with negative price - should show alert

### Test List
- [ ] Verify initial 20 seed products are displayed
- [ ] Verify product cards show all fields (name, price, category, stock status)
- [ ] Verify products have diverse, realistic data (Faker-generated)

### Test Update
- [ ] Click "Update Price" on any product
- [ ] Enter new price
- [ ] Verify price updates immediately in the UI
- [ ] Verify other fields remain unchanged
- [ ] Verify updatedAt timestamp changes
- [ ] Verify createdAt timestamp stays the same

### Test Toggle Stock
- [ ] Click stock toggle button (📦→❌ or ❌→📦)
- [ ] Verify stock status changes immediately
- [ ] Verify card opacity changes for out-of-stock items
- [ ] Toggle multiple times to ensure consistency

### Test Delete
- [ ] Click "Delete" on a product
- [ ] Confirm deletion in dialog
- [ ] Verify product disappears from list
- [ ] Verify product count decreases
- [ ] Cancel deletion dialog - product should remain

### Test Persistence (Memory Mode)
- [ ] Create a few products
- [ ] Refresh the page
- [ ] Verify products are gone (memory mode resets)
- [ ] Verify 20 seed products are regenerated

## 2. File Persistence Mode

### Configure File Mode
Edit `symulate-angular-dev/src/app/api/endpoints.ts`:
```typescript
configureSymulate({
  environment: 'development',
  generateMode: 'faker',
  collections: {
    persistence: { mode: 'file' }
  }
});
```

### Test File Persistence
- [ ] Restart the app
- [ ] Create 3 new products with unique names
- [ ] Note the product IDs
- [ ] Refresh the page
- [ ] Verify the 3 products are still there (persisted!)
- [ ] Verify `.symulate-data.json` file exists in project root
- [ ] Open the file and verify JSON structure
- [ ] Update a product price
- [ ] Check the file - verify price updated
- [ ] Delete a product
- [ ] Check the file - verify product removed

### Test Auto-Save
- [ ] Create a product
- [ ] Wait 5 seconds (default auto-save interval)
- [ ] Kill the dev server (Ctrl+C)
- [ ] Check `.symulate-data.json` - new product should be saved
- [ ] Restart the server
- [ ] Verify product loads from file

## 3. Supabase Persistence Mode

### Configure Supabase Mode
Update `endpoints.ts`:
```typescript
configureSymulate({
  environment: 'development',
  generateMode: 'faker',
  supabaseUrl: 'your-supabase-url',
  supabaseAnonKey: 'your-anon-key',
  collections: {
    persistence: { mode: 'supabase' }
  }
});
```

### Test Supabase Persistence
- [ ] Restart the app
- [ ] Create 3 new products
- [ ] Open Supabase dashboard
- [ ] Go to Table Editor → collection_data
- [ ] Verify row exists for "products" collection
- [ ] Verify `data` column contains JSON array
- [ ] Update a product
- [ ] Refresh Supabase - verify data updated
- [ ] Open app in incognito window (same project)
- [ ] Verify products load from Supabase
- [ ] Create product in window 1
- [ ] Refresh window 2 - should see new product (cloud sync!)

### Test Project Isolation
- [ ] Create a second Symulate project
- [ ] Use same collection name "products"
- [ ] Verify data is separate between projects
- [ ] Check Supabase - should have 2 rows with different project_ids

## 4. CLI Commands

### Test Sync Command
```bash
cd symulate-sdk
npx tsx src/cli/index.ts sync --project-id <your-project-id>
```

- [ ] Verify command runs without errors
- [ ] Verify detects collections (should see "products" collection)
- [ ] Verify generates endpoints for all CRUD operations:
  - GET /api/products (list)
  - GET /api/products/:id (get)
  - POST /api/products (create)
  - PATCH /api/products/:id (update)
  - PUT /api/products/:id (replace)
  - DELETE /api/products/:id (delete)
- [ ] Check Supabase `endpoints` table
- [ ] Verify 6 endpoints created for products collection

### Test OpenAPI Export
```bash
npx tsx src/cli/index.ts openapi --output openapi.json
```

- [ ] Verify openapi.json file is created
- [ ] Open file and verify structure
- [ ] Verify contains paths for products collection:
  - `/api/products` with GET and POST
  - `/api/products/{id}` with GET, PATCH, PUT, DELETE
- [ ] Verify schemas section includes Product schema
- [ ] Verify pagination response schema included
- [ ] Import spec into Postman/Swagger UI - should render correctly

### Test OpenAPI Without Collections
```bash
npx tsx src/cli/index.ts openapi --no-collections --output openapi-no-collections.json
```

- [ ] Verify file created
- [ ] Verify products collection endpoints NOT included
- [ ] Verify other endpoints (getUsers, getUser) ARE included

## 5. Type Safety (TypeScript)

Create a test file `test-types.ts`:
```typescript
import { defineCollection, m, type Infer } from '@symulate/sdk';

const ProductSchema = m.object({
  id: m.uuid(),
  name: m.string(),
  price: m.number(),
});

type Product = Infer<typeof ProductSchema>;

const products = defineCollection<Product>({
  name: 'products',
  schema: ProductSchema,
});

// Test autocomplete and type checking
async function testTypes() {
  const list = await products.list();
  list.data[0].name; // ✓ Should autocomplete
  list.data[0].email; // ✗ Should error

  const product = await products.get('123');
  product.name; // ✓ Should autocomplete
  product.age; // ✗ Should error

  await products.create({
    name: 'Test',
    price: 100,
  }); // ✓ Valid

  await products.create({
    name: 'Test',
    price: '100', // ✗ Should error - string not number
  });

  await products.update('123', {
    price: 150, // ✓ Valid partial update
  });

  await products.update('123', {
    invalid: true, // ✗ Should error
  });
}
```

- [ ] Run `tsc --noEmit test-types.ts`
- [ ] Verify errors appear for invalid operations
- [ ] Open file in VS Code - verify autocomplete works
- [ ] Hover over methods - verify correct type hints

## 6. Error Handling

### Test Error Conditions

Update `endpoints.ts` to add custom errors:
```typescript
export const products = defineCollection<Product>({
  name: 'products',
  schema: ProductSchema,
  operations: {
    create: {
      errors: [{
        code: 400,
        description: 'Invalid product data'
      }],
      failIf: (data) => data.price <= 0 ? 400 : false,
    },
    delete: {
      errors: [{
        code: 403,
        description: 'Cannot delete products in stock'
      }],
      failIf: (data) => data.inStock ? 403 : false,
    }
  }
});
```

- [ ] Try creating product with price = 0
- [ ] Verify error message appears
- [ ] Verify product NOT created
- [ ] Try deleting in-stock product
- [ ] Verify error message appears
- [ ] Verify product NOT deleted
- [ ] Mark product out-of-stock
- [ ] Try deleting again - should succeed

## 7. Hooks System

Add hooks to test lifecycle events:
```typescript
export const products = defineCollection<Product>({
  name: 'products',
  schema: ProductSchema,
  hooks: {
    beforeCreate: async (data) => {
      console.log('BEFORE CREATE:', data);
      return {
        ...data,
        name: data.name.toUpperCase(),
      };
    },
    afterCreate: async (item) => {
      console.log('AFTER CREATE:', item);
    },
    beforeUpdate: async (id, updates) => {
      console.log('BEFORE UPDATE:', id, updates);
      return updates;
    },
    afterUpdate: async (item) => {
      console.log('AFTER UPDATE:', item);
    },
    beforeDelete: async (id) => {
      console.log('BEFORE DELETE:', id);
    },
    afterDelete: async (id) => {
      console.log('AFTER DELETE:', id);
    },
  }
});
```

- [ ] Open browser console
- [ ] Create a product
- [ ] Verify "BEFORE CREATE" and "AFTER CREATE" logs
- [ ] Verify product name is UPPERCASE (hook transformation)
- [ ] Update a product
- [ ] Verify "BEFORE UPDATE" and "AFTER UPDATE" logs
- [ ] Delete a product
- [ ] Verify "BEFORE DELETE" and "AFTER DELETE" logs

## 8. Relations (Advanced)

Create related collections:
```typescript
const UserSchema = m.object({
  id: m.uuid(),
  name: m.string(),
  email: m.email(),
});

const PostSchema = m.object({
  id: m.uuid(),
  userId: m.uuid(),
  title: m.string(),
  content: m.string(),
});

export const users = defineCollection({
  name: 'users',
  schema: UserSchema,
  relations: {
    posts: {
      collection: 'posts',
      foreignKey: 'userId',
      type: 'one-to-many',
    }
  }
});

export const posts = defineCollection({
  name: 'posts',
  schema: PostSchema,
});
```

- [ ] Create a user
- [ ] Create 3 posts with the user's ID
- [ ] Call `await users.getPosts(userId)`
- [ ] Verify returns 3 posts
- [ ] Create post with different userId
- [ ] Call `getPosts` again - should still return 3

## 9. Production Mode

Update config:
```typescript
configureSymulate({
  environment: 'production',
  backendBaseUrl: 'http://localhost:3000',
});
```

- [ ] Verify collections switch to HTTP mode
- [ ] Create product - should make POST request to `/api/products`
- [ ] List products - should make GET request to `/api/products`
- [ ] Verify 404 errors (no real backend yet)
- [ ] Set up mock backend (json-server or similar)
- [ ] Verify CRUD operations call real API

## 10. AI-Powered Seed Data

Update config:
```typescript
configureSymulate({
  environment: 'development',
  generateMode: 'ai',
  symulateApiKey: 'sym_live_xxx',
  collections: {
    persistence: { mode: 'memory' }
  }
});

export const products = defineCollection<Product>({
  name: 'products',
  schema: ProductSchema,
  seedCount: 10,
  seedInstruction: 'Generate luxury electronics products with premium brands',
});
```

- [ ] Delete `.symulate-data.json` if exists
- [ ] Restart app
- [ ] Verify console shows "Generating with AI"
- [ ] Verify products are realistic (Apple, Samsung, etc.)
- [ ] Verify product descriptions are contextual
- [ ] Verify categories match instruction
- [ ] Compare to Faker mode - AI should be more realistic

## 11. Unit Tests

Run the test suite:
```bash
cd symulate-sdk
npm test
```

- [ ] Verify all tests pass
- [ ] Check test coverage:
  - `dataStore.test.ts` - CRUD operations
  - `defineCollection.test.ts` - Collection API
- [ ] Review any failing tests
- [ ] Run specific test: `npm test dataStore`

## 12. Pagination & Filtering

### Test Pagination
- [ ] Create 50 products
- [ ] Call `products.list({ limit: 10 })`
- [ ] Verify returns 10 items
- [ ] Verify pagination.totalPages = 5
- [ ] Call `products.list({ page: 2, limit: 10 })`
- [ ] Verify different 10 items returned
- [ ] Iterate through all pages

### Test Sorting
- [ ] Call `products.list({ sortBy: 'price', sortOrder: 'asc' })`
- [ ] Verify prices increase
- [ ] Call `products.list({ sortBy: 'price', sortOrder: 'desc' })`
- [ ] Verify prices decrease

### Test Filtering
- [ ] Call `products.list({ filters: { inStock: true } })`
- [ ] Verify all returned products have inStock = true
- [ ] Call `products.list({ filters: { price: { $gt: 100 } } })`
- [ ] Verify all prices > 100
- [ ] Test other operators: $lt, $gte, $lte, $in

## 13. Edge Cases

### Test Empty Collection
- [ ] Create collection with seedCount: 0
- [ ] Verify empty list
- [ ] Create first item - should work
- [ ] List again - should return 1 item

### Test Large Collections
- [ ] Set seedCount: 1000
- [ ] Verify initialization completes
- [ ] Verify list with pagination works
- [ ] Verify performance is acceptable

### Test Concurrent Operations
- [ ] Create 10 products simultaneously (Promise.all)
- [ ] Verify all 10 created
- [ ] Update 5 products simultaneously
- [ ] Verify all 5 updated
- [ ] Delete 3 products simultaneously
- [ ] Verify all 3 deleted

### Test Invalid Data
- [ ] Try creating without required fields
- [ ] Try updating non-existent ID
- [ ] Try deleting non-existent ID
- [ ] Verify appropriate errors thrown

## 14. Registry Functions

Create test file:
```typescript
import {
  getRegisteredCollections,
  getCollection,
  hasCollection,
  exportCollectionsArray
} from '@symulate/sdk';

// After defining collections
console.log('All collections:', getRegisteredCollections());
console.log('Has products?', hasCollection('products'));
console.log('Get products:', getCollection('products'));
console.log('Export for CLI:', exportCollectionsArray());
```

- [ ] Verify getRegisteredCollections returns Map
- [ ] Verify hasCollection returns boolean
- [ ] Verify getCollection returns collection or undefined
- [ ] Verify exportCollectionsArray returns array with metadata

## Checklist Summary

### Critical Tests (Must Pass)
- [ ] CRUD operations work in Angular demo
- [ ] File persistence saves and loads data
- [ ] Supabase persistence syncs to cloud
- [ ] CLI sync command detects collections
- [ ] OpenAPI export includes collection endpoints
- [ ] Type safety works (autocomplete, errors)
- [ ] Unit tests pass

### Important Tests (Should Pass)
- [ ] Error handling with failIf conditions
- [ ] Hooks execute at correct times
- [ ] Pagination, sorting, filtering work
- [ ] Production mode switches to HTTP
- [ ] Relations return correct data

### Nice-to-Have Tests (Optional)
- [ ] AI-powered seed data (requires API key)
- [ ] Edge cases handled gracefully
- [ ] Large collections perform well
- [ ] Concurrent operations work

## Reporting Issues

If any test fails, note:
1. Which test failed
2. Expected behavior
3. Actual behavior
4. Console errors/logs
5. Browser/environment details
