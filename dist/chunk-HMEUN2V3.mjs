import {
  __esm
} from "./chunk-CIESM3BP.mjs";

// src/env.ts
var IS_NODE, NODE_ENV, IS_DEBUG;
var init_env = __esm({
  "src/env.ts"() {
    "use strict";
    IS_NODE = typeof process !== "undefined" && typeof process.env !== "undefined";
    NODE_ENV = IS_NODE && process.env.NODE_ENV === "production" ? "production" : "development";
    IS_DEBUG = IS_NODE && (process.env.MOCKEND_DEBUG === "true" || process.env.MOCKEND_DEBUG === "1");
  }
});

export {
  NODE_ENV,
  IS_DEBUG,
  init_env
};
