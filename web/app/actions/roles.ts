"use server";

import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { can, normalizeRole, ALL_ROLES } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";
import { revalidatePath } from "next/cache";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export async function listUsers(): Promise<ManagedUser[]> {
  const current = await requireUser();
  if (!can(current.role, "roles:manage")) {
    throw new Error("Forbidden: only admins can view user management.");
  }
  const rows = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      role: userTable.role,
      createdAt: userTable.createdAt,
    })
    .from(userTable)
    .orderBy(desc(userTable.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: normalizeRole(r.role),
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function updateUserRole(
  targetUserId: string,
  role: UserRole
): Promise<void> {
  const current = await requireUser();
  if (!can(current.role, "roles:manage")) {
    throw new Error("Forbidden: only admins can change roles.");
  }
  if (!ALL_ROLES.includes(role)) {
    throw new Error("Invalid role.");
  }
  // Prevent an admin from demoting themselves and locking everyone out.
  if (current.id === targetUserId && role !== "Admin") {
    throw new Error("You cannot change your own admin role.");
  }
  await db
    .update(userTable)
    .set({ role, updatedAt: new Date() })
    .where(eq(userTable.id, targetUserId));
  revalidatePath("/admin/users");
}
