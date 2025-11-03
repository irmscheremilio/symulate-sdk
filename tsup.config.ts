import { defineConfig } from 'tsup';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.production for builds (contains production Supabase credentials)
// .env.local can be used to override at runtime for local testing
dotenv.config({ path: path.resolve(__dirname, '.env.production') });

// Get environment variables with proper fallback
const getPlatformUrl = () => process.env.SYMULATE_PLATFORM_URL || '';
const getSupabaseUrl = () => process.env.SYMULATE_SUPABASE_URL || '';
const getSupabaseAnonKey = () => process.env.SYMULATE_SUPABASE_ANON_KEY || '';

export default defineConfig({
  entry: ['src/index.ts', 'src/cli/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false, // Disable code splitting to avoid chunks
  // Bundle all dependencies except those that can't be bundled
  noExternal: [
    /@supabase/,
    /@faker-js/,
    /commander/,
    /glob/,
    /open/,
  ],
  external: [
    // Node.js built-ins
    'node:fs',
    'node:path',
    'node:url',
    'node:crypto',
    'node:module',
    'fs',
    'path',
    'url',
    'crypto',
    'os',
    'child_process',
    // Don't bundle tsx and esbuild - they need to be loaded from node_modules
    'tsx',
    'tsx/esm/api',
    'esbuild',
  ],
  // Replace environment variable references with actual values at build time
  define: {
    'process.env.SYMULATE_PLATFORM_URL': JSON.stringify(getPlatformUrl()),
    'process.env.SYMULATE_SUPABASE_URL': JSON.stringify(getSupabaseUrl()),
    'process.env.SYMULATE_SUPABASE_ANON_KEY': JSON.stringify(getSupabaseAnonKey()),
  },
});
