"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  computeMetrics, metricSeries, recommend, STATUS_META,
  type CohortMetrics, type Rollout, type Verdict
} from "@/lib/rollouts";
import { ArrowUpCircle, RotateCcw, Pause, Play, TrendingUp, TrendingDown, Minus } from "lucide-react";

const CONTROL_COLOR = "#64748b"; // slate-500
const CANARY_COLOR = "#2563eb"; // blue-600

function deltaMeta(canary: number, control: number, lowerIsBetter: boolean) {
  const diff = canary - control;
  const isFlat = Math.abs(diff) < 0.001;
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  return {
    isFlat,
    good,
    className: isFlat ? "text-slate-500" : good ? "text-emerald-600" : "text-red-600",
    Icon: isFlat ? Minus : good ? (lowerIsBetter ? TrendingDown : TrendingUp) : lowerIsBetter ? TrendingUp : TrendingDown
  };
}

function MetricCompareRow({
  label, control, canary, unit, dp = 2, lowerIsBetter
}: {
  label: string; control: number; canary: number; unit?: string; dp?: number; lowerIsBetter: boolean;
}) {
  const m = deltaMeta(canary, control, lowerIsBetter);
  const diff = canary - control;
  const fmt = (n: number) => `${n.toFixed(dp)}${unit ?? ""}`;
  return (
    <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-2 border-b border-slate-100 py-2.5 text-sm last:border-0">
      <span className="text-slate-600">{label}</span>
      <span className="text-right font-medium text-slate-500">{fmt(control)}</span>
      <span className="text-right font-semibold text-slate-900">{fmt(canary)}</span>
      <span className={`flex items-center justify-end gap-1 font-medium ${m.className}`}>
        <m.Icon className="h-3.5 w-3.5" />
        {diff >= 0 ? "+" : ""}{diff.toFixed(dp)}{unit ?? ""}
      </span>
    </div>
  );
}

const VERDICT_STYLE: Record<Verdict, string> = {
  promote: "bg-emerald-50 border-emerald-200 text-emerald-900",
  hold: "bg-amber-50 border-amber-200 text-amber-900",
  rollback: "bg-red-50 border-red-200 text-red-900"
};

export function RolloutDetail({
  rollout,
  onPercentage,
  onPromote,
  onRollback,
  onPause,
  onResume
}: {
  rollout: Rollout;
  onPercentage: (pct: number) => void;
  onPromote: () => void;
  onRollback: () => void;
  onPause: () => void;
  onResume: () => void;
}) {
  const { control, canary } = computeMetrics(rollout);
  const series = metricSeries(rollout);
  const rec = recommend(rollout);
  const meta = STATUS_META[rollout.status];
  const isLive = rollout.status === "canary" || rollout.status === "paused";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">{rollout.name}</h2>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${meta.className}`}>{meta.label}</span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-slate-500">{rollout.description}</p>
          <p className="mt-1 font-mono text-xs text-slate-400">{rollout.key}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isLive && (
            <button onClick={onPromote} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              <ArrowUpCircle className="h-4 w-4" /> Promote to 100%
            </button>
          )}
          {rollout.status === "canary" && (
            <button onClick={onPause} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Pause className="h-4 w-4" /> Pause
            </button>
          )}
          {rollout.status === "paused" && (
            <button onClick={onResume} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Play className="h-4 w-4" /> Resume
            </button>
          )}
          {rollout.status !== "rolled_back" && rollout.status !== "draft" && (
            <button onClick={onRollback} className="flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              <RotateCcw className="h-4 w-4" /> Roll back
            </button>
          )}
        </div>
      </div>

      {/* Traffic split control */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Canary Traffic</h3>
          <span className="text-2xl font-bold text-blue-600">{rollout.percentage}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={rollout.percentage}
          onChange={(e) => onPercentage(Number(e.target.value))}
          className="w-full accent-blue-600"
          aria-label="Canary traffic percentage"
        />
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>0% (off)</span>
          <span>50%</span>
          <span>100% (all users)</span>
        </div>
        <div className="mt-4 flex gap-2">
          {[5, 10, 25, 50, 75].map((p) => (
            <button
              key={p}
              onClick={() => onPercentage(p)}
              className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                rollout.percentage === p ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {p}%
            </button>
          ))}
        </div>
        <div className="mt-4 flex overflow-hidden rounded-lg border border-slate-200 text-center text-xs font-medium">
          <div className="bg-blue-600 py-1.5 text-white" style={{ width: `${Math.max(rollout.percentage, 6)}%` }}>
            Canary {canary.users.toLocaleString()}
          </div>
          <div className="bg-slate-200 py-1.5 text-slate-600" style={{ width: `${Math.max(100 - rollout.percentage, 6)}%` }}>
            Control {control.users.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className={`rounded-xl border p-5 ${VERDICT_STYLE[rec.verdict]}`}>
        <p className="text-sm font-bold uppercase tracking-wide opacity-70">Recommendation</p>
        <p className="mt-1 text-lg font-semibold">{rec.headline}</p>
        <ul className="mt-3 space-y-1 text-sm">
          {rec.reasons.map((r, i) => (
            <li key={i} className="flex gap-2"><span aria-hidden>•</span><span>{r}</span></li>
          ))}
        </ul>
      </div>

      {/* Metric comparison table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Cohort Metrics</h3>
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-2 border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Metric</span>
          <span className="text-right">Control</span>
          <span className="text-right">Canary</span>
          <span className="text-right">Delta</span>
        </div>
        <MetricCompareRow label="Error rate" control={control.errorRatePct} canary={canary.errorRatePct} unit="%" dp={2} lowerIsBetter />
        <MetricCompareRow label="p95 latency" control={control.p95LatencyMs} canary={canary.p95LatencyMs} unit="ms" dp={0} lowerIsBetter />
        <MetricCompareRow label="Task success" control={control.taskSuccessPct} canary={canary.taskSuccessPct} unit="%" dp={1} lowerIsBetter={false} />
        <MetricCompareRow label="Avg session" control={control.avgSessionMin} canary={canary.avgSessionMin} unit=" min" dp={1} lowerIsBetter={false} />
      </div>

      {/* Trend charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Error Rate (%)" series={series} controlKey="controlErrorRate" canaryKey="canaryErrorRate" />
        <ChartCard title="p95 Latency (ms)" series={series} controlKey="controlLatency" canaryKey="canaryLatency" />
      </div>
    </div>
  );
}

function ChartCard({
  title, series, controlKey, canaryKey
}: {
  title: string;
  series: ReturnType<typeof metricSeries>;
  controlKey: "controlErrorRate" | "controlLatency";
  canaryKey: "canaryErrorRate" | "canaryLatency";
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 5, right: 10, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey={controlKey} name="Control" stroke={CONTROL_COLOR} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey={canaryKey} name="Canary" stroke={CANARY_COLOR} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export type { CohortMetrics };
