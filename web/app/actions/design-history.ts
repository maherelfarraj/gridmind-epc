"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { designHistory } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import type { Project } from "@/lib/types";

export type DesignSummary = {
  dcCapacityKwp: number;
  acCapacityKw: number;
  dcAcRatio: number;
  annualYieldKwhKwp: number;
  totalCapex: number;
  currency: string;
};

export type DesignHistoryEntry = {
  id: string;
  label: string;
  authorName: string | null;
  summary: DesignSummary;
  createdAt: string;
};

export async function listDesignHistory(
  projectId: string
): Promise<DesignHistoryEntry[]> {
  const user = await requireUser();
  const rows = await db
    .select({
      id: designHistory.id,
      label: designHistory.label,
      authorName: designHistory.authorName,
      summary: designHistory.summary,
      createdAt: designHistory.createdAt,
    })
    .from(designHistory)
    .where(
      and(
        eq(designHistory.projectId, projectId),
        eq(designHistory.userId, user.id)
      )
    )
    .orderBy(desc(designHistory.createdAt));
  return rows.map((r) => ({
    id: r.id,
    label: r.label,
    authorName: r.authorName,
    summary: r.summary as DesignSummary,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function saveDesignSnapshot(
  projectId: string,
  label: string,
  summary: DesignSummary,
  snapshot: Project
): Promise<DesignHistoryEntry> {
  const user = await requireUser();
  if (!can(user.role, "design:save")) {
    throw new Error(
      `Forbidden: your role (${user.role}) cannot save designs.`
    );
  }
  const id = `dh-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const [row] = await db
    .insert(designHistory)
    .values({
      id,
      userId: user.id,
      projectId,
      label: label.trim() || "Untitled snapshot",
      authorName: user.name,
      summary,
      snapshot,
    })
    .returning();
  return {
    id: row.id,
    label: row.label,
    authorName: row.authorName,
    summary: row.summary as DesignSummary,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function getDesignSnapshot(id: string): Promise<Project | null> {
  const user = await requireUser();
  const [row] = await db
    .select({ snapshot: designHistory.snapshot })
    .from(designHistory)
    .where(and(eq(designHistory.id, id), eq(designHistory.userId, user.id)))
    .limit(1);
  return row ? (row.snapshot as Project) : null;
}

export async function deleteDesignSnapshot(id: string): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "design:save")) {
    throw new Error(
      `Forbidden: your role (${user.role}) cannot modify design history.`
    );
  }
  await db
    .delete(designHistory)
    .where(and(eq(designHistory.id, id), eq(designHistory.userId, user.id)));
}
