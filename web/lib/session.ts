import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { normalizeRole } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

/**
 * Returns the current session user with their role resolved from the DB,
 * or null when unauthenticated. Role lives on the `user` table.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const rows = await db
    .select({ role: userTable.role })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: normalizeRole(rows[0]?.role),
  };
}

/** Throws when unauthenticated; otherwise returns the session user + id. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
