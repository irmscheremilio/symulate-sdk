/**
 * Platform and API configuration
 * Central location for all Supabase and platform-related constants
 */

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
