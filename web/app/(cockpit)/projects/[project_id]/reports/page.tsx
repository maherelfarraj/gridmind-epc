"use client";

import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card, ValidationBanner } from "@/components/ui-parts";
import { useToast } from "@/components/toast-provider";
import type { ReportRecord, ReportStatus } from "@/lib/types";
import { FileText, Download, Save } from "lucide-react";

const REPORT_TYPES = [
  "Project Summary Report",
  "PV Configuration Report",
  "Stringing Validation Report",
  "BESS Configuration Report",
  "Yield Estimate Report",
  "CAPEX Estimate Report",
  "BOM / BOQ Report",
  "SLD Preview Report"
];

export default function ReportsPage() {
  const { project, calcs, exportValidation, save } = useProjectPage();
  const { showToast } = useToast();
  if (!project) return <ProjectNotFound />;
  if (!calcs || !exportValidation) return null;

  const getReport = (type: string): ReportRecord | undefined =>
    project.reports.find((r) => r.type === type);

  const updateReport = (type: string, status: ReportStatus) => {
    const existing = getReport(type);
    const reports = existing
      ? project.reports.map((r) => (r.type === type ? { ...r, status, generatedAt: new Date().toISOString() } : r))
      : [...project.reports, { id: `rpt-${Date.now()}`, type, status, generatedAt: new Date().toISOString() }];
    save({ ...project, reports });
  };

  const generatePreview = (type: string) => {
    if (!exportValidation.exportReady) {
      showToast("Complete required inputs before generating reports", "warning");
      return;
    }
    updateReport(type, "Ready");
    showToast(`${type} preview generated`, "success");
  };

  const handleDownload = (type: string) => {
    if (!exportValidation.exportReady) {
      showToast("Export locked — complete required inputs", "warning");
      return;
    }
    updateReport(type, "Exported");
    showToast(`${type} download placeholder triggered`, "info");
  };

  const handleSave = (type: string) => {
    updateReport(type, "Draft");
    showToast(`${type} saved to reports`, "success");
  };

  return (
    <div>
      <PageHeader title="Reports" description="Generate and export project reports" />
      <div className="mb-4"><ValidationBanner type={exportValidation.exportReady ? "ready" : "locked"} message={exportValidation.message} /></div>

      <div className="grid gap-4">
        {REPORT_TYPES.map((type) => {
          const report = getReport(type);
          const status = report?.status ?? "Draft";
          const skipBess = type.includes("BESS") && !project.bess.enabled;
          if (skipBess) return null;

          return (
            <Card key={type}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-slate-900">{type}</p>
                    <p className="text-xs text-slate-500">
                      Status: <span className={
                        status === "Exported" ? "text-emerald-600" : status === "Ready" ? "text-blue-600" : "text-slate-500"
                      }>{status}</span>
                      {report?.generatedAt && ` · ${new Date(report.generatedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => generatePreview(type)} className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    Generate Preview
                  </button>
                  <button onClick={() => handleDownload(type)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                    <Download className="h-3 w-3" /> Download
                  </button>
                  <button onClick={() => handleSave(type)} className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
                    <Save className="h-3 w-3" /> Save
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
