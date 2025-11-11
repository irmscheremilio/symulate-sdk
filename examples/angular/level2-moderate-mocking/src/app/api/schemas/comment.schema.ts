import { m, type Infer } from '@symulate/sdk';

// ============================================
// COMMENT SCHEMA
// ============================================
// Related to Post and User - demonstrates nested relations

export const CommentSchema = m.object({
  id: m.uuid(),
  postId: m.uuid(), // Foreign key to Post
  userId: m.uuid(), // Foreign key to User
  content: m.lorem.paragraph(),
  createdAt: m.date(),
  updatedAt: m.date(),
  likeCount: m.number(),
  // Optional parent comment ID for nested/threaded comments
  parentCommentId: m.optional(m.uuid()),
});

export type Comment = Infer<typeof CommentSchema>;
