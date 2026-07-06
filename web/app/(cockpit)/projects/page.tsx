"use client";

import Link from "next/link";
import { useApp } from "@/context/app-context";
import { runProjectCalculations } from "@/lib/calculations";
import { validateExportReady } from "@/lib/validation";
import { PageHeader, Card, DataTable } from "@/components/ui-parts";
import { formatCurrency, formatNumber } from "@/lib/format";
import { deleteProject } from "@/lib/storage";
import { Plus, Trash2 } from "lucide-react";

export default function ProjectsPage() {
  const { projects, admin, refresh, setActive } = useApp();

  const rows = projects.map((p) => {
    const calcs = runProjectCalculations(p, admin);
    const v = validateExportReady(p);
    return [
      p.info.projectName || "Untitled",
      p.info.projectType,
      p.info.projectStage,
      formatNumber(p.capacity.pvDcCapacityMwp),
      formatNumber(p.capacity.pvAcCapacityMwac),
      p.bess.enabled ? "Yes" : "No",
      formatCurrency(calcs.capex.totalCapex, p.info.currency),
      v.exportReady ? "Ready" : "Incomplete",
      p.id
    ];
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Projects" description="All PV and PV+BESS project configurations" />
        <Link
          href="/projects/new"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          New Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-lg font-semibold text-slate-700">No projects created yet</p>
            <p className="mt-2 text-sm text-slate-500">Start by creating a new PV or PV+BESS project configuration.</p>
            <Link href="/projects/new" className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white">
              Create New Project
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Project", "Type", "Stage", "DC MWp", "AC MWac", "BESS", "CAPEX", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const id = row[8] as string;
                  return (
                    <tr key={id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/projects/${id}`} className="font-medium text-blue-600 hover:underline" onClick={() => setActive(id)}>
                          {row[0]}
                        </Link>
                      </td>
                      {row.slice(1, 8).map((cell, j) => (
                        <td key={j} className="px-4 py-2.5 text-slate-700">
                          <span className={cell === "Ready" ? "text-emerald-600 font-medium" : cell === "Incomplete" ? "text-amber-600" : ""}>
                            {cell}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => {
                            if (confirm("Delete this project?")) {
                              deleteProject(id);
                              refresh();
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
