"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, KpiCard } from "@/components/ui-parts";
import { RolloutDetail } from "@/components/rollout-detail";
import { useRollouts } from "@/hooks/use-rollouts";
import {
  computeMetrics, recommend, STATUS_META,
  promoteRollout, rollbackRollout, pauseRollout, resumeRollout, setPercentage,
  type Rollout, type Verdict
} from "@/lib/rollouts";
import { Rocket, BookOpen, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const VERDICT_ICON: Record<Verdict, { Icon: typeof CheckCircle2; className: string }> = {
  promote: { Icon: CheckCircle2, className: "text-emerald-600" },
  hold: { Icon: AlertTriangle, className: "text-amber-500" },
  rollback: { Icon: XCircle, className: "text-red-600" }
};

function notifyChange() {
  window.dispatchEvent(new Event("rollouts:changed"));
}

export default function RolloutsPage() {
  const { rollouts, mounted, refresh, seed } = useRollouts();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedKey && rollouts.length > 0) setSelectedKey(rollouts[0].key);
  }, [rollouts, selectedKey]);

  const selected = useMemo(
    () => rollouts.find((r) => r.key === selectedKey) ?? null,
    [rollouts, selectedKey]
  );

  const summary = useMemo(() => {
    const live = rollouts.filter((r) => r.status === "canary" || r.status === "paused").length;
    const promoted = rollouts.filter((r) => r.status === "promoted").length;
    const atRisk = rollouts.filter((r) => (r.status === "canary" || r.status === "paused") && recommend(r).verdict === "rollback").length;
    return { live, promoted, atRisk, total: rollouts.length };
  }, [rollouts]);

  const act = (fn: () => void) => {
    fn();
    notifyChange();
    refresh();
  };

  if (!mounted) return <div className="min-h-[60vh]" />;

  if (rollouts.length === 0) {
    return (
      <div>
        <PageHeader title="Progressive Rollouts" description="Ship features to a fraction of users, compare metrics, then promote when ready." />
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <Rocket className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-900">No rollouts yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Load sample rollouts to explore staged deployments with cohort metric comparison and one-click promote or rollback.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <button onClick={seed} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
              Load Sample Rollouts
            </button>
            <Link href="/rollouts/guide" className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              How Vercel rollouts work
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Progressive Rollouts" description="Ship features to a fraction of users, compare metrics, then promote when ready." />
        <Link href="/rollouts/guide" className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <BookOpen className="h-4 w-4" /> Vercel rollouts guide
        </Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Rollouts" value={String(summary.total)} variant="slate" />
        <KpiCard title="Live Canaries" value={String(summary.live)} variant="blue" />
        <KpiCard title="Promoted" value={String(summary.promoted)} variant="emerald" />
        <KpiCard title="At Risk" value={String(summary.atRisk)} subtitle="Guardrail breached" variant="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* List */}
        <div className="space-y-3">
          {rollouts.map((r) => (
            <RolloutListItem
              key={r.key}
              rollout={r}
              active={r.key === selectedKey}
              onSelect={() => setSelectedKey(r.key)}
            />
          ))}
        </div>

        {/* Detail */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
          {selected ? (
            <RolloutDetail
              rollout={selected}
              onPercentage={(pct) => act(() => setPercentage(selected.key, pct))}
              onPromote={() => act(() => promoteRollout(selected.key))}
              onRollback={() => act(() => rollbackRollout(selected.key))}
              onPause={() => act(() => pauseRollout(selected.key))}
              onResume={() => act(() => resumeRollout(selected.key))}
            />
          ) : (
            <p className="py-12 text-center text-sm text-slate-400">Select a rollout to view metrics.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RolloutListItem({ rollout, active, onSelect }: { rollout: Rollout; active: boolean; onSelect: () => void }) {
  const meta = STATUS_META[rollout.status];
  const rec = recommend(rollout);
  const { canary, control } = computeMetrics(rollout);
  const isLive = rollout.status === "canary" || rollout.status === "paused";
  const v = VERDICT_ICON[rec.verdict];

  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-blue-300 ${
        active ? "border-blue-500 ring-1 ring-blue-500" : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-semibold text-slate-900">{rollout.name}</span>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}>{meta.label}</span>
      </div>
      <p className="mt-1 line-clamp-1 text-xs text-slate-500">{rollout.description}</p>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${rollout.percentage}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="text-slate-500">{rollout.percentage}% canary</span>
        {isLive && (
          <span className={`flex items-center gap-1 font-medium ${v.className}`}>
            <v.Icon className="h-3.5 w-3.5" />
            {rec.verdict === "promote" ? "Healthy" : rec.verdict === "hold" ? "Hold" : "Risk"}
          </span>
        )}
      </div>
      {isLive && (
        <p className="mt-1 text-[11px] text-slate-400">
          err {canary.errorRatePct}% vs {control.errorRatePct}% · p95 {canary.p95LatencyMs}ms vs {control.p95LatencyMs}ms
        </p>
      )}
    </button>
  );
}
