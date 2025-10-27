import {
  NODE_ENV,
  init_env
} from "./chunk-HMEUN2V3.mjs";
import {
  __esm,
  __export
} from "./chunk-CIESM3BP.mjs";

// src/config.ts
var config_exports = {};
__export(config_exports, {
  clearQuotaState: () => clearQuotaState,
  configureSymulate: () => configureSymulate,
  getConfig: () => getConfig,
  isDevelopment: () => isDevelopment,
  isProduction: () => isProduction,
  isQuotaExceeded: () => isQuotaExceeded,
  markQuotaExceeded: () => markQuotaExceeded,
  updateQuotaStatus: () => updateQuotaStatus
});
function configureSymulate(config) {
  globalConfig = { ...globalConfig, ...config };
}
function getConfig() {
  return globalConfig;
}
function isDevelopment() {
  return globalConfig.environment === "development";
}
function isProduction() {
  return globalConfig.environment === "production";
}
function isQuotaExceeded(apiKey) {
  const state = quotaState.get(apiKey);
  if (!state) return false;
  const now = Date.now();
  if (state.quotaExceeded && now - state.lastChecked < QUOTA_CHECK_INTERVAL) {
    console.log(`[Symulate] \u{1F4A1} Quota exceeded (checked ${Math.round((now - state.lastChecked) / 1e3)}s ago). Using Faker.js mode.`);
    console.log(`[Symulate] \u{1F4A1} Will retry AI mode in ${Math.round((QUOTA_CHECK_INTERVAL - (now - state.lastChecked)) / 1e3)}s`);
    return true;
  }
  return false;
}
function markQuotaExceeded(apiKey, tokensUsed, tokensLimit) {
  quotaState.set(apiKey, {
    quotaExceeded: true,
    lastChecked: Date.now(),
    tokensRemaining: 0,
    tokensLimit
  });
  console.log(`[Symulate] \u26A0\uFE0F  Quota exceeded: ${tokensUsed || "?"}/${tokensLimit || "?"} tokens used this month`);
  console.log(`[Symulate] \u{1F4A1} Automatically switched to Faker.js mode (unlimited, free)`);
  console.log(`[Symulate] \u{1F4A1} Upgrade at https://platform.symulate.dev/pricing for more AI tokens`);
}
function updateQuotaStatus(apiKey, tokensRemaining, tokensLimit) {
  const now = Date.now();
  const percentRemaining = tokensRemaining / tokensLimit * 100;
  if (percentRemaining < 10 && percentRemaining > 0) {
    console.warn(`[Symulate] \u26A0\uFE0F  Low quota: ${tokensRemaining}/${tokensLimit} tokens remaining (${percentRemaining.toFixed(1)}%)`);
    console.log(`[Symulate] \u{1F4A1} Upgrade at https://platform.symulate.dev/pricing to avoid hitting limits`);
  }
  quotaState.set(apiKey, {
    quotaExceeded: false,
    lastChecked: now,
    tokensRemaining,
    tokensLimit
  });
}
function clearQuotaState(apiKey) {
  if (apiKey) {
    quotaState.delete(apiKey);
    console.log(`[Symulate] \u2713 Quota state cleared for API key`);
  } else {
    quotaState.clear();
    console.log(`[Symulate] \u2713 All quota state cleared`);
  }
}
var globalConfig, quotaState, QUOTA_CHECK_INTERVAL;
var init_config = __esm({
  "src/config.ts"() {
    init_env();
    globalConfig = {
      environment: NODE_ENV,
      cacheEnabled: true,
      generateMode: "auto"
      // Default: try AI first, fallback to Faker.js
    };
    quotaState = /* @__PURE__ */ new Map();
    QUOTA_CHECK_INTERVAL = 6e4;
  }
});

export {
  configureSymulate,
  getConfig,
  isDevelopment,
  isProduction,
  isQuotaExceeded,
  markQuotaExceeded,
  updateQuotaStatus,
  clearQuotaState,
  config_exports,
  init_config
};
