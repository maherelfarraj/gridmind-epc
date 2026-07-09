"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getRollouts,
  getVisitorId,
  isEnabledFor,
  seedRollouts,
  type Rollout
} from "@/lib/rollouts";

// Keep the visitor cookie in sync with the localStorage visitor id so that
// server-side Flags SDK evaluation buckets the same visitor identically.
function syncVisitorCookie(visitorId: string) {
  if (typeof document === "undefined") return;
  document.cookie = `pv_mind_visitor=${visitorId}; path=/; max-age=31536000; SameSite=Lax`;
}

export function useRollouts() {
  const [rollouts, setRollouts] = useState<Rollout[]>([]);
  const [visitorId, setVisitorId] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    setRollouts(getRollouts());
  }, []);

  useEffect(() => {
    const vid = getVisitorId();
    setVisitorId(vid);
    syncVisitorCookie(vid);
    refresh();
    setMounted(true);
  }, [refresh]);

  const seed = useCallback(() => {
    seedRollouts();
    refresh();
  }, [refresh]);

  return { rollouts, visitorId, mounted, refresh, seed };
}

// Single-feature gate for client components. Returns whether the current
// visitor is in the canary cohort for the given rollout key.
export function useFeatureRollout(key: string): {
  enabled: boolean;
  cohort: "canary" | "control";
  rollout: Rollout | null;
  mounted: boolean;
} {
  const [state, setState] = useState<{ enabled: boolean; rollout: Rollout | null; mounted: boolean }>({
    enabled: false,
    rollout: null,
    mounted: false
  });

  useEffect(() => {
    const vid = getVisitorId();
    syncVisitorCookie(vid);
    const rollout = getRollouts().find((r) => r.key === key) ?? null;
    const enabled = rollout ? isEnabledFor(rollout, vid) : false;
    setState({ enabled, rollout, mounted: true });

    // React to changes made in the Rollout Dashboard (other tabs) or same tab.
    const onStorage = () => {
      const r = getRollouts().find((x) => x.key === key) ?? null;
      setState({ enabled: r ? isEnabledFor(r, vid) : false, rollout: r, mounted: true });
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("rollouts:changed", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("rollouts:changed", onStorage);
    };
  }, [key]);

  return {
    enabled: state.enabled,
    cohort: state.enabled ? "canary" : "control",
    rollout: state.rollout,
    mounted: state.mounted
  };
}
