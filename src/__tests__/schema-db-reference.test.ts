import { describe, it, expect } from 'vitest';
import { m } from '../schema';

describe('Schema - Database References', () => {
  describe('m.db() - Basic Format Support', () => {
    it('should accept 2-part format (table.column)', () => {
      const field = m.db('users.email', 'User email address');

      expect(field._meta.dbReference).toBeDefined();
      expect(field._meta.dbReference?.table).toBe('users');
      expect(field._meta.dbReference?.column).toBe('email');
      expect(field._meta.dbReference?.schema).toBeUndefined();
      expect(field._meta.description).toBe('User email address');
    });

    it('should accept 3-part format (schema.table.column)', () => {
      const field = m.db('public.users.email', 'User email address');

      expect(field._meta.dbReference).toBeDefined();
      expect(field._meta.dbReference?.schema).toBe('public');
      expect(field._meta.dbReference?.table).toBe('users');
      expect(field._meta.dbReference?.column).toBe('email');
      expect(field._meta.description).toBe('User email address');
    });

    it('should handle Postgres system schemas', () => {
      const field = m.db('systemdata.bp.bp_common_name', 'Company name and location');

      expect(field._meta.dbReference).toBeDefined();
      expect(field._meta.dbReference?.schema).toBe('systemdata');
      expect(field._meta.dbReference?.table).toBe('bp');
      expect(field._meta.dbReference?.column).toBe('bp_common_name');
    });

    it('should work without description parameter', () => {
      const field1 = m.db('users.id');
      const field2 = m.db('public.users.id');

      expect(field1._meta.dbReference).toBeDefined();
      expect(field1._meta.description).toBeUndefined();

      expect(field2._meta.dbReference).toBeDefined();
      expect(field2._meta.description).toBeUndefined();
    });
  });

  describe('m.db() - Error Handling', () => {
    it('should throw error for 1-part format (no dot)', () => {
      expect(() => {
        m.db('users');
      }).toThrow('Invalid db reference format');
    });

    it('should throw error for 4-part format (too many dots)', () => {
      expect(() => {
        m.db('db.schema.table.column');
      }).toThrow('Invalid db reference format');
    });

    it('should throw error for empty string', () => {
      expect(() => {
        m.db('');
      }).toThrow('Invalid db reference format');
    });

    it('should include the invalid input in error message', () => {
      try {
        m.db('invalid');
      } catch (error: any) {
        expect(error.message).toContain('invalid');
        expect(error.message).toContain('Expected "table.column" or "schema.table.column"');
      }
    });
  });

  describe('m.db() - Type Inference', () => {
    it('should return StringSchema by default', () => {
      const field = m.db('users.name');

      expect(field._type).toBe('');
      expect(field._meta.schemaType).toBe('string');
    });

    it('should preserve description in schema', () => {
      const field = m.db('products.price', 'Product price in USD');

      expect(field._meta.description).toBe('Product price in USD');
    });
  });

  describe('m.db() - Integration with Object Schema', () => {
    it('should work within object schema', () => {
      const UserSchema = m.object({
        id: m.db('users.id', 'User ID'),
        email: m.db('users.email', 'User email'),
        name: m.db('users.name', 'User full name'),
      });

      expect(UserSchema._shape.id._meta.dbReference).toBeDefined();
      expect(UserSchema._shape.id._meta.dbReference?.table).toBe('users');
      expect(UserSchema._shape.id._meta.dbReference?.column).toBe('id');

      expect(UserSchema._shape.email._meta.dbReference).toBeDefined();
      expect(UserSchema._shape.name._meta.dbReference).toBeDefined();
    });

    it('should work with Postgres schemas in object', () => {
      const CompanySchema = m.object({
        id: m.db('public.companies.id', 'Company ID'),
        name: m.db('systemdata.bp.bp_common_name', 'Company name'),
        revenue: m.db('analytics.metrics.annual_revenue', 'Annual revenue'),
      });

      expect(CompanySchema._shape.id._meta.dbReference?.schema).toBe('public');
      expect(CompanySchema._shape.name._meta.dbReference?.schema).toBe('systemdata');
      expect(CompanySchema._shape.revenue._meta.dbReference?.schema).toBe('analytics');
    });

    it('should allow mixing db references with regular schema types', () => {
      const MixedSchema = m.object({
        id: m.uuid(),
        dbId: m.db('users.id', 'Database ID'),
        email: m.email(),
        dbEmail: m.db('users.email', 'Database email'),
        createdAt: m.date(),
      });

      expect(MixedSchema._shape.id._meta.dbReference).toBeUndefined();
      expect(MixedSchema._shape.dbId._meta.dbReference).toBeDefined();
      expect(MixedSchema._shape.email._meta.dbReference).toBeUndefined();
      expect(MixedSchema._shape.dbEmail._meta.dbReference).toBeDefined();
      expect(MixedSchema._shape.createdAt._meta.dbReference).toBeUndefined();
    });
  });

  describe('m.db() - Common Database Scenarios', () => {
    it('should handle common PostgreSQL public schema tables', () => {
      const fields = [
        m.db('public.users.id'),
        m.db('public.posts.title'),
        m.db('public.comments.content'),
      ];

      fields.forEach(field => {
        expect(field._meta.dbReference?.schema).toBe('public');
      });
    });

    it('should handle snake_case column names', () => {
      const field = m.db('users.created_at', 'Creation timestamp');

      expect(field._meta.dbReference?.column).toBe('created_at');
    });

    it('should handle camelCase table names', () => {
      const field = m.db('userProfiles.firstName');

      expect(field._meta.dbReference?.table).toBe('userProfiles');
      expect(field._meta.dbReference?.column).toBe('firstName');
    });

    it('should handle complex schema names', () => {
      const examples = [
        { input: 'auth_schema.user_roles.role_id', schema: 'auth_schema', table: 'user_roles', column: 'role_id' },
        { input: 'analytics_v2.events.event_type', schema: 'analytics_v2', table: 'events', column: 'event_type' },
        { input: 'legacy.old_users.user_name', schema: 'legacy', table: 'old_users', column: 'user_name' },
      ];

      examples.forEach(({ input, schema, table, column }) => {
        const field = m.db(input);
        expect(field._meta.dbReference?.schema).toBe(schema);
        expect(field._meta.dbReference?.table).toBe(table);
        expect(field._meta.dbReference?.column).toBe(column);
      });
    });
  });

  describe('m.db() - Edge Cases', () => {
    it('should handle single character parts', () => {
      const field = m.db('a.b.c');

      expect(field._meta.dbReference?.schema).toBe('a');
      expect(field._meta.dbReference?.table).toBe('b');
      expect(field._meta.dbReference?.column).toBe('c');
    });

    it('should handle numeric characters in names', () => {
      const field = m.db('schema2.table3.column4');

      expect(field._meta.dbReference?.schema).toBe('schema2');
      expect(field._meta.dbReference?.table).toBe('table3');
      expect(field._meta.dbReference?.column).toBe('column4');
    });

    it('should preserve exact casing', () => {
      const field = m.db('MySchema.MyTable.MyColumn');

      expect(field._meta.dbReference?.schema).toBe('MySchema');
      expect(field._meta.dbReference?.table).toBe('MyTable');
      expect(field._meta.dbReference?.column).toBe('MyColumn');
    });
  });

  describe('m.db() - Serialization', () => {
    it('should serialize dbReference correctly for 2-part format', () => {
      const field = m.db('users.email', 'Email address');
      const serialized = JSON.parse(JSON.stringify(field));

      expect(serialized._meta.dbReference).toEqual({
        table: 'users',
        column: 'email',
      });
    });

    it('should serialize dbReference correctly for 3-part format', () => {
      const field = m.db('public.users.email', 'Email address');
      const serialized = JSON.parse(JSON.stringify(field));

      expect(serialized._meta.dbReference).toEqual({
        schema: 'public',
        table: 'users',
        column: 'email',
      });
    });

    it('should serialize complex schema with multiple db references', () => {
      const schema = m.object({
        id: m.db('users.id'),
        name: m.db('public.users.name'),
        company: m.db('systemdata.bp.bp_common_name'),
      });

      const serialized = JSON.parse(JSON.stringify(schema));

      expect(serialized._shape.id._meta.dbReference).toEqual({
        table: 'users',
        column: 'id',
      });
      expect(serialized._shape.name._meta.dbReference).toEqual({
        schema: 'public',
        table: 'users',
        column: 'name',
      });
      expect(serialized._shape.company._meta.dbReference).toEqual({
        schema: 'systemdata',
        table: 'bp',
        column: 'bp_common_name',
      });
    });
  });
});
