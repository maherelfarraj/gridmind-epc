"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminSettings, project } from "@/lib/db/schema";
import type { AdminSettings, Project } from "@/lib/types";
import { requireUser } from "@/lib/session";
import { can, type Permission } from "@/lib/permissions";

type ProjectData = Omit<Project, "id" | "createdAt" | "updatedAt">;

async function getUserId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}

async function requirePermission(permission: Permission): Promise<string> {
  const user = await requireUser();
  if (!can(user.role, permission)) {
    throw new Error(`Forbidden: your role (${user.role}) cannot perform this action.`);
  }
  return user.id;
}

function rowToProject(row: typeof project.$inferSelect): Project {
  const data = row.data as ProjectData;
  return {
    ...data,
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listProjects(): Promise<Project[]> {
  const userId = await getUserId();
  const rows = await db
    .select()
    .from(project)
    .where(eq(project.userId, userId))
    .orderBy(desc(project.updatedAt));
  return rows.map(rowToProject);
}

export async function createProjectAction(data: ProjectData): Promise<Project> {
  const userId = await requirePermission("project:create");
  const id = `proj-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const [row] = await db
    .insert(project)
    .values({
      id,
      userId,
      name: data.info.projectName || "Untitled Project",
      projectType: data.info.projectType,
      location: [data.info.city, data.info.country].filter(Boolean).join(", "),
      data,
    })
    .returning();
  return rowToProject(row);
}

export async function saveProjectAction(full: Project): Promise<Project> {
  const userId = await requirePermission("project:edit");
  const { id, createdAt, updatedAt, ...data } = full;
  const [row] = await db
    .update(project)
    .set({
      name: data.info.projectName || "Untitled Project",
      projectType: data.info.projectType,
      location: [data.info.city, data.info.country].filter(Boolean).join(", "),
      data,
      updatedAt: new Date(),
    })
    .where(and(eq(project.id, id), eq(project.userId, userId)))
    .returning();
  if (!row) throw new Error("Project not found");
  return rowToProject(row);
}

export async function deleteProjectAction(id: string): Promise<void> {
  const userId = await requirePermission("project:delete");
  await db.delete(project).where(and(eq(project.id, id), eq(project.userId, userId)));
}

export async function getAdminSettingsAction(): Promise<AdminSettings | null> {
  const userId = await getUserId();
  const [row] = await db
    .select()
    .from(adminSettings)
    .where(eq(adminSettings.userId, userId));
  return row ? (row.data as AdminSettings) : null;
}

export async function saveAdminSettingsAction(settings: AdminSettings): Promise<void> {
  const userId = await requirePermission("admin:manage");
  await db
    .insert(adminSettings)
    .values({ userId, data: settings })
    .onConflictDoUpdate({
      target: adminSettings.userId,
      set: { data: settings, updatedAt: new Date() },
    });
}
