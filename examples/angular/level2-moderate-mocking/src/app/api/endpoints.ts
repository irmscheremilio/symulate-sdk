import { defineEndpoint, m } from '@symulate/sdk';

// Import schemas
import { UserSchema, type User } from './schemas/user.schema';
import { PostSchema, type Post } from './schemas/post.schema';
import { CommentSchema, type Comment } from './schemas/comment.schema';

// Import mock configurations
import { userMockConfig } from './mocks/user.mock';
import { postMockConfig } from './mocks/post.mock';
import { commentMockConfig } from './mocks/comment.mock';

// ============================================
// LEVEL 2: MODERATE ENDPOINT MOCKING
// ============================================
// This demonstrates better separation of concerns:
// - Schemas in separate files
// - Mock configurations in separate files
// - Related entities with foreign keys
// - More realistic data relationships

// ============================================
// USER ENDPOINTS
// ============================================

export const getUsers = defineEndpoint<User[]>({
  path: '/api/users',
  method: 'GET',
  schema: m.array(UserSchema),
  mock: userMockConfig,
});

export const getUser = defineEndpoint<User>({
  path: '/api/users/:id',
  method: 'GET',
  schema: UserSchema,
  params: [
    {
      name: 'id',
      location: 'path',
      required: true,
      schema: m.uuid(),
    },
  ],
});

// ============================================
// POST ENDPOINTS
// ============================================

export const getPosts = defineEndpoint<Post[]>({
  path: '/api/posts',
  method: 'GET',
  schema: m.array(PostSchema),
  mock: postMockConfig,
});

export const getPost = defineEndpoint<Post>({
  path: '/api/posts/:id',
  method: 'GET',
  schema: PostSchema,
  params: [
    {
      name: 'id',
      location: 'path',
      required: true,
      schema: m.uuid(),
    },
  ],
});

// Get posts by user
export const getUserPosts = defineEndpoint<Post[]>({
  path: '/api/users/:userId/posts',
  method: 'GET',
  schema: m.array(PostSchema),
  params: [
    {
      name: 'userId',
      location: 'path',
      required: true,
      schema: m.uuid(),
    },
  ],
});

// ============================================
// COMMENT ENDPOINTS
// ============================================

export const getComments = defineEndpoint<Comment[]>({
  path: '/api/comments',
  method: 'GET',
  schema: m.array(CommentSchema),
  mock: commentMockConfig,
});

export const getComment = defineEndpoint<Comment>({
  path: '/api/comments/:id',
  method: 'GET',
  schema: CommentSchema,
  params: [
    {
      name: 'id',
      location: 'path',
      required: true,
      schema: m.uuid(),
    },
  ],
});

// Get comments for a post
export const getPostComments = defineEndpoint<Comment[]>({
  path: '/api/posts/:postId/comments',
  method: 'GET',
  schema: m.array(CommentSchema),
  params: [
    {
      name: 'postId',
      location: 'path',
      required: true,
      schema: m.uuid(),
    },
  ],
});
