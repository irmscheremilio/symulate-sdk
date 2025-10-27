import { getAuthSession, getAuthSessionWithRefresh } from "./auth";
import { PLATFORM_CONFIG } from "./platformConfig";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  user_role: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all organizations the user belongs to
 */
export async function getUserOrganizations(): Promise<Organization[]> {
  const session = await getAuthSessionWithRefresh();

  if (!session || !session.accessToken) {
    console.error("[Symulate] Not authenticated. Please login first.");
    return [];
  }

  try {
    // Call Supabase REST API to fetch organizations via organization_members join
    const response = await fetch(
      `${PLATFORM_CONFIG.api.rest}/organization_members?select=role,organization_id,organizations(id,name,slug,owner_user_id,created_at,updated_at)&user_id=eq.${session.userId}&order=joined_at.asc`,
      {
        headers: {
          apikey: PLATFORM_CONFIG.supabase.anonKey,
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[Symulate] Failed to fetch organizations:", error);
      return [];
    }

    const data = await response.json();

    // Transform the data to match Organization interface
    const organizations: Organization[] = data
      .filter((item: any) => item.organizations)
      .map((item: any) => {
        const org = Array.isArray(item.organizations)
          ? item.organizations[0]
          : item.organizations;

        return {
          ...org,
          user_role: item.role,
        };
      });

    return organizations;
  } catch (error) {
    console.error("[Symulate] Error fetching organizations:", error);
    return [];
  }
}

/**
 * Fetch all projects in an organization
 */
export async function getOrganizationProjects(
  organizationId: string
): Promise<Project[]> {
  const session = await getAuthSessionWithRefresh();

  if (!session || !session.accessToken) {
    console.error("[Symulate] Not authenticated. Please login first.");
    return [];
  }

  try {
    // Call Supabase REST API to fetch projects
    const response = await fetch(
      `${PLATFORM_CONFIG.api.rest}/projects?select=*&organization_id=eq.${organizationId}&is_active=eq.true&order=created_at.asc`,
      {
        headers: {
          apikey: PLATFORM_CONFIG.supabase.anonKey,
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("[Symulate] Failed to fetch projects:", error);
      return [];
    }

    const projects: Project[] = await response.json();
    return projects;
  } catch (error) {
    console.error("[Symulate] Error fetching projects:", error);
    return [];
  }
}

/**
 * Display organizations in a formatted table
 */
export function displayOrganizations(
  organizations: Organization[],
  currentOrgId?: string
): void {
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

/**
 * Display projects in a formatted table
 */
export function displayProjects(
  projects: Project[],
  currentProjectId?: string
): void {
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
