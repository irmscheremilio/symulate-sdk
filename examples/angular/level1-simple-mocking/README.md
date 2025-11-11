# Level 1: Simple Endpoint Mocking

This example demonstrates the simplest way to use Symulate SDK - basic endpoint mocking with minimal configuration.

## Features Demonstrated

- ✅ Basic endpoint definitions with `defineEndpoint()`
- ✅ Simple schema definitions with `m.object()`
- ✅ Inline mock configuration
- ✅ Type safety with TypeScript
- ✅ Faker.js mode (no API key needed)

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── endpoints.ts         # All API definitions in one file
│   ├── app.component.ts         # Main component
│   └── app.config.ts            # Symulate configuration
```

## When to Use This Pattern

- Simple REST APIs
- Quick prototyping
- Basic frontend development
- No need for stateful data
- Small projects with few endpoints

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm start
```

3. Open browser at http://localhost:4200

## Key Code

### API Definitions (endpoints.ts)

```typescript
import { defineEndpoint, m, type Infer } from '@symulate/sdk';

// Define schema
export const UserSchema = m.object({
  id: m.uuid(),
  name: m.person.fullName(),
  email: m.email(),
});

export type User = Infer<typeof UserSchema>;

// Define endpoint with inline mock config
export const getUsers = defineEndpoint<User[]>({
  path: '/api/users',
  method: 'GET',
  schema: UserSchema,
  mock: { count: 10 },  // Minimal mock config
});
```

### Configuration (app.config.ts)

```typescript
import { configureSymulate } from '@symulate/sdk';

configureSymulate({
  generateMode: 'faker',  // No API key needed!
  environment: 'development',
  backendBaseUrl: 'https://api.example.com',
});
```

## Testing the Implementation

This example tests:
- ✅ Basic endpoint mocking
- ✅ Type inference
- ✅ Faker.js generation
- ✅ Optional fields (25% undefined chance)
