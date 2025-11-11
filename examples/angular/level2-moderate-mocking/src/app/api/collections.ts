import { defineCollection } from '@symulate/sdk';

// Import schemas
import { UserSchema } from './schemas/user.schema';
import { PostSchema } from './schemas/post.schema';
import { CommentSchema } from './schemas/comment.schema';

// Import mock configurations
import { userMockConfig } from './mocks/user.mock';
import { postMockConfig } from './mocks/post.mock';
import { commentMockConfig } from './mocks/comment.mock';

// ============================================
// LEVEL 2: MODERATE COMPLEXITY WITH COLLECTIONS
// ============================================
// This demonstrates stateful CRUD with Collections API:
// - Schemas in separate files
// - Mock configurations in separate files
// - Stateful data with CRUD operations
// - Better separation of concerns

// ============================================
// COLLECTIONS
// ============================================

export const users = defineCollection({
  name: 'users',
  basePath: '/api/users',
  schema: UserSchema,
  seedCount: userMockConfig.count,
  seedInstruction: userMockConfig.instruction,
});

export const posts = defineCollection({
  name: 'posts',
  basePath: '/api/posts',
  schema: PostSchema,
  seedCount: postMockConfig.count,
  seedInstruction: postMockConfig.instruction,
});

export const comments = defineCollection({
  name: 'comments',
  basePath: '/api/comments',
  schema: CommentSchema,
  seedCount: commentMockConfig.count,
  seedInstruction: commentMockConfig.instruction,
});
