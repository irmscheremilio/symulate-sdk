import {
  PLATFORM_CONFIG,
  getAuthSessionWithRefresh,
  init_auth,
  init_platformConfig
} from "./chunk-PAN643QS.mjs";
import "./chunk-CIESM3BP.mjs";

// src/organizations.ts
init_auth();
init_platformConfig();
async function getUserOrganizations() {
  const session = await getAuthSessionWithRefresh();
  if (!session || !session.accessToken) {
    console.error("[Symulate] Not authenticated. Please login first.");
    return [];
  }
  try {
    const response = await fetch(
      `${PLATFORM_CONFIG.api.rest}/organization_members?select=role,organization_id,organizations(id,name,slug,owner_user_id,created_at,updated_at)&user_id=eq.${session.userId}&order=joined_at.asc`,
      {
        headers: {
          apikey: PLATFORM_CONFIG.supabase.anonKey,
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    if (!response.ok) {
      const error = await response.json();
      console.error("[Symulate] Failed to fetch organizations:", error);
      return [];
    }
    const data = await response.json();
    const organizations = data.filter((item) => item.organizations).map((item) => {
      const org = Array.isArray(item.organizations) ? item.organizations[0] : item.organizations;
      return {
        ...org,
        user_role: item.role
      };
    });
    return organizations;
  } catch (error) {
    console.error("[Symulate] Error fetching organizations:", error);
    return [];
  }
}
async function getOrganizationProjects(organizationId) {
  const session = await getAuthSessionWithRefresh();
  if (!session || !session.accessToken) {
    console.error("[Symulate] Not authenticated. Please login first.");
    return [];
  }
  try {
    const response = await fetch(
      `${PLATFORM_CONFIG.api.rest}/projects?select=*&organization_id=eq.${organizationId}&is_active=eq.true&order=created_at.asc`,
      {
        headers: {
          apikey: PLATFORM_CONFIG.supabase.anonKey,
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    if (!response.ok) {
      const error = await response.json();
      console.error("[Symulate] Failed to fetch projects:", error);
      return [];
    }
    const projects = await response.json();
    return projects;
  } catch (error) {
    console.error("[Symulate] Error fetching projects:", error);
    return [];
  }
}
function displayOrganizations(organizations, currentOrgId) {
  if (organizations.length === 0) {
    console.log("\n[Symulate] No organizations found.");
    console.log(
      "[Symulate] Organizations are automatically created when you sign up."
    );
    return;
  }
  console.log("\n[Symulate] Your Organizations:\n");
  organizations.forEach((org) => {
    const current = org.id === currentOrgId ? " (current)" : "";
    console.log(`  ${org.name}${current}`);
    console.log(`    ID: ${org.id}`);
    console.log(`    Slug: ${org.slug}`);
    console.log(`    Role: ${org.user_role}`);
    console.log();
  });
}
function displayProjects(projects, currentProjectId) {
  if (projects.length === 0) {
    console.log("\n[Symulate] No projects found in this organization.");
    console.log(
      '[Symulate] Projects are automatically created with name "Default Project".'
    );
    return;
  }
  console.log("\n[Symulate] Projects:\n");
  projects.forEach((project) => {
    const current = project.id === currentProjectId ? " (current)" : "";
    console.log(`  ${project.name}${current}`);
    console.log(`    ID: ${project.id}`);
    console.log(`    Slug: ${project.slug}`);
    if (project.description) {
      console.log(`    Description: ${project.description}`);
    }
    console.log();
  });
}
export {
  displayOrganizations,
  displayProjects,
  getOrganizationProjects,
  getUserOrganizations
};
