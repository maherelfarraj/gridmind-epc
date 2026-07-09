"use client";

// Progressive deployment rollout engine.
// Client-side, localStorage-backed control plane that models staged rollouts:
// ship a feature to a fraction of visitors (canary), compare cohort metrics
// against the control group, then promote to 100% or roll back.

export type RolloutStatus = "draft" | "canary" | "paused" | "promoted" | "rolled_back";
export type HealthProfile = "healthy" | "mixed" | "regressed";

export interface CohortMetrics {
  users: number;
  errorRatePct: number;
  p95LatencyMs: number;
  taskSuccessPct: number;
  avgSessionMin: number;
}

export interface MetricPoint {
  label: string;
  controlErrorRate: number;
  canaryErrorRate: number;
  controlLatency: number;
  canaryLatency: number;
}

export interface Rollout {
  key: string;
  name: string;
  description: string;
  status: RolloutStatus;
  percentage: number; // share of visitors in the canary cohort (0-100)
  profile: HealthProfile;
  createdAt: string;
  updatedAt: string;
  history: { at: string; event: string }[];
}

const ROLLOUTS_KEY = "pv_mind_rollouts";
const VISITOR_KEY = "pv_mind_visitor";

/* ------------------------------------------------------------------ */
/* Visitor identity + deterministic bucketing                          */
/* ------------------------------------------------------------------ */

export function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `v-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

// Stable string hash (FNV-1a) -> 0..1
function hashUnit(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // >>> 0 keeps it unsigned; divide by max uint32
  return (h >>> 0) / 0xffffffff;
}

// Which cohort is this visitor in for a given rollout?
export function cohortFor(rollout: Rollout, visitorId: string): "canary" | "control" {
  const bucket = hashUnit(`${rollout.key}:${visitorId}`) * 100;
  return bucket < rollout.percentage ? "canary" : "control";
}

// Is the feature enabled for this visitor right now?
export function isEnabledFor(rollout: Rollout, visitorId: string): boolean {
  if (rollout.status === "promoted") return true;
  if (rollout.status === "rolled_back" || rollout.status === "draft") return false;
  // canary or paused: bucket by percentage
  return cohortFor(rollout, visitorId) === "canary";
}

/* ------------------------------------------------------------------ */
/* Seeded metric simulation                                            */
/* ------------------------------------------------------------------ */

function seeded(seed: string) {
  let s = Math.floor(hashUnit(seed) * 0xffffffff) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000) / 1000;
  };
}

// Control cohort baseline is stable per rollout; canary is derived from the
// health profile so "compare then promote" produces a meaningful signal.
export function computeMetrics(rollout: Rollout): { control: CohortMetrics; canary: CohortMetrics } {
  const rnd = seeded(rollout.key);
  const totalUsers = 1800 + Math.floor(rnd() * 2600);
  const canaryUsers = Math.round((totalUsers * rollout.percentage) / 100);
  const controlUsers = totalUsers - canaryUsers;

  const baseError = 0.6 + rnd() * 0.9; // 0.6% - 1.5%
  const baseLatency = 320 + Math.floor(rnd() * 180); // 320 - 500 ms
  const baseSuccess = 92 + rnd() * 4; // 92% - 96%
  const baseSession = 6 + rnd() * 4; // 6 - 10 min

  const profileDelta = {
    healthy: { err: 0.65, lat: 0.9, success: 1.03, session: 1.12 },
    mixed: { err: 1.05, lat: 1.18, success: 1.0, session: 1.05 },
    regressed: { err: 2.4, lat: 1.5, success: 0.94, session: 0.9 }
  }[rollout.profile];

  return {
    control: {
      users: controlUsers,
      errorRatePct: round(baseError, 2),
      p95LatencyMs: Math.round(baseLatency),
      taskSuccessPct: round(baseSuccess, 1),
      avgSessionMin: round(baseSession, 1)
    },
    canary: {
      users: canaryUsers,
      errorRatePct: round(baseError * profileDelta.err, 2),
      p95LatencyMs: Math.round(baseLatency * profileDelta.lat),
      taskSuccessPct: round(Math.min(99.5, baseSuccess * profileDelta.success), 1),
      avgSessionMin: round(baseSession * profileDelta.session, 1)
    }
  };
}

export function metricSeries(rollout: Rollout): MetricPoint[] {
  const rnd = seeded(`${rollout.key}:series`);
  const { control, canary } = computeMetrics(rollout);
  const labels = ["-6h", "-5h", "-4h", "-3h", "-2h", "-1h", "now"];
  return labels.map((label, i) => {
    const drift = i / (labels.length - 1); // ramp toward current values
    const noise = () => 0.85 + rnd() * 0.3;
    return {
      label,
      controlErrorRate: round(control.errorRatePct * noise(), 2),
      canaryErrorRate: round((control.errorRatePct + (canary.errorRatePct - control.errorRatePct) * drift) * noise(), 2),
      controlLatency: Math.round(control.p95LatencyMs * noise()),
      canaryLatency: Math.round((control.p95LatencyMs + (canary.p95LatencyMs - control.p95LatencyMs) * drift) * noise())
    };
  });
}

/* ------------------------------------------------------------------ */
/* Guardrail-based recommendation                                      */
/* ------------------------------------------------------------------ */

export type Verdict = "promote" | "hold" | "rollback";

export interface Recommendation {
  verdict: Verdict;
  headline: string;
  reasons: string[];
}

export function recommend(rollout: Rollout): Recommendation {
  const { control, canary } = computeMetrics(rollout);
  const reasons: string[] = [];

  const errAbsDelta = round(canary.errorRatePct - control.errorRatePct, 2);
  const errRelDelta = control.errorRatePct > 0 ? canary.errorRatePct / control.errorRatePct : 1;
  const latRelDelta = canary.p95LatencyMs / control.p95LatencyMs;
  const successDelta = round(canary.taskSuccessPct - control.taskSuccessPct, 1);

  let verdict: Verdict = "promote";

  // Hard guardrail: error-rate regression -> rollback
  if (errRelDelta >= 1.5 || errAbsDelta >= 1.0) {
    verdict = "rollback";
    reasons.push(`Error rate up ${errAbsDelta >= 0 ? "+" : ""}${errAbsDelta}pp vs control (${control.errorRatePct}% → ${canary.errorRatePct}%).`);
  }
  // Latency guardrail -> hold at minimum
  if (latRelDelta >= 1.3) {
    if (verdict !== "rollback") verdict = "hold";
    reasons.push(`p95 latency ${Math.round((latRelDelta - 1) * 100)}% higher in canary (${control.p95LatencyMs}ms → ${canary.p95LatencyMs}ms).`);
  }
  // Sample size guardrail -> hold
  if (canary.users < 400 && verdict === "promote") {
    verdict = "hold";
    reasons.push(`Canary sample small (${canary.users.toLocaleString()} users) — ramp further before promoting.`);
  }

  if (verdict === "promote") {
    reasons.push(`Error rate ${errAbsDelta <= 0 ? "improved" : "within guardrail"} (${canary.errorRatePct}% vs ${control.errorRatePct}%).`);
    reasons.push(`Latency healthy (${canary.p95LatencyMs}ms vs ${control.p95LatencyMs}ms).`);
    if (successDelta >= 0) reasons.push(`Task success ${successDelta >= 0 ? "+" : ""}${successDelta}pp in canary.`);
  }

  const headline = {
    promote: "Canary is healthy — safe to promote to 100%.",
    hold: "Hold at current split — signal is not yet conclusive.",
    rollback: "Regression detected — roll back recommended."
  }[verdict];

  return { verdict, headline, reasons };
}

/* ------------------------------------------------------------------ */
/* Persistence + lifecycle actions                                     */
/* ------------------------------------------------------------------ */

function round(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

function nowIso() {
  return new Date().toISOString();
}

export function getRollouts(): Rollout[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROLLOUTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Rollout[];
  } catch {
    return [];
  }
}

export function saveRollouts(rollouts: Rollout[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLLOUTS_KEY, JSON.stringify(rollouts));
}

export function getRollout(key: string): Rollout | null {
  return getRollouts().find((r) => r.key === key) ?? null;
}

export function upsertRollout(rollout: Rollout): void {
  const list = getRollouts();
  const idx = list.findIndex((r) => r.key === rollout.key);
  const updated = { ...rollout, updatedAt: nowIso() };
  if (idx >= 0) list[idx] = updated;
  else list.push(updated);
  saveRollouts(list);
}

export function deleteRollout(key: string): void {
  saveRollouts(getRollouts().filter((r) => r.key !== key));
}

function withHistory(r: Rollout, event: string): Rollout {
  return { ...r, updatedAt: nowIso(), history: [{ at: nowIso(), event }, ...r.history].slice(0, 20) };
}

export function setPercentage(key: string, pct: number): void {
  const r = getRollout(key);
  if (!r) return;
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const status: RolloutStatus = clamped === 0 ? "draft" : clamped >= 100 ? "promoted" : "canary";
  upsertRollout(withHistory({ ...r, percentage: clamped, status }, `Set traffic to ${clamped}%`));
}

export function promoteRollout(key: string): void {
  const r = getRollout(key);
  if (!r) return;
  upsertRollout(withHistory({ ...r, percentage: 100, status: "promoted" }, "Promoted to 100%"));
}

export function rollbackRollout(key: string): void {
  const r = getRollout(key);
  if (!r) return;
  upsertRollout(withHistory({ ...r, percentage: 0, status: "rolled_back" }, "Rolled back to 0%"));
}

export function pauseRollout(key: string): void {
  const r = getRollout(key);
  if (!r) return;
  upsertRollout(withHistory({ ...r, status: "paused" }, `Paused at ${r.percentage}%`));
}

export function resumeRollout(key: string): void {
  const r = getRollout(key);
  if (!r) return;
  upsertRollout(withHistory({ ...r, status: "canary" }, `Resumed at ${r.percentage}%`));
}

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

export const SEED_ROLLOUTS: Rollout[] = [
  {
    key: "yield-engine-v2",
    name: "Yield Engine v2",
    description: "New irradiance-transposition yield model with hourly loss stacking.",
    status: "canary",
    percentage: 25,
    profile: "healthy",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    history: [{ at: nowIso(), event: "Started canary at 25%" }]
  },
  {
    key: "bess-degradation-model",
    name: "BESS Degradation Model",
    description: "Cycle-aware battery degradation curves in the BESS configurator.",
    status: "canary",
    percentage: 50,
    profile: "mixed",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    history: [{ at: nowIso(), event: "Started canary at 10%" }, { at: nowIso(), event: "Ramped to 50%" }]
  },
  {
    key: "cockpit-charts-v2",
    name: "Cockpit Charts v2",
    description: "Redesigned dashboard visualizations with interactive drill-downs.",
    status: "canary",
    percentage: 15,
    profile: "regressed",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    history: [{ at: nowIso(), event: "Started canary at 15%" }]
  },
  {
    key: "auto-stringing",
    name: "Auto-Stringing Optimizer",
    description: "Automatic string sizing suggestions based on inverter MPPT windows.",
    status: "draft",
    percentage: 0,
    profile: "healthy",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    history: [{ at: nowIso(), event: "Created" }]
  }
];

export function seedRollouts(): void {
  saveRollouts(SEED_ROLLOUTS.map((r) => ({ ...r, createdAt: nowIso(), updatedAt: nowIso() })));
}

export const STATUS_META: Record<RolloutStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
  canary: { label: "Canary", className: "bg-blue-50 text-blue-700 border-blue-200" },
  paused: { label: "Paused", className: "bg-amber-50 text-amber-700 border-amber-200" },
  promoted: { label: "Promoted", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rolled_back: { label: "Rolled back", className: "bg-red-50 text-red-700 border-red-200" }
};
