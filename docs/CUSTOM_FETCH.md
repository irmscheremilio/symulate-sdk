# Custom Fetch Implementation

Symulate SDK allows you to provide custom `fetch` implementations for advanced use cases like authentication, request interceptors, logging, and more.

## Overview

You can configure custom fetch in two ways:
1. **Globally** via `configureSymulate()` - applies to all requests
2. **Per-operation** - overrides global configuration for specific calls

## Use Cases

- 🔐 **Authentication**: Add bearer tokens, API keys, or custom headers
- 📝 **Logging**: Track all API requests and responses
- 🔄 **Retry Logic**: Implement automatic retries for failed requests
- 🌐 **Proxy/CORS**: Route requests through a proxy server
- ⚡ **Performance**: Add request timing or metrics
- 🧪 **Testing**: Mock responses or inject test data

## Global Configuration

Set a custom fetch implementation for all backend requests:

```typescript
import { configureSymulate } from '@symulate/sdk';

// Example: Add authentication headers
const customFetch = async (input: RequestInfo, init?: RequestInit) => {
  const token = localStorage.getItem('authToken');

  return fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      'Authorization': `Bearer ${token}`,
      'X-API-Version': '2.0',
    },
  });
};

configureSymulate({
  environment: 'production',
  backendBaseUrl: 'https://api.example.com',
  fetch: customFetch, // Use custom fetch globally
});
```

## Per-Operation Configuration

Override the global fetch for specific operations:

```typescript
import { defineCollection, m } from '@symulate/sdk';

const users = defineCollection({
  name: 'users',
  schema: m.object({
    id: m.string(),
    name: m.string(),
    email: m.string(),
  }),
});

// Custom fetch for a specific request
const adminFetch = async (input: RequestInfo, init?: RequestInit) => {
  return fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      'X-Admin-Token': 'secret-admin-key',
    },
  });
};

// Use custom fetch for this specific call
const user = await users.get('user-123', { fetch: adminFetch });

// Or for list operations
const result = await users.list({
  page: 1,
  fetch: adminFetch
});

// Also works for create, update, replace, delete
await users.create(
  { name: 'John', email: 'john@example.com' },
  { fetch: adminFetch }
);
```

## Advanced Examples

### 1. Request Logging

```typescript
const loggingFetch = async (input: RequestInfo, init?: RequestInit) => {
  const startTime = Date.now();

  console.log(`[API] ${init?.method || 'GET'} ${input}`);

  const response = await fetch(input, init);

  const duration = Date.now() - startTime;
  console.log(`[API] ${response.status} (${duration}ms)`);

  return response;
};

configureSymulate({ fetch: loggingFetch });
```

### 2. Automatic Retry

```typescript
const retryFetch = async (
  input: RequestInfo,
  init?: RequestInit,
  maxRetries = 3
): Promise<Response> => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(input, init);

      // Only retry on 5xx errors
      if (response.ok || response.status < 500) {
        return response;
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    // Wait before retrying (exponential backoff)
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }

  throw lastError;
};

configureSymulate({ fetch: retryFetch });
```

### 3. Request/Response Transformation

```typescript
const transformFetch = async (input: RequestInfo, init?: RequestInit) => {
  // Transform request body
  if (init?.body && typeof init.body === 'string') {
    const data = JSON.parse(init.body);
    // Add metadata to all requests
    data._metadata = {
      timestamp: new Date().toISOString(),
      clientVersion: '1.0.0',
    };
    init.body = JSON.stringify(data);
  }

  const response = await fetch(input, init);

  // Transform response (create a new Response)
  const responseData = await response.json();
  const transformedData = {
    ...responseData,
    _clientProcessed: true,
  };

  return new Response(JSON.stringify(transformedData), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

configureSymulate({ fetch: transformFetch });
```

### 4. Offline Support with Cache

```typescript
const cachingFetch = async (input: RequestInfo, init?: RequestInit) => {
  const cacheKey = `${init?.method || 'GET'}:${input}`;

  // Try cache first for GET requests
  if ((!init?.method || init.method === 'GET') && navigator.onLine === false) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.log('[Cache] Using cached response (offline)');
      return new Response(cached, { status: 200 });
    }
  }

  try {
    const response = await fetch(input, init);

    // Cache successful GET responses
    if (response.ok && (!init?.method || init.method === 'GET')) {
      const data = await response.clone().text();
      localStorage.setItem(cacheKey, data);
    }

    return response;
  } catch (error) {
    // Fallback to cache if offline
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.log('[Cache] Using cached response (network error)');
      return new Response(cached, { status: 200 });
    }
    throw error;
  }
};

configureSymulate({ fetch: cachingFetch });
```

### 5. Multi-Tenant Headers

```typescript
const multiTenantFetch = async (input: RequestInfo, init?: RequestInit) => {
  const tenantId = getCurrentTenantId(); // Your tenant resolution logic

  return fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      'X-Tenant-ID': tenantId,
    },
  });
};

configureSymulate({ fetch: multiTenantFetch });
```

### 6. Request Timing Metrics

```typescript
const metricsFetch = async (input: RequestInfo, init?: RequestInit) => {
  const startTime = performance.now();

  const response = await fetch(input, init);

  const duration = performance.now() - startTime;

  // Send metrics to analytics
  analytics.track('api_request', {
    url: input.toString(),
    method: init?.method || 'GET',
    status: response.status,
    duration,
  });

  return response;
};

configureSymulate({ fetch: metricsFetch });
```

## Priority Order

When both global and per-operation fetch are configured:

1. **Per-operation fetch** (highest priority) - `users.get(id, { fetch: customFetch })`
2. **Global fetch** - `configureSymulate({ fetch: customFetch })`
3. **Native fetch** (default) - Built-in browser/Node.js fetch

## TypeScript Support

The custom fetch must match the native fetch signature:

```typescript
type CustomFetch = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>;
```

## Integration with Other Libraries

### Axios

```typescript
import axios from 'axios';

const axiosFetch = async (input: RequestInfo, init?: RequestInit) => {
  const url = input.toString();
  const response = await axios({
    url,
    method: init?.method || 'GET',
    headers: init?.headers as any,
    data: init?.body,
  });

  return new Response(JSON.stringify(response.data), {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers as any),
  });
};

configureSymulate({ fetch: axiosFetch });
```

### ky (fetch wrapper)

```typescript
import ky from 'ky';

const kyFetch = async (input: RequestInfo, init?: RequestInit) => {
  return await ky(input, init as any);
};

configureSymulate({ fetch: kyFetch });
```

## Best Practices

1. ✅ **Always return a valid Response** - Your custom fetch must return a proper Response object
2. ✅ **Preserve the fetch signature** - Accept `(input, init)` parameters
3. ✅ **Handle errors gracefully** - Catch and handle network errors appropriately
4. ✅ **Test thoroughly** - Ensure your custom fetch works for all HTTP methods
5. ✅ **Avoid infinite loops** - Be careful with recursive fetches or retries
6. ⚠️ **Performance** - Custom fetch adds overhead, keep it lightweight
7. ⚠️ **Security** - Be cautious when adding sensitive data to headers

## Notes

- Custom fetch only applies to **production mode** backend requests
- Development mode uses Symulate's mock data generation and doesn't make real API calls
- The custom fetch receives the full URL and can modify any aspect of the request
- You can compose multiple fetch wrappers for layered functionality

## Example Project

See the full example in `examples/custom-fetch-demo` for a complete implementation.
