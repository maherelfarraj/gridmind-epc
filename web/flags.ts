import { dedupe, flag } from "flags/next";

// Minimal shape of the cookie accessor passed to `identify`.
type CookieStore = { get(name: string): { value: string } | undefined };

// Feature flags for GridMind's progressive rollouts.
//
// These declarations use the Flags SDK. For local/demo use they resolve with a
// self-contained `decide` that buckets a visitor deterministically by the
// `pv_mind_visitor` cookie against a default traffic percentage. In production,
// swap `decide` for the Vercel adapter so the rollout percentage is managed from
// the Vercel dashboard / `vercel flags` CLI (see /rollouts/guide).

interface Entities {
  visitorId: string;
}

// Server-safe deterministic hash (FNV-1a) -> 0..1. Mirrors lib/rollouts.ts so
// server flag evaluation and the client control plane bucket visitors the same.
function hashUnit(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 0xffffffff;
}

// Default canary traffic per flag key (server source of truth). The in-app
// Rollout Dashboard overrides these live via localStorage on the client.
const ROLLOUT_DEFAULTS: Record<string, number> = {
  "yield-engine-v2": 25,
  "bess-degradation-model": 50,
  "cockpit-charts-v2": 15,
  "auto-stringing": 0
};

const identify = dedupe(({ cookies }: { cookies: CookieStore }): Entities => {
  return { visitorId: cookies.get("pv_mind_visitor")?.value ?? "anonymous" };
});

function rolloutFlag(key: string, description: string) {
  return flag<boolean, Entities>({
    key,
    description,
    defaultValue: false,
    options: [
      { value: false, label: "Control" },
      { value: true, label: "Canary" }
    ],
    identify,
    decide({ entities }) {
      const pct = ROLLOUT_DEFAULTS[key] ?? 0;
      if (pct <= 0) return false;
      if (pct >= 100) return true;
      const bucket = hashUnit(`${key}:${entities?.visitorId ?? "anonymous"}`) * 100;
      return bucket < pct;
    }
  });
}

export const yieldEngineV2 = rolloutFlag("yield-engine-v2", "New irradiance-transposition yield model.");
export const bessDegradationModel = rolloutFlag("bess-degradation-model", "Cycle-aware BESS degradation curves.");
export const cockpitChartsV2 = rolloutFlag("cockpit-charts-v2", "Redesigned cockpit dashboard visualizations.");
export const autoStringing = rolloutFlag("auto-stringing", "Automatic string sizing optimizer.");

export const rolloutFlags = {
  yieldEngineV2,
  bessDegradationModel,
  cockpitChartsV2,
  autoStringing
};
