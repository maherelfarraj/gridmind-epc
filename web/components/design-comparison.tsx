"use client";

import { useState } from "react";
import { ArrowRight, GitCompareArrows, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DesignSummary } from "@/app/actions/design-history";

export type ComparisonOption = {
  id: string;
  label: string;
  summary: DesignSummary;
};

type MetricDef = {
  key: keyof Omit<DesignSummary, "currency">;
  label: string;
  unit: string;
  scale: number;
  decimals: number;
  isCurrency?: boolean;
  // Direction that counts as "favorable" for color coding. Cost down is good,
  // capacity/yield up is good, ratio is neutral.
  better: "up" | "down" | "neutral";
};

const METRICS: MetricDef[] = [
  { key: "dcCapacityKwp", label: "DC Capacity", unit: "MWp", scale: 1 / 1000, decimals: 2, better: "up" },
  { key: "acCapacityKw", label: "AC Capacity", unit: "MWac", scale: 1 / 1000, decimals: 2, better: "up" },
  { key: "dcAcRatio", label: "DC/AC Ratio", unit: "", scale: 1, decimals: 3, better: "neutral" },
  { key: "annualYieldKwhKwp", label: "Specific Yield", unit: "kWh/kWp", scale: 1, decimals: 0, better: "up" },
  { key: "totalCapex", label: "Total CAPEX", unit: "", scale: 1, decimals: 0, isCurrency: true, better: "down" },
];

function formatValue(m: MetricDef, summary: DesignSummary): string {
  const raw = summary[m.key] * m.scale;
  if (m.isCurrency) return formatCurrency(summary[m.key], summary.currency);
  return `${formatNumber(raw, m.decimals)}${m.unit ? ` ${m.unit}` : ""}`;
}

export function DesignComparison({ options }: { options: ComparisonOption[] }) {
  const [aId, setAId] = useState(options[0]?.id ?? "");
  const [bId, setBId] = useState(options[1]?.id ?? options[0]?.id ?? "");

  const a = options.find((o) => o.id === aId);
  const b = options.find((o) => o.id === bId);

  if (options.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <GitCompareArrows className="mb-3 h-8 w-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">Need at least two designs to compare</p>
        <p className="mt-1 text-xs text-slate-400">
          Save a snapshot to compare it against your current design.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Version A (baseline)</label>
          <select
            value={aId}
            onChange={(e) => setAId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="pb-2 text-slate-400">
          <ArrowRight className="h-4 w-4" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Version B (comparison)</label>
          <select
            value={bId}
            onChange={(e) => setBId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {a && b && (
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5 font-medium">Metric</th>
                <th className="px-4 py-2.5 text-right font-medium">A</th>
                <th className="px-4 py-2.5 text-right font-medium">B</th>
                <th className="px-4 py-2.5 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => {
                const av = a.summary[m.key];
                const bv = b.summary[m.key];
                const delta = bv - av;
                const pct = av !== 0 ? (delta / Math.abs(av)) * 100 : 0;
                const isSame = Math.abs(delta) < 1e-9;

                let tone = "text-slate-500";
                if (!isSame && m.better !== "neutral") {
                  const favorable =
                    (m.better === "up" && delta > 0) || (m.better === "down" && delta < 0);
                  tone = favorable ? "text-emerald-600" : "text-red-600";
                }

                const Icon = isSame ? Minus : delta > 0 ? TrendingUp : TrendingDown;

                return (
                  <tr key={m.key} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-slate-700">{m.label}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                      {formatValue(m, a.summary)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                      {formatValue(m, b.summary)}
                    </td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${tone}`}>
                      <span className="inline-flex items-center justify-end gap-1">
                        <Icon className="h-3.5 w-3.5" />
                        {isSame ? "—" : `${pct > 0 ? "+" : ""}${formatNumber(pct, 1)}%`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
