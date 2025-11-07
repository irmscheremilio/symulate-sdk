import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataStore } from '../dataStore';
import { m } from '../schema';
import { configureSymulate } from '../config';

describe('DataStore', () => {
  // Test schema
  const UserSchema = m.object({
    id: m.uuid(),
    name: m.string(),
    email: m.email(),
    age: m.number(),
    createdAt: m.date(),
    updatedAt: m.date(),
  });

  let store: DataStore<any>;

  beforeEach(() => {
    // Configure for testing
    configureSymulate({
      environment: 'development',
      generateMode: 'faker',
      collections: {
        persistence: { mode: 'memory' }
      }
    });

    // Create fresh store
    store = new DataStore({
      collectionName: 'users',
      schema: UserSchema,
      seedCount: 5,
      seedInstruction: 'Generate test users',
    });
  });

  describe('Initialization', () => {
    it('should initialize with seed data', async () => {
      const result = await store.query();

      expect(result.data).toHaveLength(5);
      expect(result.pagination.total).toBe(5);
      expect(result.data[0]).toHaveProperty('id');
      expect(result.data[0]).toHaveProperty('name');
      expect(result.data[0]).toHaveProperty('createdAt');
      expect(result.data[0]).toHaveProperty('updatedAt');
    });

    it('should initialize only once', async () => {
      await store.query();
      const firstData = await store.toArray();

      await store.query();
      const secondData = await store.toArray();

      expect(firstData).toEqual(secondData);
    });
  });

  describe('Insert', () => {
    it('should insert a new item', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      };

      const inserted = await store.insert(newUser as any);

      expect(inserted).toHaveProperty('id');
      expect(inserted.name).toBe('John Doe');
      expect(inserted.email).toBe('john@example.com');
      expect(inserted.age).toBe(30);
      expect(inserted).toHaveProperty('createdAt');
      expect(inserted).toHaveProperty('updatedAt');
    });

    it('should auto-generate ID if not provided', async () => {
      const newUser = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        age: 25,
      };

      const inserted = await store.insert(newUser as any);

      expect(inserted.id).toBeDefined();
      expect(typeof inserted.id).toBe('string');
      expect(inserted.id.length).toBeGreaterThan(0);
    });

    it('should preserve provided ID', async () => {
      const newUser = {
        id: 'custom-id-123',
        name: 'Custom User',
        email: 'custom@example.com',
        age: 35,
      };

      const inserted = await store.insert(newUser as any);

      expect(inserted.id).toBe('custom-id-123');
    });

    it('should add timestamps', async () => {
      const newUser = {
        name: 'Time User',
        email: 'time@example.com',
        age: 40,
      };

      const before = new Date();
      const inserted = await store.insert(newUser as any);
      const after = new Date();

      const createdAt = new Date(inserted.createdAt);
      const updatedAt = new Date(inserted.updatedAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Query', () => {
    it('should return all items by default', async () => {
      const result = await store.query();

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(20);
    });

    it('should support pagination', async () => {
      // Add enough items for pagination
      for (let i = 0; i < 25; i++) {
        await store.insert({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          age: 20 + i,
        } as any);
      }

      const page1 = await store.query({ page: 1, limit: 10 });
      expect(page1.data).toHaveLength(10);
      expect(page1.pagination.page).toBe(1);
      expect(page1.pagination.totalPages).toBeGreaterThan(1);

      const page2 = await store.query({ page: 2, limit: 10 });
      expect(page2.data).toHaveLength(10);
      expect(page2.pagination.page).toBe(2);

      // Pages should have different data
      expect(page1.data[0].id).not.toBe(page2.data[0].id);
    });

    it('should support sorting ascending', async () => {
      const result = await store.query({
        sortBy: 'age',
        sortOrder: 'asc',
      });

      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].age).toBeGreaterThanOrEqual(result.data[i - 1].age);
      }
    });

    it('should support sorting descending', async () => {
      const result = await store.query({
        sortBy: 'age',
        sortOrder: 'desc',
      });

      for (let i = 1; i < result.data.length; i++) {
        expect(result.data[i].age).toBeLessThanOrEqual(result.data[i - 1].age);
      }
    });

    it('should support filtering with exact match', async () => {
      await store.insert({
        name: 'Filter Test',
        email: 'filter@example.com',
        age: 99,
      } as any);

      const result = await store.query({
        filter: { age: 99 }
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(item => {
        expect(item.age).toBe(99);
      });
    });

    it('should support filtering with operators', async () => {
      await store.insert({ name: 'Young', email: 'young@example.com', age: 18 } as any);
      await store.insert({ name: 'Old', email: 'old@example.com', age: 65 } as any);

      const result = await store.query({
        filter: { age: { $gt: 60 } }
      });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(item => {
        expect(item.age).toBeGreaterThan(60);
      });
    });
  });

  describe('FindById', () => {
    it('should find item by ID', async () => {
      const newUser = await store.insert({
        name: 'Find Me',
        email: 'findme@example.com',
        age: 50,
      } as any);

      const found = await store.findById(newUser.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(newUser.id);
      expect(found?.name).toBe('Find Me');
    });

    it('should return null for non-existent ID', async () => {
      const found = await store.findById('non-existent-id');

      expect(found).toBeNull();
    });
  });

  describe('Update', () => {
    it('should update existing item partially', async () => {
      const user = await store.insert({
        name: 'Original Name',
        email: 'original@example.com',
        age: 30,
      } as any);

      const updated = await store.update(user.id, {
        name: 'Updated Name',
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.email).toBe('original@example.com'); // Unchanged
      expect(updated?.age).toBe(30); // Unchanged
    });

    it('should update timestamp on update', async () => {
      const user = await store.insert({
        name: 'User',
        email: 'user@example.com',
        age: 25,
      } as any);

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await store.update(user.id, {
        age: 26,
      });

      expect(updated?.updatedAt).not.toBe(originalUpdatedAt);
      expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThan(new Date(originalUpdatedAt).getTime());
    });

    it('should preserve ID and createdAt on update', async () => {
      const user = await store.insert({
        name: 'User',
        email: 'user@example.com',
        age: 25,
      } as any);

      const updated = await store.update(user.id, {
        name: 'New Name',
        age: 30,
      });

      expect(updated?.id).toBe(user.id);
      expect(updated?.createdAt).toBe(user.createdAt);
    });

    it('should return null for non-existent ID', async () => {
      const updated = await store.update('non-existent-id', {
        name: 'New Name',
      });

      expect(updated).toBeNull();
    });
  });

  describe('Replace', () => {
    it('should replace entire item', async () => {
      const user = await store.insert({
        name: 'Original',
        email: 'original@example.com',
        age: 30,
      } as any);

      const replaced = await store.replace(user.id, {
        name: 'Replaced',
        email: 'replaced@example.com',
        age: 40,
      } as any);

      expect(replaced).not.toBeNull();
      expect(replaced?.name).toBe('Replaced');
      expect(replaced?.email).toBe('replaced@example.com');
      expect(replaced?.age).toBe(40);
    });

    it('should preserve ID and createdAt on replace', async () => {
      const user = await store.insert({
        name: 'User',
        email: 'user@example.com',
        age: 25,
      } as any);

      const replaced = await store.replace(user.id, {
        name: 'New User',
        email: 'new@example.com',
        age: 35,
      } as any);

      expect(replaced?.id).toBe(user.id);
      expect(replaced?.createdAt).toBe(user.createdAt);
    });

    it('should return null for non-existent ID', async () => {
      const replaced = await store.replace('non-existent-id', {
        name: 'New',
        email: 'new@example.com',
        age: 25,
      } as any);

      expect(replaced).toBeNull();
    });
  });

  describe('Delete', () => {
    it('should delete existing item', async () => {
      const user = await store.insert({
        name: 'To Delete',
        email: 'delete@example.com',
        age: 30,
      } as any);

      const deleted = await store.delete(user.id);

      expect(deleted).toBe(true);

      const found = await store.findById(user.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent ID', async () => {
      const deleted = await store.delete('non-existent-id');

      expect(deleted).toBe(false);
    });

    it('should reduce total count after deletion', async () => {
      const before = await store.count();

      const user = await store.insert({
        name: 'To Delete',
        email: 'delete@example.com',
        age: 30,
      } as any);

      await store.delete(user.id);

      const after = await store.count();
      expect(after).toBe(before);
    });
  });

  describe('Exists', () => {
    it('should return true for existing item', async () => {
      const user = await store.insert({
        name: 'Exists',
        email: 'exists@example.com',
        age: 30,
      } as any);

      const exists = await store.exists(user.id);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent item', async () => {
      const exists = await store.exists('non-existent-id');

      expect(exists).toBe(false);
    });
  });

  describe('Count', () => {
    it('should count all items', async () => {
      const count = await store.count();

      expect(count).toBe(5); // Initial seed count
    });

    it('should count with filter', async () => {
      await store.insert({ name: 'Special', email: 'special1@example.com', age: 100 } as any);
      await store.insert({ name: 'Special', email: 'special2@example.com', age: 100 } as any);

      const count = await store.count({ age: 100 });

      expect(count).toBe(2);
    });
  });

  describe('Clear', () => {
    it('should clear all data', async () => {
      const beforeCount = await store.count();
      expect(beforeCount).toBeGreaterThan(0);

      await store.clear();

      const afterCount = await store.count();
      expect(afterCount).toBe(0);
    });
  });

  describe('ToArray', () => {
    it('should export all data as array', async () => {
      const array = await store.toArray();

      expect(Array.isArray(array)).toBe(true);
      expect(array.length).toBe(5); // Initial seed count
      expect(array[0]).toHaveProperty('id');
      expect(array[0]).toHaveProperty('name');
    });

    it('should include newly inserted items', async () => {
      const user = await store.insert({
        name: 'New User',
        email: 'new@example.com',
        age: 30,
      } as any);

      const array = await store.toArray();

      const found = array.find(item => item.id === user.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('New User');
    });
  });
});
