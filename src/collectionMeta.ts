/**
 * Collection meta field utilities
 * Supports flexible response schemas with meta fields and aggregates
 * Matches the edge function implementation in _shared/collections.ts
 */

/**
 * Calculate aggregate value for a field
 */
export function calculateAggregate(
  items: any[],
  aggregateType: string,
  fieldName: string,
  filterValue?: any
): number | null {
  if (items.length === 0) {
    return null;
  }

  switch (aggregateType) {
    case 'avg': {
      const values = items
        .map(item => item[fieldName])
        .filter(val => typeof val === 'number');
      if (values.length === 0) return null;
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    case 'sum': {
      const values = items
        .map(item => item[fieldName])
        .filter(val => typeof val === 'number');
      if (values.length === 0) return null;
      return values.reduce((sum, val) => sum + val, 0);
    }

    case 'min': {
      const values = items
        .map(item => item[fieldName])
        .filter(val => typeof val === 'number');
      if (values.length === 0) return null;
      return Math.min(...values);
    }

    case 'max': {
      const values = items
        .map(item => item[fieldName])
        .filter(val => typeof val === 'number');
      if (values.length === 0) return null;
      return Math.max(...values);
    }

    case 'count': {
      if (filterValue === undefined) {
        return items.length;
      }
      return items.filter(item => item[fieldName] === filterValue).length;
    }

    default:
      return null;
  }
}

/**
 * Check if schema type is a collectionsMeta field
 */
export function isCollectionsMetaField(schemaType: string): boolean {
  return schemaType && schemaType.startsWith && schemaType.startsWith('collectionsMeta.');
}

/**
 * Parse collectionsMeta field
 * Returns { type, fieldName, value } for aggregate fields
 * Returns { type } for simple fields like page, limit
 */
export function parseMetaField(schemaType: string): {
  type: string;
  fieldName?: string;
  value?: any;
} | null {
  if (!isCollectionsMetaField(schemaType)) {
    return null;
  }

  const parts = schemaType.replace('collectionsMeta.', '').split(':');
  const type = parts[0];

  if (['avg', 'sum', 'min', 'max'].includes(type)) {
    return {
      type,
      fieldName: parts[1],
    };
  }

  if (type === 'count') {
    return {
      type,
      fieldName: parts[1],
      value: parts[2] ? JSON.parse(parts[2]) : undefined,
    };
  }

  // Simple fields like page, limit, total, totalPages
  return { type };
}

/**
 * Get meta value from basic pagination info
 */
export function getBasicMetaValue(
  type: string,
  metaValues: { page: number; limit: number; total: number; totalPages: number }
): number | undefined {
  const basicFields: Record<string, keyof typeof metaValues> = {
    page: 'page',
    limit: 'limit',
    total: 'total',
    totalPages: 'totalPages',
  };

  const field = basicFields[type];
  return field ? metaValues[field] : undefined;
}

/**
 * Build response from schema, injecting meta values and data array
 * Supports both basic meta fields (page, limit, total, totalPages)
 * and aggregate fields (avg, sum, min, max, count)
 */
export function buildResponseFromSchema(
  schema: any,
  dataArray: any[],
  allItems: any[], // All items (before pagination) for aggregate calculations
  metaValues: { page: number; limit: number; total: number; totalPages: number }
): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  // Handle arrays in schema - this represents the data array location
  // Support both literal arrays [Schema] and m.array(Schema)
  if (Array.isArray(schema) && schema.length > 0) {
    return dataArray;
  }

  // Handle m.array(Schema) - schema object with schemaType: "array"
  if (schema._meta?.schemaType === 'array') {
    return dataArray;
  }

  // Handle m.object() - schema object with schemaType: "object"
  // Properties are stored in _shape
  let objectToIterate = schema;
  if (schema._meta?.schemaType === 'object' && schema._shape) {
    objectToIterate = schema._shape;
  }

  // Handle objects
  const result: any = {};
  for (const [key, value] of Object.entries(objectToIterate)) {
    // Skip internal schema properties
    if (key.startsWith('_')) {
      continue;
    }

    // Check if value is an array (literal or m.array()) - this is the data array location
    if (Array.isArray(value) && value.length > 0) {
      result[key] = dataArray;
      continue;
    }
    if (typeof value === 'object' && value !== null && value._meta?.schemaType === 'array') {
      result[key] = dataArray;
      continue;
    }

    // Check if value is a collectionsMeta field (string literal or schema object)
    let metaFieldType: string | null = null;

    if (typeof value === 'string' && isCollectionsMetaField(value)) {
      // String literal like "collectionsMeta.page"
      metaFieldType = value;
    } else if (typeof value === 'object' && value !== null && '_meta' in value && value._meta?.schemaType) {
      // Schema object created by m.collectionsMeta.page()
      if (isCollectionsMetaField(value._meta.schemaType)) {
        metaFieldType = value._meta.schemaType;
      }
    }

    if (metaFieldType) {
      // Parse the meta field
      const parsed = parseMetaField(metaFieldType);
      if (!parsed) continue;

      // Basic fields (page, limit, total, totalPages)
      const basicValue = getBasicMetaValue(parsed.type, metaValues);
      if (basicValue !== undefined) {
        result[key] = basicValue;
        continue;
      }

      // Aggregate fields
      if (parsed.fieldName) {
        const aggregateValue = calculateAggregate(
          allItems,
          parsed.type,
          parsed.fieldName,
          parsed.value
        );
        if (aggregateValue !== null) {
          result[key] = aggregateValue;
        }
      }
    } else if (typeof value === 'object') {
      // Recurse into nested objects/arrays
      const nested = buildResponseFromSchema(value, dataArray, allItems, metaValues);
      if (nested !== undefined && (Array.isArray(nested) || Object.keys(nested).length > 0)) {
        result[key] = nested;
      }
    }
  }

  return result;
}

/**
 * Extract response schema from operation config
 * Returns the schema that defines the response structure
 */
export function extractResponseSchema(operationConfig: any): any {
  return operationConfig?.responseSchema?.schema;
}

/**
 * Check if operation uses custom response schema
 */
export function hasCustomResponseSchema(operationConfig: any): boolean {
  const schema = extractResponseSchema(operationConfig);
  return schema !== null && schema !== undefined;
}
