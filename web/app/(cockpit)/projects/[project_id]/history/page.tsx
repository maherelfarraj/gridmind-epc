"use client";

import { useCallback, useEffect, useState } from "react";
import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card } from "@/components/ui-parts";
import { useApp } from "@/context/app-context";
import { useToast } from "@/components/toast-provider";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  listDesignHistory,
  saveDesignSnapshot,
  getDesignSnapshot,
  deleteDesignSnapshot,
  type DesignHistoryEntry,
  type DesignSummary,
} from "@/app/actions/design-history";
import { History, Save, RotateCcw, Trash2, Clock, User } from "lucide-react";
import { DesignComparison, type ComparisonOption } from "@/components/design-comparison";

export default function DesignHistoryPage() {
  const { project, calcs, save } = useProjectPage();
  const { can, updateProject } = useApp();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<DesignHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const projectId = project?.id;
  const canSave = can("design:save");

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const list = await listDesignHistory(projectId);
      setEntries(list);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!project) return <ProjectNotFound />;
  if (!calcs) return null;

  const currency = project.info.currency || "USD";

  const currentSummary: DesignSummary = {
    dcCapacityKwp: (project.capacity.pvDcCapacityMwp ?? 0) * 1000,
    acCapacityKw: (project.capacity.pvAcCapacityMwac ?? 0) * 1000,
    dcAcRatio: calcs.pv.dcAcRatio ?? 0,
    annualYieldKwhKwp: project.yield.specificYieldKwhPerKwp ?? 0,
    totalCapex: calcs.capex.totalCapex ?? 0,
    currency,
  };

  const comparisonOptions: ComparisonOption[] = [
    { id: "current", label: "Current Design (live)", summary: currentSummary },
    ...entries.map((e) => ({
      id: e.id,
      label: `${e.label} · ${new Date(e.createdAt).toLocaleDateString()}`,
      summary: e.summary,
    })),
  ];

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const entry = await saveDesignSnapshot(
        project.id,
        label || `Snapshot ${new Date().toLocaleString()}`,
        currentSummary,
        project
      );
      setEntries((prev) => [entry, ...prev]);
      setLabel("");
      showToast("Design snapshot saved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save", "warning");
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!canSave) return;
    setBusyId(id);
    try {
      const snapshot = await getDesignSnapshot(id);
      if (!snapshot) {
        showToast("Snapshot not found", "warning");
        return;
      }
      // Keep the live project id/timestamps, restore the design payload.
      const restored = { ...snapshot, id: project.id, createdAt: project.createdAt, updatedAt: project.updatedAt };
      updateProject(restored);
      save(restored);
      showToast("Design restored from snapshot", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to restore", "warning");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canSave) return;
    if (!confirm("Delete this snapshot? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await deleteDesignSnapshot(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("Snapshot deleted", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete", "warning");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Design History"
        description="Save and restore versioned snapshots of this project's design and cost model."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card title="Compare Designs">
            <DesignComparison options={comparisonOptions} />
          </Card>

          <Card title="Version History">
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading history...</p>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History className="mb-3 h-8 w-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No snapshots yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Save the current design to start tracking versions.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {entries.map((e) => (
                  <li
                    key={e.id}
                    className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{e.label}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(e.createdAt).toLocaleString()}
                          </span>
                          {e.authorName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {e.authorName}
                            </span>
                          )}
                        </div>
                      </div>
                      {canSave && (
                        <div className="flex shrink-0 gap-2">
                          <button
                            onClick={() => handleRestore(e.id)}
                            disabled={busyId === e.id}
                            className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            <RotateCcw className="h-3 w-3" /> Restore
                          </button>
                          <button
                            onClick={() => handleDelete(e.id)}
                            disabled={busyId === e.id}
                            className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs sm:grid-cols-4">
                      <SummaryStat label="DC Capacity" value={`${formatNumber(e.summary.dcCapacityKwp / 1000, 1)} MWp`} />
                      <SummaryStat label="AC Capacity" value={`${formatNumber(e.summary.acCapacityKw / 1000, 1)} MWac`} />
                      <SummaryStat label="DC/AC" value={formatNumber(e.summary.dcAcRatio, 2)} />
                      <SummaryStat
                        label="Total CAPEX"
                        value={formatCurrency(e.summary.totalCapex, e.summary.currency)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Save Current Design">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <SummaryStat label="DC Capacity" value={`${formatNumber(currentSummary.dcCapacityKwp / 1000, 1)} MWp`} />
                <SummaryStat label="AC Capacity" value={`${formatNumber(currentSummary.acCapacityKw / 1000, 1)} MWac`} />
                <SummaryStat label="DC/AC Ratio" value={formatNumber(currentSummary.dcAcRatio, 2)} />
                <SummaryStat label="Total CAPEX" value={formatCurrency(currentSummary.totalCapex, currency)} />
              </div>
              {canSave ? (
                <>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Snapshot label
                    </label>
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. Baseline 1.45 DC/AC"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Snapshot"}
                  </button>
                </>
              ) : (
                <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
                  Your role has read-only access to design history.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-semibold text-slate-900">{value}</p>
    </div>
  );
}
