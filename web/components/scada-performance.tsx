"use client";

import { useMemo } from "react";
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Activity, Gauge, TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/format";
import { defaultSimInputs } from "@/lib/simulation";
import type { Project } from "@/lib/types";
import type { ScadaRow } from "@/app/actions/scada";

// Expected (modeled) AC power from measured weather, using the project's
// nameplate + loss chain. This is the standard "expected power" reference used
// to compute a measured-vs-modeled performance ratio during commissioning/O&M.
function expectedAcKw(
  poaWm2: number,
  moduleTempC: number | null,
  ambientTempC: number | null,
  inp: ReturnType<typeof defaultSimInputs>
): number {
  if (!(poaWm2 > 0)) return 0;
  const dcKwp = inp.dcCapacityMwp * 1000;
  const acCapKw = inp.acCapacityMwac * 1000;

  // Cell temperature: prefer measured module temp, else NOCT-style estimate.
  const tCell =
    moduleTempC != null
      ? moduleTempC
      : (ambientTempC ?? 25) + (poaWm2 / 800) * 29;
  const tempDerate = 1 + (inp.tempCoeffPowerPctPerC / 100) * (tCell - 25);

  const dcSide =
    (poaWm2 / 1000) *
    dcKwp *
    Math.max(tempDerate, 0.5) *
    (1 - inp.soiling) *
    (1 - inp.lidQuality) *
    (1 - inp.mismatch) *
    (1 - inp.dcOhmic);

  const acSide =
    dcSide *
    inp.inverterEfficiency *
    (1 - inp.acOhmic) *
    (1 - inp.transformer) *
    inp.availability;

  return Math.min(Math.max(acSide, 0), acCapKw);
}

export function ScadaPerformance({
  project,
  rows,
}: {
  project: Project;
  rows: ScadaRow[];
}) {
  const inp = useMemo(() => defaultSimInputs(project), [project]);

  const { chartData, sumMeasured, sumExpected, comparable } = useMemo(() => {
    let sumMeasured = 0;
    let sumExpected = 0;
    let comparable = 0;
    const chartData = rows
      .filter((r) => r.poaIrradiance != null && r.acPowerKw != null)
      .map((r) => {
        const expected = expectedAcKw(
          r.poaIrradiance as number,
          r.moduleTempC,
          r.ambientTempC,
          inp
        );
        const measured = r.acPowerKw as number;
        sumMeasured += measured;
        sumExpected += expected;
        comparable += 1;
        return {
          time: new Date(r.timestamp).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
          }),
          measured: Math.round(measured),
          expected: Math.round(expected),
        };
      });
    return { chartData, sumMeasured, sumExpected, comparable };
  }, [rows, inp]);

  if (comparable === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Gauge className="mb-3 h-8 w-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">
          No comparable data points
        </p>
        <p className="mt-1 max-w-xs text-xs text-slate-400">
          The overlay needs SCADA rows with both POA irradiance and AC power to
          model expected output. Import a log that includes an irradiance column.
        </p>
      </div>
    );
  }

  const performanceRatio = sumExpected > 0 ? (sumMeasured / sumExpected) * 100 : 0;
  const avgMeasured = sumMeasured / comparable;
  const avgExpected = sumExpected / comparable;

  // A PR near/above 100% means the plant meets or beats the model; well under
  // 100% flags underperformance (soiling, faults, curtailment, degradation).
  const prTone =
    performanceRatio >= 95
      ? "text-emerald-600"
      : performanceRatio >= 85
        ? "text-amber-600"
        : "text-red-600";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Performance Ratio
            </span>
          </div>
          <p className={`text-2xl font-bold ${prTone}`}>
            {formatNumber(performanceRatio, 1)}%
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">measured vs modeled</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Avg Measured
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatNumber(avgMeasured, 0)} kW
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{comparable} points</p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-1.5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-slate-500" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Avg Expected
            </span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {formatNumber(avgExpected, 0)} kW
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">from measured POA</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={40} />
          <YAxis tick={{ fontSize: 11 }} label={{ value: "AC kW", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "#64748b" } }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="expected"
            name="Expected (modeled)"
            stroke="#3b82f6"
            strokeDasharray="5 4"
            dot={false}
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="measured"
            name="Measured (SCADA)"
            stroke="#10b981"
            dot={false}
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
