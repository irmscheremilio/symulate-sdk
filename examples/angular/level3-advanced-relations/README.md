# Level 3: Advanced Relations & Interconnected Data

This example demonstrates the **most advanced features** of Symulate SDK with a realistic e-commerce application showcasing interconnected collections, nested joins, and foreign key integrity.

## Key Features

### 1. Interconnected Collections
- **Users** → **Orders** (one-to-many)
- **Orders** → **OrderItems** (one-to-many)
- **OrderItems** → **Products** (many-to-one)
- Foreign key relationships with automatic integrity

### 2. Joins & Nested Data
- Response schemas with `m.join()` for including related data
- Simple joins: `m.join('user', 'name')` - Include user name in order
- Nested joins: `m.join('order.user', 'email')` - Deep traversal through multiple relations
- Data fetched at query time, not stored redundantly

### 3. Foreign Key Integrity
- Collections seeded in dependency order (Users → Products → Orders → OrderItems)
- No orphaned references - all FKs reference existing records
- Realistic relationships maintained automatically

### 4. Complex Schema Design
- Nested objects (addresses, shipping info)
- Optional fields with `m.optional()`
- Arrays of related data
- Computed fields in response schemas

## Project Structure

```
src/app/
├── api/
│   ├── schemas/              # Entity schemas
│   │   ├── user.schema.ts
│   │   ├── product.schema.ts
│   │   ├── order.schema.ts
│   │   └── order-item.schema.ts
│   ├── mocks/               # Seed configurations
│   │   ├── user.mock.ts
│   │   ├── product.mock.ts
│   │   ├── order.mock.ts
│   │   └── order-item.mock.ts
│   └── collections.ts       # Collections with relations & joins
├── symulate.config.ts       # SDK configuration
├── app.component.ts         # E-commerce dashboard logic
├── app.component.html       # UI template
└── app.component.css        # Styles
```

## How Joins Work

### Simple Join Example

**Order Collection:**
```typescript
const OrderResponseSchema = m.object({
  id: m.uuid(),
  userId: m.uuid(),
  total: m.number(),
  // Joined fields from User collection
  userName: m.join('user', 'name'),
  userEmail: m.join('user', 'email'),
});

export const orders = defineCollection({
  name: 'orders',
  schema: OrderSchema,
  responseSchema: OrderResponseSchema, // Response includes user data
  relations: {
    user: {
      type: 'belongsTo',
      collection: 'users',
      foreignKey: 'userId',
      references: 'id',
    },
  },
});
```

**What you get:**
```json
{
  "id": "123",
  "userId": "user-456",
  "total": 99.99,
  "userName": "John Doe",      // ← From users collection
  "userEmail": "john@email.com" // ← From users collection
}
```

### Nested Join Example

**OrderItem Collection:**
```typescript
const OrderItemResponseSchema = m.object({
  id: m.uuid(),
  orderId: m.uuid(),
  productId: m.uuid(),
  quantity: m.number(),
  // Simple join to Product
  productName: m.join('product', 'name'),
  // Nested join through Order to User
  customerName: m.join('order.user', 'name'),
  customerEmail: m.join('order.user', 'email'),
});

export const orderItems = defineCollection({
  name: 'orderItems',
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
});
```

**What you get:**
```json
{
  "id": "item-1",
  "orderId": "order-123",
  "productId": "product-789",
  "quantity": 2,
  "productName": "Wireless Mouse",           // ← From products collection
  "customerName": "John Doe",                // ← From users collection (via order)
  "customerEmail": "john@email.com"          // ← From users collection (via order)
}
```

## Running the Example

### 1. Install Dependencies
```bash
npm install
```

### 2. Build and Run
```bash
npm start
```

The application will be available at `http://localhost:4203`

### 3. Configuration Modes

Edit `src/app/symulate.config.ts` to change behavior:

**Memory Mode (Default - Data lost on refresh):**
```typescript
configureSymulate({
  environment: 'development',
  generateMode: 'faker',
  collections: {
    persistence: {
      mode: 'memory',
    },
    eagerLoading: false, // Load related collections on-demand
  },
});
```

**Local Persistence (Data persists across reloads):**
```typescript
configureSymulate({
  environment: 'development',
  generateMode: 'faker',
  collections: {
    persistence: {
      mode: 'local', // Browser: localStorage, Node: file
    },
  },
});
```

**Eager Loading (Preload all related collections):**
```typescript
configureSymulate({
  environment: 'development',
  generateMode: 'faker',
  collections: {
    persistence: {
      mode: 'local',
    },
    eagerLoading: true, // Load Users, Products, Orders, OrderItems all at once
  },
});
```

**AI Mode (More realistic data with your OpenAI key):**
```typescript
configureSymulate({
  environment: 'development',
  generateMode: 'ai',
  openaiApiKey: 'sk-...',
  collections: {
    persistence: { mode: 'local' },
  },
});
```

## What This Example Teaches

1. **Interconnected Data**: Model realistic relationships between entities
2. **Joins**: Include related data without duplication
3. **Nested Joins**: Traverse multiple relationships (A → B → C)
4. **FK Integrity**: Automatic seeding in correct order
5. **Response Schemas**: Different structure for storage vs API responses
6. **Eager vs Lazy Loading**: Performance trade-offs
7. **Complex UI Patterns**: Dashboard, master-detail, nested views

## Data Flow

1. **Seed Generation**:
   - SDK analyzes collection dependencies
   - Generates data in order: Users → Products → Orders → OrderItems
   - Ensures all FK values reference existing IDs

2. **Query with Joins**:
   - You call `orders.list()`
   - SDK sees `responseSchema` has join fields
   - SDK loads related users collection
   - SDK resolves joins at query time
   - Returns enriched data

3. **Nested Join Resolution**:
   - You call `orderItems.list()`
   - SDK sees nested join `'order.user'`
   - SDK loads orders collection
   - SDK loads users collection (through orders)
   - SDK resolves deep path `order.user.name`
   - Returns fully enriched data

## Comparison to Previous Levels

| Feature | Level 1 | Level 2 | Level 3 |
|---------|---------|---------|---------|
| API Type | Simple endpoints | Collections API | Collections with Relations |
| Data Structure | Flat | Related (manual filtering) | Interconnected (automatic joins) |
| Joins | ❌ None | ⚠️ Manual | ✅ Automatic with m.join() |
| Nested Joins | ❌ | ❌ | ✅ |
| FK Integrity | ❌ | ❌ | ✅ Automatic |
| Complexity | Low | Medium | High |
| Best For | Prototyping | Simple CRUD apps | Complex real-world apps |

## Application Features

### Dashboard View
- Real-time stats (users, products, orders, revenue)
- Recent orders with customer info (via joins)
- Top-rated products
- Active users

### Users View
- Browse all customers
- Click to see user details
- View user's order history
- See shipping addresses

### Products View
- Product catalog with images
- Ratings, pricing, stock levels
- Categories and descriptions

### Orders View
- All orders with customer info (via joins)
- Filter by status
- Click to see order details
- View order items with product info (via nested joins)

### Order Detail View
- Customer information (from join)
- Shipping address
- Order summary (totals, tax, shipping)
- Order items with:
  - Product details (from join)
  - Customer info (from nested join: order → user)

## Advanced Patterns

### Filtering by Joined Data
```typescript
// Filter orders by user
const userOrders = await orders.list({
  filter: { userId: user.id }
});
```

### Sorting with Pagination
```typescript
const recentOrders = await orders.list({
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20
});
```

### Getting Single Record with Joins
```typescript
const order = await orders.get(orderId);
// Automatically includes userName, userEmail from join
```

## Performance Considerations

### Lazy Loading (Default)
- ✅ Lower memory usage
- ✅ Faster initial load
- ⚠️ May require multiple collection loads

### Eager Loading
- ✅ All data available immediately
- ✅ No delay on navigation
- ⚠️ Higher memory usage
- ⚠️ Slower initial load

**Recommendation**: Use lazy loading during development, eager loading for demos.

## Next Steps

- **Add mutations**: Try creating new orders, updating products
- **Custom response schemas**: Experiment with different join patterns
- **Performance testing**: Compare eager vs lazy loading
- **Add more relations**: Try many-to-many with junction tables
- **Connect to real backend**: Replace mocks with production API

## Learn More

- [Symulate SDK Documentation](https://platform.symulate.dev/docs)
- [Collections API Guide](https://platform.symulate.dev/docs/collections)
- [Relations & Joins](https://platform.symulate.dev/docs/relations)
- [Best Practices](https://platform.symulate.dev/docs/best-practices)
