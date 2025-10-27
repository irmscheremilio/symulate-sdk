import { describe, it, expect, beforeEach } from "vitest";
import { configureSymulate, getConfig, isDevelopment, isProduction } from "../config";

describe("config", () => {
  beforeEach(() => {
    // Reset config to defaults
    configureSymulate({
      environment: "development",
    });
  });

  describe("configureSymulate", () => {
    it("should set configuration", () => {
      configureSymulate({
        aiKey: "test-key",
        backendBaseUrl: "https://api.example.com",
        environment: "production",
      });

      const config = getConfig();
      expect(config.aiKey).toBe("test-key");
      expect(config.backendBaseUrl).toBe("https://api.example.com");
      expect(config.environment).toBe("production");
    });

    it("should merge with existing config", () => {
      configureSymulate({ aiKey: "key1" });
      configureSymulate({ backendBaseUrl: "https://api.example.com" });

      const config = getConfig();
      expect(config.aiKey).toBe("key1");
      expect(config.backendBaseUrl).toBe("https://api.example.com");
    });
  });

  describe("isDevelopment and isProduction", () => {
    it("should return correct environment check for development", () => {
      configureSymulate({ environment: "development" });
      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
    });

    it("should return correct environment check for production", () => {
      configureSymulate({ environment: "production" });
      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(true);
    });
  });
});
