import { BaseSchema } from './schema';
import { QueryOptions, PaginatedResponse } from './collection.types';
import { generateWithFaker } from './fakerGenerator';
import { getConfig } from './config';

/**
 * In-memory data store for collection items
 * Provides CRUD operations with optional persistence
 */
export class DataStore<T extends Record<string, any>> {
  private data: Map<string, T> = new Map();
  private schema: BaseSchema<T>;
  private collectionName: string;
  private seedCount: number;
  private seedInstruction?: string;
  private initialized: boolean = false;

  constructor(config: {
    collectionName: string;
    schema: BaseSchema<T>;
    seedCount: number;
    seedInstruction?: string;
  }) {
    this.collectionName = config.collectionName;
    this.schema = config.schema;
    this.seedCount = config.seedCount;
    this.seedInstruction = config.seedInstruction;
  }

  /**
   * Initialize store with seed data
   * Called lazily on first operation
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Check if we should load from persistence
    const persistedData = await this.loadFromPersistence();
    if (persistedData && persistedData.length > 0) {
      persistedData.forEach(item => {
        this.data.set(item.id, item);
      });
      this.initialized = true;
      return;
    }

    // Generate seed data
    const seedData = await this.generateSeedData();
    seedData.forEach(item => {
      this.data.set(item.id, item);
    });

    // Save initial seed data
    await this.persist();
    this.initialized = true;
  }

  /**
   * Generate seed data using AI or Faker
   */
  private async generateSeedData(): Promise<T[]> {
    const config = getConfig();
    const generateMode = config.generateMode || 'faker';

    // Check if we should use AI for seed data
    const shouldUseAI = generateMode === 'ai' || generateMode === 'auto';

    if (shouldUseAI && this.seedInstruction) {
      try {
        // Try to generate with AI
        const aiData = await this.generateSeedDataWithAI();
        if (aiData && aiData.length > 0) {
          return aiData;
        }
      } catch (error) {
        console.warn(`[Symulate] Failed to generate seed data with AI for ${this.collectionName}, falling back to Faker:`, error);

        // If mode is 'ai' (strict), rethrow the error
        if (generateMode === 'ai') {
          throw error;
        }
        // Otherwise fall through to Faker
      }
    }

    // Use Faker for seed data (default or fallback)
    return Array.from({ length: this.seedCount }, () => {
      const item = generateWithFaker(this.schema) as T;
      // Ensure id, createdAt, updatedAt exist
      const now = new Date().toISOString();
      return {
        ...item,
        id: item.id || this.generateId(),
        createdAt: item.createdAt || now,
        updatedAt: now,
      } as T;
    });
  }

  /**
   * Generate seed data using AI
   */
  private async generateSeedDataWithAI(): Promise<T[]> {
    const { generateWithAI } = await import('./aiProvider');
    const { schemaToTypeDescription } = await import('./schema');

    // Create an array schema for batch generation
    const arraySchema = {
      type: 'array',
      items: this.schema,
      minItems: this.seedCount,
      maxItems: this.seedCount,
    };

    const typeDescription = schemaToTypeDescription(this.schema);
    const instruction = this.seedInstruction
      ? `Generate ${this.seedCount} realistic ${this.collectionName} items: ${this.seedInstruction}`
      : `Generate ${this.seedCount} diverse and realistic ${this.collectionName} items`;

    console.log(`[Symulate] Generating ${this.seedCount} seed items with AI for ${this.collectionName}...`);

    const generatedData = await generateWithAI({
      schema: arraySchema,
      instruction,
      typeDescription,
    });

    // Ensure each item has proper timestamps and IDs
    const now = new Date().toISOString();
    return (Array.isArray(generatedData) ? generatedData : [generatedData]).map((item: any) => ({
      ...item,
      id: item.id || this.generateId(),
      createdAt: item.createdAt || now,
      updatedAt: now,
    })) as T[];
  }

  /**
   * Query all items with filtering, sorting, and pagination
   */
  async query(options: QueryOptions = {}): Promise<PaginatedResponse<T>> {
    await this.initialize();

    let items = Array.from(this.data.values());

    // Apply filtering (future enhancement)
    if (options.filter) {
      items = this.applyFilters(items, options.filter);
    }

    // Apply sorting
    if (options.sortBy) {
      items = this.applySorting(items, options.sortBy, options.sortOrder || 'asc');
    }

    // Calculate pagination
    const page = options.page || 1;
    const limit = options.limit || 20;
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Find item by ID
   */
  async findById(id: string): Promise<T | null> {
    await this.initialize();
    return this.data.get(id) || null;
  }

  /**
   * Insert new item
   */
  async insert(item: T): Promise<T> {
    await this.initialize();

    // Add timestamps if not present
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      id: item.id || this.generateId(),
      createdAt: item.createdAt || now,
      updatedAt: now,
    } as T;

    this.data.set(newItem.id, newItem);
    await this.persistCreate(newItem);

    return newItem;
  }

  /**
   * Update existing item (partial)
   */
  async update(id: string, updates: Partial<T>): Promise<T | null> {
    await this.initialize();

    const existing = this.data.get(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      id, // Preserve ID
      createdAt: existing.createdAt, // Preserve creation time
      updatedAt: new Date().toISOString(),
    } as T;

    this.data.set(id, updated);
    await this.persistUpdate(id, updates);

    return updated;
  }

  /**
   * Replace entire item (full replacement)
   */
  async replace(id: string, item: T): Promise<T | null> {
    await this.initialize();

    const existing = this.data.get(id);
    if (!existing) return null;

    const replaced = {
      ...item,
      id,
      createdAt: existing.createdAt, // Preserve creation time
      updatedAt: new Date().toISOString(),
    } as T;

    this.data.set(id, replaced);
    // Replace is essentially a full update
    await this.persistUpdate(id, replaced);

    return replaced;
  }

  /**
   * Delete item by ID
   */
  async delete(id: string): Promise<boolean> {
    await this.initialize();

    const existed = this.data.has(id);
    this.data.delete(id);

    if (existed) {
      await this.persistDelete(id);
    }

    return existed;
  }

  /**
   * Check if item exists
   */
  async exists(id: string): Promise<boolean> {
    await this.initialize();
    return this.data.has(id);
  }

  /**
   * Count total items
   */
  async count(filter?: Record<string, any>): Promise<number> {
    await this.initialize();

    if (!filter) {
      return this.data.size;
    }

    const items = Array.from(this.data.values());
    const filtered = this.applyFilters(items, filter);
    return filtered.length;
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    this.data.clear();
    await this.persist();
  }

  /**
   * Get all data as array (for export/debugging)
   */
  async toArray(): Promise<T[]> {
    await this.initialize();
    return Array.from(this.data.values());
  }

  // Private helper methods

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private applyFilters(items: T[], filter: Record<string, any>): T[] {
    return items.filter(item => {
      return Object.entries(filter).every(([key, value]) => {
        if (value === undefined) return true;

        const itemValue = item[key];

        // Exact match
        if (typeof value !== 'object') {
          return itemValue === value;
        }

        // Operators (future enhancement)
        // e.g., { age: { $gt: 18 } }
        if (value.$eq !== undefined) return itemValue === value.$eq;
        if (value.$ne !== undefined) return itemValue !== value.$ne;
        if (value.$gt !== undefined) return itemValue > value.$gt;
        if (value.$gte !== undefined) return itemValue >= value.$gte;
        if (value.$lt !== undefined) return itemValue < value.$lt;
        if (value.$lte !== undefined) return itemValue <= value.$lte;
        if (value.$in !== undefined) return value.$in.includes(itemValue);
        if (value.$nin !== undefined) return !value.$nin.includes(itemValue);

        return true;
      });
    });
  }

  private applySorting(items: T[], sortBy: string, sortOrder: 'asc' | 'desc'): T[] {
    return items.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Load data from persistence layer
   */
  private async loadFromPersistence(): Promise<T[] | null> {
    const config = getConfig();
    const persistenceMode = config.collections?.persistence?.mode;

    if (!persistenceMode || persistenceMode === 'memory') {
      return null;
    }

    try {
      if (persistenceMode === 'file') {
        const { loadFromFile } = await import('./persistence/filePersistence');
        return await loadFromFile(this.collectionName);
      }

      if (persistenceMode === 'supabase') {
        // Always use edge function for consistency across all environments
        const { loadFromEdgeFunction } = await import('./persistence/edgeFunctionPersistence');
        return await loadFromEdgeFunction(this.collectionName, this.schema, this.seedInstruction);
      }
    } catch (error) {
      console.warn(`Failed to load ${this.collectionName} from persistence:`, error);
    }

    return null;
  }

  /**
   * Save data to persistence layer (bulk save)
   */
  private async persist(): Promise<void> {
    const config = getConfig();
    const persistenceMode = config.collections?.persistence?.mode;

    if (!persistenceMode || persistenceMode === 'memory') {
      return;
    }

    const data = Array.from(this.data.values());

    try {
      if (persistenceMode === 'file') {
        const { saveToFile } = await import('./persistence/filePersistence');
        await saveToFile(this.collectionName, data);
      }

      // For supabase mode, edge function handles persistence per-operation
      // Bulk save is not needed as individual CRUD operations sync automatically
    } catch (error) {
      console.error(`Failed to persist ${this.collectionName}:`, error);
    }
  }

  /**
   * Persist create operation
   */
  private async persistCreate(item: T): Promise<void> {
    const config = getConfig();
    const persistenceMode = config.collections?.persistence?.mode;

    if (!persistenceMode || persistenceMode === 'memory') {
      return;
    }

    try {
      if (persistenceMode === 'supabase') {
        // Always use edge function for consistency
        const { createInEdgeFunction } = await import('./persistence/edgeFunctionPersistence');
        await createInEdgeFunction(this.collectionName, item);
      } else if (persistenceMode === 'file') {
        // For file mode, use bulk persist
        await this.persist();
      }
    } catch (error) {
      console.error(`Failed to persist create for ${this.collectionName}:`, error);
    }
  }

  /**
   * Persist update operation
   */
  private async persistUpdate(id: string, updates: Partial<T>): Promise<void> {
    const config = getConfig();
    const persistenceMode = config.collections?.persistence?.mode;

    if (!persistenceMode || persistenceMode === 'memory') {
      return;
    }

    try {
      if (persistenceMode === 'supabase') {
        // Always use edge function for consistency
        const { updateInEdgeFunction } = await import('./persistence/edgeFunctionPersistence');
        await updateInEdgeFunction(this.collectionName, id, updates);
      } else if (persistenceMode === 'file') {
        // For file mode, use bulk persist
        await this.persist();
      }
    } catch (error) {
      console.error(`Failed to persist update for ${this.collectionName}:`, error);
    }
  }

  /**
   * Persist delete operation
   */
  private async persistDelete(id: string): Promise<void> {
    const config = getConfig();
    const persistenceMode = config.collections?.persistence?.mode;

    if (!persistenceMode || persistenceMode === 'memory') {
      return;
    }

    try {
      if (persistenceMode === 'supabase') {
        // Always use edge function for consistency
        const { deleteFromEdgeFunction } = await import('./persistence/edgeFunctionPersistence');
        await deleteFromEdgeFunction(this.collectionName, id);
      } else if (persistenceMode === 'file') {
        // For file mode, use bulk persist
        await this.persist();
      }
    } catch (error) {
      console.error(`Failed to persist delete for ${this.collectionName}:`, error);
    }
  }
}
