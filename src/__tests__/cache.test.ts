import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import {
  computeSchemaHash,
  getCachedTemplate,
  setCachedTemplate,
  clearCache,
  getCacheFilePath,
} from "../cache";

describe("cache", () => {
  const testCacheFile = getCacheFilePath();

  beforeEach(() => {
    clearCache();
  });

  afterEach(() => {
    clearCache();
  });

  describe("computeSchemaHash", () => {
    it("should generate consistent hash for same schema", () => {
      const schema = { fields: { id: "uuid", name: "string" } };
      const hash1 = computeSchemaHash(schema);
      const hash2 = computeSchemaHash(schema);

      expect(hash1).toBe(hash2);
    });

    it("should generate different hash for different schemas", () => {
      const schema1 = { fields: { id: "uuid" } };
      const schema2 = { fields: { name: "string" } };
      const hash1 = computeSchemaHash(schema1);
      const hash2 = computeSchemaHash(schema2);

      expect(hash1).not.toBe(hash2);
    });

    it("should be order-independent", () => {
      const schema1 = { a: 1, b: 2 };
      const schema2 = { b: 2, a: 1 };
      const hash1 = computeSchemaHash(schema1);
      const hash2 = computeSchemaHash(schema2);

      expect(hash1).toBe(hash2);
    });
  });

  describe("getCachedTemplate and setCachedTemplate", () => {
    it("should return null for non-existent template", async () => {
      const result = await getCachedTemplate("nonexistent");
      expect(result).toBeNull();
    });

    it("should cache and retrieve template", async () => {
      const schemaHash = "test-hash-123";
      const template = { id: "1", name: "Test" };

      await setCachedTemplate(schemaHash, template);
      const cached = await getCachedTemplate(schemaHash);

      expect(cached).not.toBeNull();
      expect(cached?.template).toEqual(template);
      expect(cached?.schemaHash).toBe(schemaHash);
    });

    it("should overwrite existing template", async () => {
      const schemaHash = "test-hash-456";
      const template1 = { id: "1" };
      const template2 = { id: "2" };

      await setCachedTemplate(schemaHash, template1);
      await setCachedTemplate(schemaHash, template2);
      const cached = await getCachedTemplate(schemaHash);

      expect(cached?.template).toEqual(template2);
    });
  });

  describe("clearCache", () => {
    it("should remove cache file", () => {
      const schemaHash = "test-hash-789";
      const template = { id: "1" };

      setCachedTemplate(schemaHash, template);
      expect(fs.existsSync(testCacheFile)).toBe(true);

      clearCache();
      expect(fs.existsSync(testCacheFile)).toBe(false);
    });
  });
});
