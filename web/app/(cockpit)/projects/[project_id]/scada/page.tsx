"use client";

import { useCallback, useEffect, useState } from "react";
import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card } from "@/components/ui-parts";
import { ScadaImport } from "@/components/scada-import";
import { useApp } from "@/context/app-context";
import { useToast } from "@/components/toast-provider";
import { formatNumber } from "@/lib/format";
import {
  listScadaLogs,
  getScadaStats,
  clearScadaLogs,
  type ScadaRow,
  type ScadaStats,
} from "@/app/actions/scada";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Database, Trash2, Zap, Sun, Thermometer } from "lucide-react";

export default function ScadaPage() {
  const { project } = useProjectPage();
  const { can } = useApp();
  const { showToast } = useToast();

  const [rows, setRows] = useState<ScadaRow[]>([]);
  const [stats, setStats] = useState<ScadaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const projectId = project?.id;
  const canImport = can("scada:import");

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [logs, s] = await Promise.all([
        listScadaLogs(projectId, 500),
        getScadaStats(projectId),
      ]);
      setRows(logs);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!project) return <ProjectNotFound />;

  const handleClear = async () => {
    if (!canImport || !projectId) return;
    if (!confirm("Delete all SCADA data for this project? This cannot be undone.")) return;
    setClearing(true);
    try {
      await clearScadaLogs(projectId);
      showToast("SCADA data cleared", "success");
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to clear", "warning");
    } finally {
      setClearing(false);
    }
  };

  const chartData = rows.map((r) => ({
    time: new Date(r.timestamp).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
    }),
    ac: r.acPowerKw,
    poa: r.poaIrradiance,
  }));

  return (
    <div>
      <PageHeader
        title="SCADA Data"
        description="Time-series operational telemetry: power, irradiance, and temperatures."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<Database className="h-4 w-4 text-blue-600" />}
          label="Records"
          value={stats ? stats.count.toLocaleString() : "—"}
        />
        <StatTile
          icon={<Zap className="h-4 w-4 text-emerald-600" />}
          label="Peak AC Power"
          value={stats?.peakAcKw != null ? `${formatNumber(stats.peakAcKw, 0)} kW` : "—"}
        />
        <StatTile
          icon={<Sun className="h-4 w-4 text-amber-500" />}
          label="Avg POA"
          value={stats?.avgPoa != null ? `${formatNumber(stats.avgPoa, 0)} W/m²` : "—"}
        />
        <StatTile
          icon={<Thermometer className="h-4 w-4 text-red-500" />}
          label="Max Module Temp"
          value={stats?.maxModuleTempC != null ? `${formatNumber(stats.maxModuleTempC, 1)} °C` : "—"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {rows.length > 0 && (
            <Card title="AC Power & Irradiance">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={40} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="ac"
                    name="AC Power (kW)"
                    stroke="#10b981"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="poa"
                    name="POA (W/m²)"
                    stroke="#f59e0b"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          <Card title={`Telemetry Records${rows.length >= 500 ? " (latest 500)" : ""}`}>
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading data...</p>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Database className="mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No SCADA data yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Import a CSV log to populate the table.
                </p>
              </div>
            ) : (
              <div className="max-h-[480px] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-2 font-semibold">Timestamp</th>
                      <th className="px-3 py-2 text-right font-semibold">AC kW</th>
                      <th className="px-3 py-2 text-right font-semibold">DC kW</th>
                      <th className="px-3 py-2 text-right font-semibold">POA W/m²</th>
                      <th className="px-3 py-2 text-right font-semibold">Mod °C</th>
                      <th className="px-3 py-2 text-right font-semibold">Amb °C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0">
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                          {new Date(r.timestamp).toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                          {r.acPowerKw != null ? formatNumber(r.acPowerKw, 0) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                          {r.dcPowerKw != null ? formatNumber(r.dcPowerKw, 0) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                          {r.poaIrradiance != null ? formatNumber(r.poaIrradiance, 0) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                          {r.moduleTempC != null ? formatNumber(r.moduleTempC, 1) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                          {r.ambientTempC != null ? formatNumber(r.ambientTempC, 1) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Import SCADA Log">
            {canImport ? (
              <ScadaImport projectId={project.id} onImported={load} />
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                Your role has read-only access to SCADA data.
              </p>
            )}
          </Card>

          {canImport && rows.length > 0 && (
            <Card title="Danger Zone">
              <button
                onClick={handleClear}
                disabled={clearing}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {clearing ? "Clearing..." : "Clear All Data"}
              </button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
