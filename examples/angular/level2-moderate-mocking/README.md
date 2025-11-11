# Level 2: Moderate Mocking Example

This example demonstrates **moderate complexity** mocking with Symulate SDK, showcasing better separation of concerns and more realistic data relationships.

## Key Features

### 1. Better Code Organization
- **Separate schema files** (`api/schemas/*.schema.ts`)
- **Separate mock configurations** (`api/mocks/*.mock.ts`)
- **Collections API** (`api/collections.ts`) - Stateful CRUD operations
- **Single configuration file** (`symulate.config.ts`)

### 2. Related Entities
- Users → Posts (one-to-many)
- Posts → Comments (one-to-many)
- Users → Comments (one-to-many)
- Comments → Comments (self-referencing for threaded discussions)

### 3. More Complex Schemas
- Optional fields with fallbacks
- Array fields (tags)
- Enums (status, role)
- Timestamps and dates
- Foreign key relationships

### 4. Realistic UI Flow
- Master-detail navigation
- User → User's Posts → Post → Comments
- Loading and error states
- Back navigation

## Project Structure

```
src/app/
├── api/
│   ├── schemas/           # Type-safe schema definitions
│   │   ├── user.schema.ts
│   │   ├── post.schema.ts
│   │   └── comment.schema.ts
│   ├── mocks/            # Mock configuration (count, instructions)
│   │   ├── user.mock.ts
│   │   ├── post.mock.ts
│   │   └── comment.mock.ts
│   └── collections.ts    # Collections API with CRUD operations
├── symulate.config.ts    # SDK configuration
├── app.component.ts      # Main component logic
├── app.component.html    # Template
└── app.component.css     # Styles
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

The application will be available at `http://localhost:4202`

### 3. Switch Between Modes

Edit `src/app/symulate.config.ts` to change generation modes:

**Faker Mode (Free, Offline):**
```typescript
configureSymulate({
  environment: 'development',
  generateMode: 'faker',
});
```

**BYOK Mode (Your OpenAI Key):**
```typescript
configureSymulate({
  environment: 'development',
  generateMode: 'ai',
  openaiApiKey: 'sk-...',
});
```

**Symulate Platform Mode:**
```typescript
configureSymulate({
  environment: 'development',
  generateMode: 'ai',
  symulateApiKey: 'sym_live_...',
  projectId: 'your-project-id',
});
```

## What This Example Teaches

1. **Separation of Concerns**: Keep schemas, mocks, and collections in separate files
2. **Collections API**: Use stateful CRUD operations with `defineCollection`
3. **Type Safety**: Leverage TypeScript types from schemas
4. **Related Data**: Model realistic entity relationships with filtering
5. **Scalability**: Structure that works for larger applications
6. **Maintainability**: Easy to find and update specific parts

## Differences from Level 1

| Aspect | Level 1 | Level 2 |
|--------|---------|---------|
| API Type | Simple endpoints | Collections API |
| Organization | All inline | Separate files |
| Schemas | Simple | Related entities |
| Mocks | Inline config | Separate mock files |
| Operations | Read-only | Full CRUD |
| Complexity | Basic | Moderate |
| Relationships | None | Multiple (1:N, N:1) |

## Next Steps

See **Level 3** for advanced patterns:
- Interconnected collections with relations
- Advanced joins and nested data
- Foreign key integrity
- Eager loading configuration
- Complex real-world scenarios (e-commerce)
- And more...

## Learn More

- [Symulate SDK Documentation](https://platform.symulate.dev/docs)
- [Best Practices Guide](https://platform.symulate.dev/docs/best-practices)
