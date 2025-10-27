import {
  __esm,
  __export
} from "./chunk-CIESM3BP.mjs";

// src/platformConfig.ts
var PLATFORM_CONFIG;
var init_platformConfig = __esm({
  "src/platformConfig.ts"() {
    "use strict";
    PLATFORM_CONFIG = {
      // Platform URLs
      platformUrl: "http://localhost:3000",
      // Supabase configuration
      supabase: {
        url: "https://ptrjfelueuglvsdsqzok.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0cmpmZWx1ZXVnbHZzZHNxem9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MjcyMDQsImV4cCI6MjA3NjMwMzIwNH0.pNF6fk1tC03xrsmp2r4e5uouvqOQgRFcj4BbsTI8TnU"
      },
      // API endpoints
      api: {
        authPoll: "https://ptrjfelueuglvsdsqzok.supabase.co/functions/v1/auth-poll",
        rest: "https://ptrjfelueuglvsdsqzok.supabase.co/rest/v1"
      }
    };
  }
});

// src/auth.ts
var auth_exports = {};
__export(auth_exports, {
  clearAuthSession: () => clearAuthSession,
  getAuthSession: () => getAuthSession,
  getAuthSessionWithRefresh: () => getAuthSessionWithRefresh,
  getCurrentContext: () => getCurrentContext,
  login: () => login,
  logout: () => logout,
  saveAuthSession: () => saveAuthSession,
  setCurrentOrganization: () => setCurrentOrganization,
  setCurrentProject: () => setCurrentProject,
  whoami: () => whoami
});
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}
function ensureAuthDir() {
  if (!fs.existsSync(AUTH_CONFIG_DIR)) {
    fs.mkdirSync(AUTH_CONFIG_DIR, { recursive: true });
  }
}
function isJwtExpired(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true;
    }
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    if (payload.exp) {
      return payload.exp * 1e3 < Date.now();
    }
    return true;
  } catch (error) {
    return true;
  }
}
async function refreshAccessToken(session) {
  try {
    const pollUrl = PLATFORM_CONFIG.api.authPoll;
    const response = await fetch(pollUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`
      },
      body: JSON.stringify({ sessionToken: session.sessionToken })
    });
    if (response.ok) {
      const data = await response.json();
      if (data.authenticated && data.accessToken) {
        return data.accessToken;
      }
    }
    return null;
  } catch (error) {
    console.error("[Symulate] Failed to refresh access token:", error);
    return null;
  }
}
function getAuthSession() {
  try {
    if (!fs.existsSync(AUTH_CONFIG_FILE)) {
      return null;
    }
    const content = fs.readFileSync(AUTH_CONFIG_FILE, "utf-8");
    const session = JSON.parse(content);
    if (session.expiresAt && session.expiresAt < Date.now()) {
      console.log("[Symulate] Session expired. Please run 'npx symulate login'");
      return null;
    }
    if (session.accessToken && isJwtExpired(session.accessToken)) {
      console.log("[Symulate] Access token expired, refreshing...");
      console.log("[Symulate] Please run 'npx symulate login' to refresh your session");
      return null;
    }
    return session;
  } catch (error) {
    console.warn("[Symulate] Failed to read auth session:", error);
    return null;
  }
}
async function getAuthSessionWithRefresh() {
  try {
    if (!fs.existsSync(AUTH_CONFIG_FILE)) {
      return null;
    }
    const content = fs.readFileSync(AUTH_CONFIG_FILE, "utf-8");
    const session = JSON.parse(content);
    if (session.expiresAt && session.expiresAt < Date.now()) {
      console.log("[Symulate] Session expired. Please run 'npx symulate login'");
      return null;
    }
    if (session.accessToken && isJwtExpired(session.accessToken)) {
      console.log("[Symulate] Access token expired, refreshing...");
      const newAccessToken = await refreshAccessToken(session);
      if (newAccessToken) {
        session.accessToken = newAccessToken;
        saveAuthSession(session);
        console.log("[Symulate] \u2713 Access token refreshed");
        return session;
      } else {
        console.log("[Symulate] Failed to refresh token. Please run 'npx symulate login'");
        return null;
      }
    }
    return session;
  } catch (error) {
    console.warn("[Symulate] Failed to read auth session:", error);
    return null;
  }
}
function saveAuthSession(session) {
  try {
    ensureAuthDir();
    fs.writeFileSync(AUTH_CONFIG_FILE, JSON.stringify(session, null, 2), "utf-8");
    console.log("[Symulate] \u2713 Session saved");
  } catch (error) {
    console.error("[Symulate] Failed to save auth session:", error);
    throw error;
  }
}
function clearAuthSession() {
  try {
    if (fs.existsSync(AUTH_CONFIG_FILE)) {
      fs.unlinkSync(AUTH_CONFIG_FILE);
      console.log("[Symulate] \u2713 Session cleared");
    }
  } catch (error) {
    console.warn("[Symulate] Failed to clear auth session:", error);
  }
}
function getPreviousContext() {
  try {
    if (!fs.existsSync(AUTH_CONFIG_FILE)) {
      return {};
    }
    const content = fs.readFileSync(AUTH_CONFIG_FILE, "utf-8");
    const session = JSON.parse(content);
    return {
      orgId: session.currentOrgId,
      projectId: session.currentProjectId
    };
  } catch (error) {
    return {};
  }
}
async function pollAuthStatus(sessionToken, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const pollUrl = PLATFORM_CONFIG.api.authPoll;
      const response = await fetch(pollUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": PLATFORM_CONFIG.supabase.anonKey,
          "Authorization": `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`
        },
        body: JSON.stringify({ sessionToken })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          const previousContext = getPreviousContext();
          return {
            sessionToken,
            userId: data.userId,
            email: data.email,
            expiresAt: data.expiresAt,
            accessToken: data.accessToken,
            // Prioritize: 1) previous session context, 2) server defaults, 3) undefined
            currentOrgId: previousContext.orgId || data.defaultOrgId,
            currentProjectId: previousContext.projectId || data.defaultProjectId
          };
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 2e3));
    } catch (error) {
      console.error("[Symulate] Polling error:", error);
    }
  }
  return null;
}
async function createSessionRecord(sessionToken) {
  try {
    const response = await fetch(`${PLATFORM_CONFIG.api.rest}/cli_sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": PLATFORM_CONFIG.supabase.anonKey,
        "Authorization": `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        session_token: sessionToken,
        authenticated: false,
        user_id: null
      })
    });
    if (!response.ok) {
      console.error("[Symulate] Failed to create session. Please try again.");
      return false;
    }
    return true;
  } catch (error) {
    console.error("[Symulate] Error creating session. Please try again.");
    return false;
  }
}
async function login() {
  const sessionToken = generateSessionToken();
  console.log("[Symulate] Creating session...");
  const sessionCreated = await createSessionRecord(sessionToken);
  if (!sessionCreated) {
    console.error("[Symulate] \u2717 Failed to create session. Please try again.");
    return false;
  }
  const authUrl = `${PLATFORM_CONFIG.platformUrl}/auth/cli?token=${sessionToken}`;
  console.log("\n[Symulate] Opening browser for authentication...");
  console.log(`If the browser doesn't open automatically, visit:
  ${authUrl}
`);
  try {
    const open = await import("open");
    await open.default(authUrl);
  } catch (error) {
    console.warn("[Symulate] Could not open browser automatically");
  }
  console.log("[Symulate] Waiting for authentication...");
  console.log("[Symulate] (This may take up to 2 minutes)\n");
  const session = await pollAuthStatus(sessionToken);
  if (session) {
    saveAuthSession(session);
    console.log(`
[Symulate] \u2713 Successfully authenticated as ${session.email}`);
    if (session.currentOrgId && session.currentProjectId) {
      console.log(`[Symulate] \u2713 Auto-selected organization and project`);
      console.log(`[Symulate]   Organization ID: ${session.currentOrgId}`);
      console.log(`[Symulate]   Project ID: ${session.currentProjectId}`);
      console.log(`
[Symulate] \u{1F4A1} Tip: You can switch organizations or projects anytime:`);
      console.log(`[Symulate]   \u2022 npx symulate orgs list`);
      console.log(`[Symulate]   \u2022 npx symulate projects list`);
    } else if (session.currentOrgId) {
      console.log(`[Symulate] \u2713 Auto-selected organization: ${session.currentOrgId}`);
      console.log(`[Symulate] \u26A0\uFE0F  No projects found. Create one at https://platform.symulate.dev/dashboard/projects`);
    } else {
      console.log(`[Symulate] \u26A0\uFE0F  No organizations found. One should be created automatically.`);
      console.log(`[Symulate]   Visit https://platform.symulate.dev/dashboard to set up your account`);
    }
    return true;
  } else {
    console.log("\n[Symulate] \u2717 Authentication timed out or failed");
    console.log("[Symulate] Please try again with 'npx symulate login'");
    return false;
  }
}
function logout() {
  clearAuthSession();
  console.log("[Symulate] \u2713 Logged out successfully");
}
async function whoami() {
  const session = getAuthSession();
  if (!session) {
    console.log("[Symulate] Not authenticated");
    console.log("[Symulate] Run 'npx symulate login' to authenticate");
    return;
  }
  console.log("\n[Symulate] Current User:");
  console.log(`  Email: ${session.email}`);
  console.log(`  User ID: ${session.userId}`);
  if (session.currentOrgId) {
    try {
      const authHeader = session.accessToken ? `Bearer ${session.accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
      const orgResponse = await fetch(
        `${PLATFORM_CONFIG.api.rest}/organizations?id=eq.${session.currentOrgId}&select=name,slug`,
        {
          headers: {
            apikey: PLATFORM_CONFIG.supabase.anonKey,
            Authorization: authHeader,
            "Content-Type": "application/json"
          }
        }
      );
      if (orgResponse.ok) {
        const orgs = await orgResponse.json();
        if (orgs.length > 0) {
          const org = orgs[0];
          console.log(`  Current Organization: ${org.name} (${org.slug})`);
          console.log(`    ID: ${session.currentOrgId}`);
        } else {
          console.log(`  Current Organization: ${session.currentOrgId}`);
        }
      } else {
        console.log(`  Current Organization: ${session.currentOrgId}`);
      }
    } catch (error) {
      console.log(`  Current Organization: ${session.currentOrgId}`);
    }
  }
  if (session.currentProjectId) {
    try {
      const authHeader = session.accessToken ? `Bearer ${session.accessToken}` : `Bearer ${PLATFORM_CONFIG.supabase.anonKey}`;
      const projectResponse = await fetch(
        `${PLATFORM_CONFIG.api.rest}/projects?id=eq.${session.currentProjectId}&select=name,slug`,
        {
          headers: {
            apikey: PLATFORM_CONFIG.supabase.anonKey,
            Authorization: authHeader,
            "Content-Type": "application/json"
          }
        }
      );
      if (projectResponse.ok) {
        const projects = await projectResponse.json();
        if (projects.length > 0) {
          const project = projects[0];
          console.log(`  Current Project: ${project.name} (${project.slug})`);
          console.log(`    ID: ${session.currentProjectId}`);
        } else {
          console.log(`  Current Project: ${session.currentProjectId}`);
        }
      } else {
        console.log(`  Current Project: ${session.currentProjectId}`);
      }
    } catch (error) {
      console.log(`  Current Project: ${session.currentProjectId}`);
    }
  }
  console.log(`  Expires: ${new Date(session.expiresAt).toLocaleString()}`);
  console.log();
}
function getCurrentContext() {
  const session = getAuthSession();
  if (!session) {
    return {};
  }
  return {
    orgId: session.currentOrgId,
    projectId: session.currentProjectId
  };
}
function setCurrentOrganization(orgId) {
  const session = getAuthSession();
  if (!session) {
    console.error("[Symulate] No active session. Please login first.");
    return;
  }
  session.currentOrgId = orgId;
  session.currentProjectId = void 0;
  saveAuthSession(session);
  console.log(`[Symulate] \u2713 Switched to organization: ${orgId}`);
}
function setCurrentProject(projectId) {
  const session = getAuthSession();
  if (!session) {
    console.error("[Symulate] No active session. Please login first.");
    return;
  }
  if (!session.currentOrgId) {
    console.error(
      "[Symulate] No organization selected. Please select an organization first."
    );
    return;
  }
  session.currentProjectId = projectId;
  saveAuthSession(session);
  console.log(`[Symulate] \u2713 Switched to project: ${projectId}`);
}
var AUTH_CONFIG_DIR, AUTH_CONFIG_FILE;
var init_auth = __esm({
  "src/auth.ts"() {
    init_platformConfig();
    AUTH_CONFIG_DIR = path.join(os.homedir(), ".symulate");
    AUTH_CONFIG_FILE = path.join(AUTH_CONFIG_DIR, "auth.json");
  }
});

export {
  PLATFORM_CONFIG,
  init_platformConfig,
  getAuthSession,
  getAuthSessionWithRefresh,
  saveAuthSession,
  clearAuthSession,
  login,
  logout,
  whoami,
  getCurrentContext,
  setCurrentOrganization,
  setCurrentProject,
  auth_exports,
  init_auth
};
