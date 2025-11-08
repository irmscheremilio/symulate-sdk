import { describe, it, expect, beforeEach, vi } from 'vitest';
import { defineCollection } from '../defineCollection';
import { m } from '../schema';
import { configureSymulate } from '../config';
import type { Infer } from '../schema';

// NOTE: AutoGenerate only works in production mode (via edge function)
// These tests require a running Supabase edge function
// They are integration tests and should be run separately
describe.skip('AutoGenerate Fields (Integration Tests)', () => {
  const PostSchema = m.object({
    id: m.uuid(),
    title: m.string(),
    slug: m.string(),
    content: m.string(),
    author: m.object({
      name: m.string(),
      email: m.string(),
    }),
    authorUsername: m.string(),
    viewCount: m.number(),
    createdAt: m.date(),
    updatedAt: m.date(),
  });

  type Post = Infer<typeof PostSchema>;

  beforeEach(() => {
    // Configure for testing - use production mode to test autoGenerate
    // AutoGenerate only works via edge function (production/stateful mode)
    configureSymulate({
      environment: 'production',
      symulateApiKey: 'sym_live_test',
      projectId: 'test-project-id',
      backendBaseUrl: 'http://localhost:3000', // Will be mocked
      collections: {
        persistence: { mode: 'memory' }
      }
    });
  });

  describe('Built-in Generators', () => {
    it('should auto-generate UUID field', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-uuid-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        authorUsername: 'john',
        viewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(created.id).toBeDefined();
      expect(typeof created.id).toBe('string');
      expect(created.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should auto-generate timestamp fields', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-timestamp-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
          createdAt: 'timestamp',
          updatedAt: {
            generator: 'timestamp',
            onCreate: true,
            onUpdate: true,
          }
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        authorUsername: 'john',
        viewCount: 0,
      });

      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();
      expect(new Date(created.createdAt).getTime()).toBeGreaterThan(0);
      expect(new Date(created.updatedAt).getTime()).toBeGreaterThan(0);
    });

    it('should generate nanoid', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-nanoid-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'nanoid',
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        authorUsername: 'john',
        viewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(created.id).toBeDefined();
      expect(typeof created.id).toBe('string');
      expect(created.id.length).toBe(21);
    });

    it('should generate cuid', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-cuid-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'cuid',
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        authorUsername: 'john',
        viewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(created.id).toBeDefined();
      expect(typeof created.id).toBe('string');
      expect(created.id).toMatch(/^c[a-z0-9]+$/i);
    });
  });

  describe('Custom Generator Functions', () => {
    it('should support custom generator functions', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-custom-gen-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
          authorUsername: {
            generator: (data: any) => data.author.email.split('@')[0],
            dependsOn: ['author.email']
          },
          createdAt: 'timestamp',
          updatedAt: 'timestamp',
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        author: { name: 'John Doe', email: 'johndoe@example.com' },
        viewCount: 0,
      });

      expect(created.authorUsername).toBe('johndoe');
    });

    it('should support async custom generators', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-async-gen-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
          viewCount: {
            generator: async (data: any) => {
              // Simulate async operation
              return Promise.resolve(100);
            }
          },
          createdAt: 'timestamp',
          updatedAt: 'timestamp',
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        authorUsername: 'john',
      });

      expect(created.viewCount).toBe(100);
    });
  });

  describe('Shorthand Syntax', () => {
    it('should support shorthand syntax for built-in generators', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-shorthand-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
          createdAt: 'timestamp',
          updatedAt: 'timestamp',
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        authorUsername: 'john',
        viewCount: 0,
      });

      expect(created.id).toBeDefined();
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();
    });
  });

  describe('Dependencies', () => {
    it('should only generate field if dependencies are present', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-deps-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
          authorUsername: {
            generator: (data: any) => data.author.email.split('@')[0],
            dependsOn: ['author.email']
          },
          createdAt: 'timestamp',
          updatedAt: 'timestamp',
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        viewCount: 0,
      });

      expect(created.authorUsername).toBe('john');
    });

    it('should skip generation if dependencies are missing', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-missing-deps-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
          slug: {
            generator: (data: any) => data.title.toLowerCase().replace(/\s+/g, '-'),
            dependsOn: ['title']
          },
          createdAt: 'timestamp',
          updatedAt: 'timestamp',
        }
      });

      const created = await posts.create({
        // No title provided
        slug: 'manual-slug',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        authorUsername: 'john',
        viewCount: 0,
      });

      // Since title is missing, slug generator won't run
      // User-provided slug should be used
      expect(created.slug).toBe('manual-slug');
    });
  });

  describe('onCreate and onUpdate', () => {
    it('should only generate on create when onCreate is true', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-oncreate-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
          createdAt: {
            generator: 'timestamp',
            onCreate: true,
            onUpdate: false,
          },
          updatedAt: {
            generator: 'timestamp',
            onCreate: true,
            onUpdate: true,
          }
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        authorUsername: 'john',
        viewCount: 0,
      });

      const originalCreatedAt = created.createdAt;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await posts.update(created.id, {
        title: 'Updated Post'
      });

      // createdAt should NOT change (onCreate only)
      expect(updated.createdAt).toBe(originalCreatedAt);

      // updatedAt should change (onCreate and onUpdate)
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });

    it('should regenerate on update when onUpdate is true', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-onupdate-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
          createdAt: 'timestamp',
          updatedAt: {
            generator: 'timestamp',
            onCreate: true,
            onUpdate: true,
          }
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        authorUsername: 'john',
        viewCount: 0,
      });

      const originalUpdatedAt = created.updatedAt;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await posts.update(created.id, {
        title: 'Updated Post'
      });

      // updatedAt should be different
      expect(updated.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('Cache Option', () => {
    it('should not regenerate cached fields on update', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-cache-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
          slug: {
            generator: (data: any) => data.title.toLowerCase().replace(/\s+/g, '-'),
            dependsOn: ['title'],
            onCreate: true,
            onUpdate: true,
            cache: true, // Don't regenerate even if onUpdate is true
          },
          createdAt: 'timestamp',
          updatedAt: {
            generator: 'timestamp',
            onCreate: true,
            onUpdate: true,
          }
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        authorUsername: 'john',
        viewCount: 0,
      });

      const originalSlug = created.slug;

      const updated = await posts.update(created.id, {
        title: 'Completely Different Title'
      });

      // Slug should NOT change because cache is true
      expect(updated.slug).toBe(originalSlug);
    });
  });

  describe('User Data Precedence', () => {
    it('should allow user to override auto-generated fields', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-override-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
          viewCount: {
            generator: () => 0
          },
          createdAt: 'timestamp',
          updatedAt: 'timestamp',
        }
      });

      const created = await posts.create({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Content',
        author: { name: 'John', email: 'john@example.com' },
        authorUsername: 'john',
        viewCount: 999, // User provides their own value
      });

      // User-provided value should win
      expect(created.viewCount).toBe(999);
    });
  });

  describe('Integration Test', () => {
    it('should handle complete auto-generate workflow', async () => {
      const posts = defineCollection<Post>({
        name: 'posts-integration-test',
        schema: PostSchema,
        autoGenerate: {
          id: 'uuid',
          slug: {
            generator: (data: any) => data.title.toLowerCase().replace(/\s+/g, '-'),
            dependsOn: ['title'],
            onCreate: true,
            onUpdate: false,
            cache: true,
          },
          authorUsername: {
            generator: (data: any) => data.author.email.split('@')[0],
            dependsOn: ['author.email'],
            onCreate: true,
            onUpdate: true,
          },
          viewCount: {
            generator: () => 0,
            onCreate: true,
            onUpdate: false,
          },
          createdAt: {
            generator: 'timestamp',
            onCreate: true,
            onUpdate: false,
          },
          updatedAt: {
            generator: 'timestamp',
            onCreate: true,
            onUpdate: true,
          }
        }
      });

      // Create post with minimal data
      const created = await posts.create({
        title: 'My First Blog Post',
        content: 'This is the content of my blog post.',
        author: {
          name: 'Jane Doe',
          email: 'jane.doe@example.com'
        }
      });

      // Verify all fields were auto-generated
      expect(created.id).toBeDefined();
      expect(created.slug).toBe('my-first-blog-post');
      expect(created.authorUsername).toBe('jane.doe');
      expect(created.viewCount).toBe(0);
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();

      // Update the post
      const updated = await posts.update(created.id, {
        title: 'My Updated Blog Post',
        author: {
          name: 'Jane Smith',
          email: 'jane.smith@example.com'
        }
      });

      // slug should NOT change (cache: true)
      expect(updated.slug).toBe('my-first-blog-post');

      // authorUsername SHOULD change (onUpdate: true)
      expect(updated.authorUsername).toBe('jane.smith');

      // viewCount should NOT change (onUpdate: false)
      expect(updated.viewCount).toBe(0);

      // createdAt should NOT change (onUpdate: false)
      expect(updated.createdAt).toBe(created.createdAt);

      // updatedAt SHOULD change (onUpdate: true)
      expect(updated.updatedAt).not.toBe(created.updatedAt);
    });
  });
});
