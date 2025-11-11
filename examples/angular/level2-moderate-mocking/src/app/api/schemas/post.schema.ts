import { m, type Infer } from '@symulate/sdk';

// ============================================
// POST SCHEMA
// ============================================
// Related to User - demonstrates entity relations

export const PostSchema = m.object({
  id: m.uuid(),
  userId: m.uuid(), // Foreign key to User
  title: m.lorem.sentence(),
  content: m.lorem.paragraph(),
  excerpt: m.optional(m.lorem.paragraph()),
  coverImage: m.optional(m.url()),
  tags: m.optional(m.array(m.lorem.word())),
  publishedAt: m.date(),
  updatedAt: m.date(),
  viewCount: m.number(),
  likeCount: m.number(),
  status: m.string(), // 'draft' | 'published' | 'archived'
});

export type Post = Infer<typeof PostSchema>;
