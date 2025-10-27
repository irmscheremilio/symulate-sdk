/**
 * Path Parameter Validation Examples
 *
 * This file demonstrates compile-time TypeScript validation of path parameters.
 * Uncomment the error examples to see TypeScript catch mismatched parameters.
 */

import { defineEndpoint, m } from '@symulate/sdk';

// ✅ VALID: Path parameter "id" is defined and exists in path
export const getUser = defineEndpoint({
  path: '/api/users/:id',
  method: 'GET',
  params: [
    {
      name: 'id',
      location: 'path',
      required: true,
      schema: m.uuid(),
      description: 'User ID',
    },
  ] as const, // Important: Use 'as const' for validation to work
  schema: m.object({
    id: m.uuid(),
    name: m.string(),
    email: m.email(),
  }),
});

// ✅ VALID: Multiple path parameters
export const getComment = defineEndpoint({
  path: '/api/posts/:postId/comments/:commentId',
  method: 'GET',
  params: [
    {
      name: 'postId',
      location: 'path',
      required: true,
      schema: m.uuid(),
      description: 'Post ID',
    },
    {
      name: 'commentId',
      location: 'path',
      required: true,
      schema: m.uuid(),
      description: 'Comment ID',
    },
  ] as const,
  schema: m.object({
    id: m.uuid(),
    content: m.string(),
  }),
});

// ✅ VALID: Mixed parameters (path + query + header + body)
export const createOffer = defineEndpoint({
  path: '/api/organizations/:orgId/offers',
  method: 'POST',
  params: [
    {
      name: 'orgId',
      location: 'path',
      required: true,
      schema: m.uuid(),
      description: 'Organization ID',
    },
    {
      name: 'notify',
      location: 'query',
      required: false,
      schema: m.boolean(),
      description: 'Send notification email',
    },
    {
      name: 'Authorization',
      location: 'header',
      required: true,
      schema: m.string(),
      description: 'Bearer token',
    },
    {
      name: 'customer_name',
      location: 'body',
      required: true,
      schema: m.string(),
      description: 'Customer name',
    },
  ] as const,
  schema: m.object({
    id: m.uuid(),
    customer_name: m.string(),
    status: m.string(),
  }),
});

// ✅ VALID: No path parameters
export const listUsers = defineEndpoint({
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
  mock: { count: 10 },
});

// ============================================================================
// ❌ ERROR EXAMPLES (Uncomment to see TypeScript errors)
// ============================================================================

/*
// ❌ TypeScript Error: Path parameter 'userId' is defined but not in path
// The path has ':id' but params defines 'userId'
export const invalidParamName = defineEndpoint({
  path: '/api/users/:id',
  method: 'GET',
  params: [
    {
      name: 'userId', // ❌ Should be 'id'
      location: 'path',
      schema: m.uuid(),
    },
  ] as const,
  schema: m.object({
    id: m.uuid(),
    name: m.string(),
  }),
});
*/

/*
// ❌ TypeScript Error: Path parameter 'id' is defined but path doesn't have ':id'
export const missingPathParam = defineEndpoint({
  path: '/api/users', // ❌ Missing ':id'
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
*/

/*
// ❌ TypeScript Error: Path parameter 'commentId' defined but not in path
export const missingSecondParam = defineEndpoint({
  path: '/api/posts/:postId/comments', // ❌ Missing ':commentId'
  method: 'GET',
  params: [
    {
      name: 'postId',
      location: 'path',
      schema: m.uuid(),
    },
    {
      name: 'commentId', // ❌ Not in path
      location: 'path',
      schema: m.uuid(),
    },
  ] as const,
  schema: m.object({
    id: m.uuid(),
    content: m.string(),
  }),
});
*/

// ============================================================================
// Usage Examples
// ============================================================================

async function examples() {
  // Valid usage
  const user = await getUser({ id: '123e4567-e89b-12d3-a456-426614174000' });
  console.log(user);

  const comment = await getComment({
    postId: 'post-123',
    commentId: 'comment-456',
  });
  console.log(comment);

  const offer = await createOffer({
    orgId: 'org-789',
    notify: true,
    Authorization: 'Bearer token-abc',
    customer_name: 'Acme Corp',
  });
  console.log(offer);

  const users = await listUsers({ page: 1 });
  console.log(users);
}
