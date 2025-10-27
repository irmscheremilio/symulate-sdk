import { defineEndpoint, m } from '../index';

// This file demonstrates TypeScript compile-time validation of path parameters

describe('Path Parameter Validation', () => {
  it('should allow valid path parameter configuration', () => {
    // ✅ Valid: path parameter "id" is defined and exists in path
    const validEndpoint = defineEndpoint({
      path: '/api/users/:id',
      method: 'GET',
      params: [
        {
          name: 'id',
          location: 'path',
          schema: m.uuid(),
        },
      ] as const,
      schema: m.object({
        id: m.uuid(),
        name: m.string(),
      }),
    });

    expect(validEndpoint).toBeDefined();
  });

  it('should allow multiple path parameters', () => {
    // ✅ Valid: both path parameters are defined and exist in path
    const validEndpoint = defineEndpoint({
      path: '/api/posts/:postId/comments/:commentId',
      method: 'GET',
      params: [
        {
          name: 'postId',
          location: 'path',
          schema: m.uuid(),
        },
        {
          name: 'commentId',
          location: 'path',
          schema: m.uuid(),
        },
      ] as const,
      schema: m.object({
        id: m.uuid(),
        content: m.string(),
      }),
    });

    expect(validEndpoint).toBeDefined();
  });

  it('should allow endpoints without path parameters', () => {
    // ✅ Valid: no path parameters defined
    const validEndpoint = defineEndpoint({
      path: '/api/users',
      method: 'GET',
      schema: m.object({
        id: m.uuid(),
        name: m.string(),
      }),
    });

    expect(validEndpoint).toBeDefined();
  });

  it('should allow query parameters without path validation', () => {
    // ✅ Valid: only query parameters, no path parameter validation needed
    const validEndpoint = defineEndpoint({
      path: '/api/users',
      method: 'GET',
      params: [
        {
          name: 'page',
          location: 'query',
          schema: m.number(),
        },
      ] as const,
      schema: m.object({
        id: m.uuid(),
        name: m.string(),
      }),
    });

    expect(validEndpoint).toBeDefined();
  });

  // The following examples would cause TypeScript compile errors:
  // Uncomment them to see the errors in your IDE

  /*
  it('should reject path parameter not in path', () => {
    // ❌ TypeScript Error: Path parameter 'userId' is defined but not in path
    const invalidEndpoint = defineEndpoint({
      path: '/api/users',
      method: 'GET',
      params: [
        {
          name: 'userId',
          location: 'path',
          schema: m.uuid(),
        },
      ] as const,
      schema: m.object({
        id: m.uuid(),
        name: m.string(),
      }),
    });
  });
  */

  /*
  it('should reject mismatched path parameter name', () => {
    // ❌ TypeScript Error: Path parameter 'userId' is defined but path has ':id'
    const invalidEndpoint = defineEndpoint({
      path: '/api/users/:id',
      method: 'GET',
      params: [
        {
          name: 'userId',
          location: 'path',
          schema: m.uuid(),
        },
      ] as const,
      schema: m.object({
        id: m.uuid(),
        name: m.string(),
      }),
    });
  });
  */

  /*
  it('should reject missing path parameter in path', () => {
    // ❌ TypeScript Error: Path parameter 'commentId' is defined but not in path
    const invalidEndpoint = defineEndpoint({
      path: '/api/posts/:postId/comments',
      method: 'GET',
      params: [
        {
          name: 'postId',
          location: 'path',
          schema: m.uuid(),
        },
        {
          name: 'commentId',
          location: 'path',
          schema: m.uuid(),
        },
      ] as const,
      schema: m.object({
        id: m.uuid(),
        content: m.string(),
      }),
    });
  });
  */
});
