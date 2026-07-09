"use server";

import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { scadaLog } from "@/lib/db/schema";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";

export type ScadaRow = {
  id: string;
  timestamp: string;
  acPowerKw: number | null;
  dcPowerKw: number | null;
  poaIrradiance: number | null;
  moduleTempC: number | null;
  ambientTempC: number | null;
};

export type ScadaInput = {
  timestamp: string;
  acPowerKw: number | null;
  dcPowerKw: number | null;
  poaIrradiance: number | null;
  moduleTempC: number | null;
  ambientTempC: number | null;
};

export type ScadaStats = {
  count: number;
  peakAcKw: number | null;
  avgPoa: number | null;
  maxModuleTempC: number | null;
  firstTimestamp: string | null;
  lastTimestamp: string | null;
};

export async function listScadaLogs(
  projectId: string,
  limit = 500
): Promise<ScadaRow[]> {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(scadaLog)
    .where(and(eq(scadaLog.projectId, projectId), eq(scadaLog.userId, user.id)))
    .orderBy(asc(scadaLog.timestamp))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp.toISOString(),
    acPowerKw: r.acPowerKw,
    dcPowerKw: r.dcPowerKw,
    poaIrradiance: r.poaIrradiance,
    moduleTempC: r.moduleTempC,
    ambientTempC: r.ambientTempC,
  }));
}

export async function getScadaStats(projectId: string): Promise<ScadaStats> {
  const user = await requireUser();
  const [row] = await db
    .select({
      count: sql<number>`count(*)::int`,
      peakAcKw: sql<number | null>`max(${scadaLog.acPowerKw})`,
      avgPoa: sql<number | null>`avg(${scadaLog.poaIrradiance})`,
      maxModuleTempC: sql<number | null>`max(${scadaLog.moduleTempC})`,
      firstTimestamp: sql<string | null>`min(${scadaLog.timestamp})`,
      lastTimestamp: sql<string | null>`max(${scadaLog.timestamp})`,
    })
    .from(scadaLog)
    .where(and(eq(scadaLog.projectId, projectId), eq(scadaLog.userId, user.id)));
  return {
    count: row?.count ?? 0,
    peakAcKw: row?.peakAcKw ?? null,
    avgPoa: row?.avgPoa ?? null,
    maxModuleTempC: row?.maxModuleTempC ?? null,
    firstTimestamp: row?.firstTimestamp
      ? new Date(row.firstTimestamp).toISOString()
      : null,
    lastTimestamp: row?.lastTimestamp
      ? new Date(row.lastTimestamp).toISOString()
      : null,
  };
}

export async function importScadaLogs(
  projectId: string,
  rows: ScadaInput[]
): Promise<{ inserted: number }> {
  const user = await requireUser();
  if (!can(user.role, "scada:import")) {
    throw new Error(
      `Forbidden: your role (${user.role}) cannot import SCADA data.`
    );
  }
  if (rows.length === 0) return { inserted: 0 };

  const values = rows.map((r) => ({
    id: `scada-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
    userId: user.id,
    projectId,
    timestamp: new Date(r.timestamp),
    acPowerKw: r.acPowerKw,
    dcPowerKw: r.dcPowerKw,
    poaIrradiance: r.poaIrradiance,
    moduleTempC: r.moduleTempC,
    ambientTempC: r.ambientTempC,
  }));

  // Insert in chunks to stay well under parameter limits.
  const chunkSize = 500;
  let inserted = 0;
  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, i + chunkSize);
    await db.insert(scadaLog).values(chunk);
    inserted += chunk.length;
  }
  return { inserted };
}

export async function clearScadaLogs(projectId: string): Promise<void> {
  const user = await requireUser();
  if (!can(user.role, "scada:import")) {
    throw new Error(
      `Forbidden: your role (${user.role}) cannot modify SCADA data.`
    );
  }
  await db
    .delete(scadaLog)
    .where(and(eq(scadaLog.projectId, projectId), eq(scadaLog.userId, user.id)));
}
