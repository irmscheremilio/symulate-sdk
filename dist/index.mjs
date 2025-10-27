import {
  defineEndpoint,
  getRegisteredEndpoints,
  m
} from "./chunk-F3MMIG2V.mjs";
import {
  clearCache,
  debugCache
} from "./chunk-L3W6IOE7.mjs";
import {
  clearQuotaState,
  configureSymulate,
  getConfig,
  init_config,
  isDevelopment,
  isProduction
} from "./chunk-RV4NJJYN.mjs";
import "./chunk-PAN643QS.mjs";
import "./chunk-HMEUN2V3.mjs";
import "./chunk-CIESM3BP.mjs";

// src/index.ts
init_config();

// src/validator.ts
var TypeValidationError = class extends Error {
  constructor(path, expected, received, fullResponse) {
    super(
      `Type validation failed at path "${path}":
  Expected: ${expected}
  Received: ${typeof received} (${JSON.stringify(received)})

Full response: ${JSON.stringify(fullResponse, null, 2)}

This usually means your backend response doesn't match the TypeScript type definition.
Please verify that your backend API returns data matching the expected structure.`
    );
    this.path = path;
    this.expected = expected;
    this.received = received;
    this.fullResponse = fullResponse;
    this.name = "TypeValidationError";
  }
};
export {
  TypeValidationError,
  clearCache,
  clearQuotaState,
  configureSymulate,
  debugCache,
  defineEndpoint,
  getConfig,
  getRegisteredEndpoints,
  isDevelopment,
  isProduction,
  m
};
