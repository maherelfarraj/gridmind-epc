"use client";

import type { LossStep } from "@/lib/simulation";
import { formatNumber } from "@/lib/format";

// A PVsyst-style PV loss cascade ("Sankey" loss diagram). Each step shows the
// energy flowing through, with a red branch for losses and a green branch for
// gains (transposition). Bar width is proportional to energy remaining.
export function LossDiagram({ losses, unit = "MWh/yr" }: { losses: LossStep[]; unit?: string }) {
  const start = losses[0]?.energy ?? 0;
  const end = losses[losses.length - 1]?.energy ?? 0;
  const max = Math.max(...losses.map((l) => l.energy), 1);

  return (
    <div className="space-y-1">
      {losses.map((step, i) => {
        const widthPct = Math.max((step.energy / max) * 100, 2);
        const isGain = step.gain > 0;
        const isSource = i === 0;
        const isFinal = i === losses.length - 1;
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className="w-44 shrink-0 text-right text-xs text-slate-600">{step.label}</div>
            <div className="relative flex-1">
              <div className="h-7 w-full rounded bg-slate-100">
                <div
                  className={`flex h-7 items-center rounded px-2 text-[11px] font-medium text-white transition-all ${
                    isSource
                      ? "bg-amber-500"
                      : isFinal
                        ? "bg-emerald-600"
                        : isGain
                          ? "bg-sky-500"
                          : "bg-blue-600"
                  }`}
                  style={{ width: `${widthPct}%` }}
                >
                  {formatNumber(step.energy)}
                </div>
              </div>
            </div>
            <div className="w-28 shrink-0 text-left text-xs">
              {isSource ? (
                <span className="text-slate-400">resource</span>
              ) : isGain ? (
                <span className="text-sky-600">+{formatNumber(step.gain)} gain</span>
              ) : step.loss > 0 ? (
                <span className="text-red-500">
                  -{formatNumber(step.loss)} ({step.lossPct.toFixed(1)}%)
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </div>
          </div>
        );
      })}

      <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
        <span className="text-slate-500">
          Energy delivered to grid ({start > 0 ? ((end / start) * 100).toFixed(1) : "0"}% of GHI-plane resource)
        </span>
        <span className="font-semibold text-emerald-700">
          {formatNumber(end)} {unit}
        </span>
      </div>
    </div>
  );
}
