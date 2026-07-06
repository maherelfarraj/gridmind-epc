"use client";

import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card, ValidationBanner } from "@/components/ui-parts";
import { formatCurrency, formatInteger } from "@/lib/format";

export default function BomPage() {
  const { project, calcs, exportValidation } = useProjectPage();
  if (!project) return <ProjectNotFound />;
  if (!calcs || !exportValidation) return null;

  const rows = calcs.bom.map((item) => [
    item.category,
    item.description,
    item.unit,
    formatInteger(item.quantity),
    formatCurrency(item.unitCost, project.info.currency),
    formatCurrency(item.totalCost, project.info.currency),
    item.notes || "—"
  ]);

  const totalBom = calcs.bom.reduce((sum, item) => sum + (item.totalCost ?? 0), 0);

  return (
    <div>
      <PageHeader title="BOM / BOQ" description="Auto-generated bill of materials and quantities" />
      <div className="mb-4"><ValidationBanner type={exportValidation.exportReady ? "ready" : "locked"} message={exportValidation.message} /></div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">{calcs.bom.length} line items</p>
          <p className="text-lg font-bold text-slate-900">Total: {formatCurrency(totalBom, project.info.currency)}</p>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {["Category", "Description", "Unit", "Quantity", "Unit Cost", "Total Cost", "Notes"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                  {row.map((cell, j) => (
                    <td key={j} className={`px-4 py-2.5 ${j >= 3 ? "text-right" : ""} text-slate-700`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
