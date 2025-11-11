/**
 * Database table schema generation
 * Auto-generates schemas from database tables with type safety
 */

import type { BaseSchema, ObjectSchema } from './schema';
import { m } from './schema';

export interface DbTableOptions {
  /**
   * Only include these fields
   */
  only?: string[];

  /**
   * Exclude these fields
   */
  exclude?: string[];
}

export interface ExtendableSchema<T extends Record<string, any>> extends ObjectSchema<T> {
  /**
   * Extend the schema with additional virtual fields
   */
  extend<E extends Record<string, BaseSchema>>(
    additionalFields: E
  ): ExtendableSchema<T & { [K in keyof E]: any }>;
}

/**
 * Create a schema from a database table
 * Auto-infers types from DatabaseTypes and respects nullability
 *
 * @param tableName - Name of the database table
 * @param options - Optional field filtering
 * @returns Schema that can be extended with virtual fields
 *
 * @example
 * // Basic usage
 * const UserSchema = dbTable('users');
 *
 * // Selective fields
 * const PublicUserSchema = dbTable('users', { only: ['id', 'name', 'email'] });
 * const SafeUserSchema = dbTable('users', { exclude: ['password_hash'] });
 *
 * // With virtual fields
 * const EnhancedUserSchema = dbTable('users').extend({
 *   fullName: m.string(),
 *   isActive: m.boolean()
 * });
 */
export function dbTable<TableName extends string = string>(
  tableName: TableName,
  options?: DbTableOptions
): ExtendableSchema<any> {
  // In a real implementation, this would load database types from the user's project
  // For now, we create a placeholder schema that developers can use
  // The actual type inference will happen at the TypeScript level using Database types

  // TODO: Implement actual database type loading and schema generation
  // This would require:
  // 1. Loading the user's DatabaseTypes file
  // 2. Extracting table structure
  // 3. Mapping DB types to schema types
  // 4. Respecting nullable columns (make them optional)
  // 5. Applying only/exclude filters

  // Placeholder implementation that returns a generic object schema
  const baseSchema = m.object({}) as any;

  // Add extend method
  baseSchema.extend = function<E extends Record<string, BaseSchema>>(
    additionalFields: E
  ): ObjectSchema<any> {
    const combinedShape = {
      ...baseSchema._shape,
      ...additionalFields
    };

    return {
      _type: {} as any,
      _meta: {
        ...baseSchema._meta,
        schemaType: 'object' as const,
      },
      _shape: combinedShape,
      // Preserve extend capability on the new schema
      extend: baseSchema.extend,
    } as any;
  };

  return baseSchema;
}

/**
 * Helper to map database column types to schema types
 */
function mapDbColumnToSchema(columnType: string, nullable: boolean): BaseSchema {
  const type = columnType.toLowerCase();

  let schema: BaseSchema;

  // Map common database types
  if (type.includes('uuid')) {
    schema = m.uuid();
  } else if (type.includes('int') || type.includes('serial') || type.includes('bigint')) {
    schema = m.number();
  } else if (type.includes('bool')) {
    schema = m.boolean();
  } else if (type.includes('timestamp') || type.includes('date')) {
    schema = m.date();
  } else if (type.includes('text') || type.includes('varchar') || type.includes('char')) {
    schema = m.string();
  } else if (type.includes('numeric') || type.includes('decimal') || type.includes('real') || type.includes('double')) {
    schema = m.number();
  } else {
    // Default to string
    schema = m.string();
  }

  // Make schema optional if column is nullable
  if (nullable) {
    return m.optional(schema);
  }

  return schema;
}
