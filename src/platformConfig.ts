/**
 * Platform and API configuration
 * Central location for all Supabase and platform-related constants
 *
 * Environment Variables (optional, for local development):
 * - SYMULATE_PLATFORM_URL: Override platform URL
 * - SYMULATE_SUPABASE_URL: Override Supabase URL
 * - SYMULATE_SUPABASE_ANON_KEY: Override Supabase anon key
 *
 * For local development, create a .env.local file in the SDK root:
 * SYMULATE_PLATFORM_URL=http://localhost:3000
 * SYMULATE_SUPABASE_URL=http://localhost:54321
 * SYMULATE_SUPABASE_ANON_KEY=your-local-anon-key
 */

import { createClient } from "@supabase/supabase-js";

// Build-time configuration (replaced by tsup's define option during build)
// These process.env values are replaced with string literals at build time
// No need to check typeof process - the values are baked in as strings

const PROD_PLATFORM_URL = 'https://platform.symulate.dev';
const PROD_SUPABASE_URL = 'https://ptrjfelueuglvsdsqzok.supabase.co';
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cmpmZWx1ZXVnbHZzZHNxem9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjcyMDQsImV4cCI6MjA3NjMwMzIwNH0.pNF6fk1tC03xrsmp2r4e5uouvqOQgRFcj4BbsTI8TnU';

const platformUrl = process.env.SYMULATE_PLATFORM_URL!;
const supabaseUrl = process.env.SYMULATE_SUPABASE_URL!;
const supabaseAnonKey = process.env.SYMULATE_SUPABASE_ANON_KEY!;

export const PLATFORM_CONFIG = {
  // Platform URLs
  platformUrl,

  // Supabase configuration
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  },

  // API endpoints (derived from temp URL)
  api: {
    authPoll: `${supabaseUrl}/functions/v1/auth-poll`,
    rest: `${supabaseUrl}/rest/v1`,
  },
};

/**
 * Get a Supabase client with authentication token
 */
export function getSupabaseClient() {
  // Try to load auth token from the session
  let accessToken: string | undefined;

  try {
    const fs = require("fs");
    const path = require("path");
    const os = require("os");
    const authFile = path.join(os.homedir(), ".symulate", "auth.json");

    if (fs.existsSync(authFile)) {
      const auth = JSON.parse(fs.readFileSync(authFile, "utf-8"));
      accessToken = auth.accessToken;
    }
  } catch (error) {
    // Ignore errors loading auth file
  }

  const supabase = createClient(
    PLATFORM_CONFIG.supabase.url,
    PLATFORM_CONFIG.supabase.anonKey,
    {
      global: {
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {},
      },
    }
  );

  return supabase;
}
