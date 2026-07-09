"use client";

import Link from "next/link";
import { FlaskConical, Users } from "lucide-react";
import { useFeatureRollout } from "@/hooks/use-rollouts";

// Small inline badge showing which cohort the current visitor is in for a
// given rollout. Demonstrates the flag resolving live on the client.
export function CohortBadge({ featureKey }: { featureKey: string }) {
  const { cohort, rollout, mounted } = useFeatureRollout(featureKey);
  if (!mounted || !rollout || rollout.status === "draft" || rollout.status === "rolled_back") return null;

  const isCanary = cohort === "canary";
  return (
    <Link
      href="/rollouts"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
        isCanary
          ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
      }`}
      title={`You are in the ${cohort} cohort for "${rollout.name}" (${rollout.percentage}% canary)`}
    >
      {isCanary ? <FlaskConical className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
      {isCanary ? "Canary" : "Control"}
    </Link>
  );
}

// Renders children only when the current visitor is in the canary cohort for
// the given rollout. `fallback` renders for the control cohort.
export function RolloutGate({
  featureKey,
  children,
  fallback = null
}: {
  featureKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { enabled, mounted } = useFeatureRollout(featureKey);
  if (!mounted) return null;
  return <>{enabled ? children : fallback}</>;
}
