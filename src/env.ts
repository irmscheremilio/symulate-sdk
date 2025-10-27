/**
 * Environment checks performed once at module load time.
 * Safe for both Node.js and browser environments.
 */

// Check if we're in a Node.js environment (do this check once)
export const IS_NODE = typeof process !== 'undefined' && typeof process.env !== 'undefined';

// Get environment variable values (safe for browser)
export const NODE_ENV = IS_NODE && process.env.NODE_ENV === 'production' ? 'production' : 'development';
export const IS_DEBUG = IS_NODE && (process.env.MOCKEND_DEBUG === 'true' || process.env.MOCKEND_DEBUG === '1');
