import type { UserRole } from "./types";

/**
 * Central role-based permission model.
 *
 * Roles (from lib/types.ts):
 *  - Admin         → full access, manage users/roles + admin settings
 *  - Engineer      → create / edit / delete projects and run designs
 *  - Cost Engineer → edit CAPEX/BOM + save designs, but no project delete
 *  - Viewer        → read-only
 */
export type Permission =
  | "project:create"
  | "project:edit"
  | "project:delete"
  | "design:save"
  | "scada:import"
  | "scada:view"
  | "admin:manage"
  | "roles:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  Admin: [
    "project:create",
    "project:edit",
    "project:delete",
    "design:save",
    "scada:import",
    "scada:view",
    "admin:manage",
    "roles:manage",
  ],
  Engineer: [
    "project:create",
    "project:edit",
    "project:delete",
    "design:save",
    "scada:import",
    "scada:view",
  ],
  "Cost Engineer": ["project:edit", "design:save", "scada:view"],
  Viewer: ["scada:view"],
};

export const ALL_ROLES: UserRole[] = [
  "Admin",
  "Engineer",
  "Cost Engineer",
  "Viewer",
];

export function normalizeRole(role: string | null | undefined): UserRole {
  if (role && ALL_ROLES.includes(role as UserRole)) return role as UserRole;
  return "Engineer";
}

export function can(role: string | null | undefined, permission: Permission): boolean {
  return ROLE_PERMISSIONS[normalizeRole(role)].includes(permission);
}

export function roleDescription(role: UserRole): string {
  switch (role) {
    case "Admin":
      return "Full access, including user management and admin settings.";
    case "Engineer":
      return "Create, edit, and delete projects; run designs and import data.";
    case "Cost Engineer":
      return "Edit cost data and save designs; cannot delete projects.";
    case "Viewer":
      return "Read-only access to projects and data.";
  }
}
