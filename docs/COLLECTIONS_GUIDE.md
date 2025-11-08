# Stateful Collections Guide

## Overview

Stateful Collections provide full CRUD (Create, Read, Update, Delete) operations with persistent state management. Unlike basic endpoints that simulate responses, collections maintain state across requests with read-after-write consistency.

## Quick Start

```typescript
import { m, defineCollection, configureSymulate, type Infer } from '@symulate/sdk';

// Configure Symulate
configureSymulate({
  environment: 'development',
  generateMode: 'faker',
  collections: {
    persistence: {
      mode: 'memory' // or 'file' or 'supabase'
    }
  }
});

// Define schema
const UserSchema = m.object({
  id: m.uuid(),
  name: m.person.fullName(),
  email: m.email(),
  role: m.string("['admin', 'user', 'guest']"),
  createdAt: m.date(),
  updatedAt: m.date(),
});

// Infer TypeScript type
export type User = Infer<typeof UserSchema>;

// Define collection
export const users = defineCollection<User>({
  name: 'users',
  basePath: '/api/users',
  schema: UserSchema,
  seedCount: 10,
});
```

## CRUD Operations

### List Items

```typescript
// Basic list
const response = await users.list();
console.log(response.data); // Array of users
console.log(response.pagination); // { page, limit, total, totalPages }

// With pagination
const page2 = await users.list({ page: 2, limit: 20 });

// With sorting
const sorted = await users.list({
  sortBy: 'createdAt',
  sortOrder: 'desc'
});

// With filtering
const filtered = await users.list({
  filters: { role: 'admin' }
});
```

### Get Single Item

```typescript
const user = await users.get('user-id-123');
console.log(user.name);
```

### Create Item

```typescript
const newUser = await users.create({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  // id, createdAt, updatedAt are auto-generated
});

console.log(newUser.id); // Auto-generated UUID
```

### Update Item (Partial)

```typescript
// Only update specified fields
const updated = await users.update('user-id-123', {
  role: 'admin'
});

// Other fields remain unchanged
console.log(updated.name); // Original name preserved
```

### Replace Item (Full)

```typescript
// Replace entire item (except id)
const replaced = await users.replace('user-id-123', {
  name: 'Jane Doe',
  email: 'jane@example.com',
  role: 'user',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
});
```

### Delete Item

```typescript
await users.delete('user-id-123');
```

## Configuration Options

### Basic Configuration

```typescript
export const products = defineCollection<Product>({
  name: 'products',              // Required: Collection name
  basePath: '/api/products',     // Optional: Default is /{name}
  schema: ProductSchema,         // Required: Schema definition
  seedCount: 20,                 // Optional: Initial items (default: 10)
  seedInstruction: 'Generate realistic e-commerce products', // Optional: AI hint
});
```

### Custom Operations

```typescript
export const products = defineCollection<Product>({
  name: 'products',
  schema: ProductSchema,

  operations: {
    // Disable specific operations
    delete: false,

    // Or configure with custom behavior
    delete: {
      // Define possible errors
      errors: [{
        code: 403,
        description: 'Cannot delete products in shopping cart'
      }, {
        code: 409,
        description: 'Product has pending orders'
      }],

      // Conditionally trigger errors
      failIf: (data) => {
        // Return error code to trigger, or false to succeed
        if (data.inCart) return 403;
        if (data.hasOrders) return 409;
        return false;
      }
    },

    create: {
      errors: [{
        code: 400,
        description: 'Invalid product data'
      }],
      failIf: (data) => {
        if (!data.name || data.price <= 0) return 400;
        return false;
      }
    }
  }
});
```

### Query Parameter Customization

Customize query parameter names and routing for pagination, sorting, and filtering to match your backend API conventions.

#### Default Behavior

By default, collections use these parameter names for list operations:
- **Pagination**: `page`, `limit`
- **Sorting**: `sortBy`, `sortOrder`
- **Filtering**: `filter`

```typescript
await products.list({ page: 1, limit: 20, sortBy: 'price', sortOrder: 'desc' });
// GET /api/products?page=1&limit=20&sortBy=price&sortOrder=desc
```

#### Role-Based Parameter Customization

Use the `params` array with semantic roles to customize parameter names and locations:

```typescript
export const products = defineCollection<Product>({
  name: 'products',
  basePath: '/api/products',
  schema: ProductSchema,
  operations: {
    list: {
      params: [
        // Custom pagination parameter names
        { name: 'pageNumber', location: 'query', role: 'pagination.page', schema: m.number() },
        { name: 'pageSize', location: 'query', role: 'pagination.limit', schema: m.number() },

        // Custom sorting parameter names
        { name: 'orderBy', location: 'query', role: 'sort.field', schema: m.string() },
        { name: 'direction', location: 'query', role: 'sort.order', schema: m.string() },

        // Custom filter parameter name
        { name: 'q', location: 'query', role: 'filter', schema: m.object({ category: m.string() }) },
      ]
    }
  }
});

// Internal API stays the same
await products.list({ page: 1, limit: 20, sortBy: 'price', sortOrder: 'desc' });

// But generates URL with custom parameter names:
// GET /api/products?pageNumber=1&pageSize=20&orderBy=price&direction=desc
```

**Available parameter roles:**

| Role | Purpose | Default Name |
|------|---------|--------------|
| `pagination.page` | Current page number | `page` |
| `pagination.limit` | Items per page | `limit` |
| `sort.field` | Field to sort by | `sortBy` |
| `sort.order` | Sort direction (asc/desc) | `sortOrder` |
| `filter` | Filter criteria | `filter` |

#### Parameter Locations

Control WHERE parameters are sent using the `location` property:

```typescript
export const products = defineCollection<Product>({
  name: 'products',
  operations: {
    list: {
      params: [
        // Send in query string (default)
        { name: 'page', location: 'query', role: 'pagination.page', schema: m.number() },

        // Send in request body (switches to POST)
        { name: 'filter', location: 'body', role: 'filter', schema: m.object({ category: m.string() }) },

        // Send as HTTP header
        { name: 'X-Sort-By', location: 'header', role: 'sort.field', schema: m.string() },
      ]
    }
  }
});

// Usage
await products.list({ page: 1, filter: { category: 'Electronics' }, sortBy: 'price' });
// POST /api/products?page=1
// Headers: X-Sort-By: price
// Body: { "filter": { "category": "Electronics" } }
```

**Available locations:**
- **`query`** (default) - URL query string parameter
- **`body`** - Request body (automatically switches to POST)
- **`header`** - HTTP header

**Important Notes:**
- When any parameter uses `location: 'body'`, the request method automatically changes from GET to POST
- You can mix different locations in the same request (query + body + headers)
- Header names can be custom (e.g., `X-Page`, `X-Sort-By`)

#### Disabling Query Parameters

You can disable automatic query parameters globally or per-operation:

**Global disable:**
```typescript
configureSymulate({
  collections: {
    disableQueryParams: true  // Disables for ALL collections
  }
});

// No query parameters added
await products.list({ page: 1, limit: 20 });
// GET /api/products (no query params)
```

**Per-operation disable:**
```typescript
export const products = defineCollection<Product>({
  name: 'products',
  operations: {
    list: {
      disableQueryParams: true  // Disables only for this operation
    }
  }
});
```

#### Common API Conventions

**Laravel/Spring Boot style:**
```typescript
params: [
  { name: 'page', location: 'query', role: 'pagination.page', schema: m.number() },
  { name: 'per_page', location: 'query', role: 'pagination.limit', schema: m.number() },
  { name: 'sort', location: 'query', role: 'sort.field', schema: m.string() },
  { name: 'order', location: 'query', role: 'sort.order', schema: m.string() },
]
```

**ASP.NET Core style:**
```typescript
params: [
  { name: 'pageNumber', location: 'query', role: 'pagination.page', schema: m.number() },
  { name: 'pageSize', location: 'query', role: 'pagination.limit', schema: m.number() },
  { name: 'orderBy', location: 'query', role: 'sort.field', schema: m.string() },
  { name: 'sortOrder', location: 'query', role: 'sort.order', schema: m.string() },
]
```

**Django style:**
```typescript
params: [
  { name: 'page', location: 'query', role: 'pagination.page', schema: m.number() },
  { name: 'page_size', location: 'query', role: 'pagination.limit', schema: m.number() },
  { name: 'ordering', location: 'query', role: 'sort.field', schema: m.string() },
  { name: 'search', location: 'query', role: 'filter', schema: m.string() },
]
```

### Relations

```typescript
const users = defineCollection<User>({
  name: 'users',
  schema: UserSchema,

  relations: {
    posts: {
      collection: 'posts',        // Target collection name
      foreignKey: 'userId',       // Field in posts that references user.id
      type: 'one-to-many'
    },
    profile: {
      collection: 'profiles',
      foreignKey: 'userId',
      type: 'one-to-one'
    }
  }
});

// Use relation methods
const posts = defineCollection<Post>({ /* ... */ });

const userPosts = await users.getPosts('user-id-123');
const userProfile = await users.getProfile('user-id-123');
```

### Hooks

```typescript
export const products = defineCollection<Product>({
  name: 'products',
  schema: ProductSchema,

  hooks: {
    beforeCreate: async (data) => {
      // Modify data before creation
      console.log('Creating product:', data);
      return { ...data, slug: slugify(data.name) };
    },

    afterCreate: async (item) => {
      // Side effects after creation
      console.log('Product created:', item.id);
      await sendNotification('New product created!');
    },

    beforeUpdate: async (id, updates) => {
      // Validate or modify updates
      if (updates.price < 0) {
        throw new Error('Price cannot be negative');
      }
      return updates;
    },

    afterUpdate: async (item) => {
      console.log('Product updated:', item.id);
    },

    beforeDelete: async (id) => {
      // Validation before deletion
      const product = await products.get(id);
      if (product.inCart) {
        throw new Error('Cannot delete product in cart');
      }
    },

    afterDelete: async (id) => {
      console.log('Product deleted:', id);
    }
  }
});
```

## Persistence Modes

### Memory (Default)

Data resets when app restarts. Best for quick prototyping.

```typescript
configureSymulate({
  collections: {
    persistence: { mode: 'memory' }
  }
});
```

### File

Data persists to `.symulate-data.json` in project root. Best for local development.

```typescript
configureSymulate({
  collections: {
    persistence: {
      mode: 'file',
      filePath: '.symulate-data.json',  // Optional: custom path
      autoSaveInterval: 5000,            // Optional: auto-save every 5s
    }
  }
});
```

### Supabase

Data syncs to cloud. Best for team collaboration.

```typescript
configureSymulate({
  collections: {
    persistence: {
      mode: 'supabase',
      autoSaveInterval: 10000,  // Optional: auto-sync every 10s
    }
  }
});
```

## Production Usage

In production, collections automatically switch to HTTP mode and call your real backend:

```typescript
// Development: Uses DataStore
configureSymulate({ environment: 'development' });
await users.create({ ... }); // Stored in DataStore

// Production: Uses HTTP
configureSymulate({ environment: 'production' });
await users.create({ ... }); // POST /api/users

// Automatic environment detection
configureSymulate({
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
});
```

## Type Safety

Collections are fully type-safe:

```typescript
const UserSchema = m.object({
  id: m.uuid(),
  name: m.string(),
  age: m.number(),
});

type User = Infer<typeof UserSchema>;

const users = defineCollection<User>({
  name: 'users',
  schema: UserSchema,
});

// TypeScript autocomplete works!
const user = await users.get('123');
console.log(user.name); // ✓ Type: string
console.log(user.email); // ✗ Error: Property 'email' does not exist

// Create validates types
await users.create({
  name: 'John',
  age: 25,
}); // ✓ Valid

await users.create({
  name: 'John',
  age: '25', // ✗ Error: Type 'string' is not assignable to type 'number'
});
```

## CLI Integration

### Sync Collections

The `npx symulate sync` command automatically detects collections and syncs them to Supabase:

```bash
npx symulate sync
```

This will:
1. Detect all `defineCollection()` calls
2. Generate endpoint definitions for all operations
3. Sync to your Supabase project

### Generate OpenAPI Spec

The `npx symulate openapi` command includes collections in the spec:

```bash
npx symulate openapi --output openapi.json
```

To exclude collections:

```bash
npx symulate openapi --no-collections --output openapi.json
```

## Advanced Patterns

### Computed Fields

```typescript
const users = defineCollection<User>({
  name: 'users',
  schema: UserSchema,
  hooks: {
    afterCreate: async (user) => {
      // Add computed field
      return {
        ...user,
        displayName: `${user.firstName} ${user.lastName}`
      };
    }
  }
});
```

### Validation

```typescript
const products = defineCollection<Product>({
  name: 'products',
  schema: ProductSchema,
  hooks: {
    beforeCreate: async (data) => {
      // Validate
      if (data.price <= 0) {
        throw new Error('Price must be positive');
      }
      if (!data.name?.trim()) {
        throw new Error('Name is required');
      }
      return data;
    }
  }
});
```

### Soft Deletes

```typescript
const ProductSchema = m.object({
  id: m.uuid(),
  name: m.string(),
  deletedAt: m.nullable(m.date()),
});

const products = defineCollection<Product>({
  name: 'products',
  schema: ProductSchema,

  operations: {
    delete: false, // Disable hard delete
  },

  hooks: {
    // Implement soft delete via update
    beforeUpdate: async (id, updates) => {
      if (updates.deletedAt) {
        console.log('Soft deleting:', id);
      }
      return updates;
    }
  }
});

// Soft delete by updating
await products.update('id', { deletedAt: new Date() });

// Filter out deleted items
const active = await products.list({
  filters: { deletedAt: null }
});
```

## Migration from defineEndpoint

If you have existing endpoints, you can migrate gradually:

```typescript
// Before: Stateless endpoint
export const getUsers = defineEndpoint<User[]>({
  path: '/api/users',
  method: 'GET',
  schema: m.array(UserSchema),
  mock: { count: 10 }
});

// After: Stateful collection
export const users = defineCollection<User>({
  name: 'users',
  basePath: '/api/users',
  schema: UserSchema,
  seedCount: 10,
});

// Usage changes:
// Before: const data = await getUsers();
// After:  const { data } = await users.list();
```

Both approaches can coexist in the same project.

## Best Practices

1. **Use TypeScript inference**: Always use `Infer<typeof Schema>` for type safety
2. **Configure persistence early**: Set `mode: 'file'` in development for data persistence
3. **Use hooks for validation**: Implement business logic in hooks, not in components
4. **Enable operations selectively**: Disable operations you don't need (e.g., public APIs might not need `delete`)
5. **Use relations for data integrity**: Define relations instead of manual joins
6. **Test with production mode**: Ensure your backend implements the same paths before deploying

## Troubleshooting

### "Collection not found" Error

Make sure you've defined the collection before using it:

```typescript
// Define first
export const users = defineCollection({ ... });

// Then use
await users.list();
```

### Data Not Persisting

Check your persistence configuration:

```typescript
configureSymulate({
  collections: {
    persistence: { mode: 'file' } // Not 'memory'
  }
});
```

### Type Errors

Ensure you're using `Infer<typeof Schema>`:

```typescript
// ✗ Wrong
type User = { id: string; name: string };

// ✓ Correct
export type User = Infer<typeof UserSchema>;
```

### Operations Not Detected by CLI

Make sure you're exporting collections:

```typescript
// ✗ Wrong
const users = defineCollection({ ... });

// ✓ Correct
export const users = defineCollection({ ... });
```

## API Reference

### defineCollection<T>(config: CollectionConfig<T>): Collection<T>

Creates a stateful collection with CRUD operations.

**Parameters:**
- `config.name` (required): Collection identifier
- `config.schema` (required): Schema definition
- `config.basePath` (optional): API base path (default: `/{name}`)
- `config.seedCount` (optional): Initial item count (default: 10)
- `config.seedInstruction` (optional): AI generation hint
- `config.operations` (optional): Operation configurations
- `config.relations` (optional): Related collections
- `config.hooks` (optional): Lifecycle hooks

**Returns:** Collection instance with methods:
- `list(options?)`: Query items with pagination
- `get(id)`: Get single item
- `create(data)`: Create new item
- `update(id, data)`: Partial update
- `replace(id, data)`: Full replacement
- `delete(id)`: Remove item

### Collection Registry Functions

```typescript
import { getCollection, hasCollection, getRegisteredCollections } from '@symulate/sdk';

// Get collection by name
const users = getCollection<User>('users');

// Check if collection exists
if (hasCollection('users')) { ... }

// Get all registered collections
const all = getRegisteredCollections();
```

## Examples

See the `symulate-angular-dev` app for a complete working example with a Products CRUD interface.
