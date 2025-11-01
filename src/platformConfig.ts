/**
 * Platform and API configuration
 * Central location for all Supabase and platform-related constants
 */

import { createClient } from "@supabase/supabase-js";

export const PLATFORM_CONFIG = {
  // Platform URLs
  platformUrl: "https://platform.symulate.dev",

  // Supabase configuration
  supabase: {
    url: "https://ptrjfelueuglvsdsqzok.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cmpmZWx1ZXVnbHZzZHNxem9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjcyMDQsImV4cCI6MjA3NjMwMzIwNH0.pNF6fk1tC03xrsmp2r4e5uouvqOQgRFcj4BbsTI8TnU",
  },

  // API endpoints
  api: {
    authPoll: "https://ptrjfelueuglvsdsqzok.supabase.co/functions/v1/auth-poll",
    rest: "https://ptrjfelueuglvsdsqzok.supabase.co/rest/v1",
  },
} as const;

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
