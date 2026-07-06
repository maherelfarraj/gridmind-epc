"use client";

import { useState } from "react";
import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card, ValidationBanner } from "@/components/ui-parts";
import { formatInteger, formatNumber } from "@/lib/format";
import { useToast } from "@/components/toast-provider";
import { Download, X } from "lucide-react";

function SldNode({ label, sublabel, color }: { label: string; sublabel?: string; color: string }) {
  return (
    <div className={`rounded-lg border-2 px-4 py-3 text-center ${color}`}>
      <p className="text-sm font-bold">{label}</p>
      {sublabel && <p className="mt-1 text-xs opacity-70">{sublabel}</p>}
    </div>
  );
}

function SldArrow() {
  return <div className="flex items-center justify-center text-slate-400"><span className="text-2xl">→</span></div>;
}

export default function SldPage() {
  const { project, calcs, exportValidation } = useProjectPage();
  const { showToast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  if (!project) return <ProjectNotFound />;
  if (!calcs || !exportValidation) return null;

  const handleExport = () => {
    setDrawerOpen(true);
    showToast("SLD preview opened — PDF export placeholder", "info");
  };

  const labels = {
    pvDc: `${formatNumber(project.capacity.pvDcCapacityMwp)} MWp`,
    ac: `${formatNumber(project.capacity.pvAcCapacityMwac)} MWac`,
    inverters: `${formatInteger(calcs.pv.finalInverterQuantity)} Inverters`,
    transformer: "33/132 kV",
    bess: project.bess.enabled ? `${formatNumber(project.bess.bessPowerMw)} MW / ${formatNumber(project.bess.bessEnergyMwh)} MWh` : null,
    exportLimit: `${formatNumber(project.capacity.exportLimitMw)} MW`
  };

  return (
    <div>
      <PageHeader title="SLD Preview" description="Single-line diagram preview" />
      <div className="mb-4"><ValidationBanner type={exportValidation.exportReady ? "ready" : "locked"} message={exportValidation.message} /></div>

      <Card>
        <div className="mb-4 flex justify-end">
          <button onClick={handleExport} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Download className="h-4 w-4" /> Export SLD Preview
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl bg-slate-50 p-8">
          <div className="flex min-w-[800px] items-center justify-center gap-2">
            <SldNode label="PV Array" sublabel={labels.pvDc} color="border-emerald-400 bg-emerald-50 text-emerald-900" />
            <SldArrow />
            <SldNode label="DC Combiner" sublabel="String Input" color="border-blue-300 bg-blue-50 text-blue-900" />
            <SldArrow />
            <SldNode label="Inverter" sublabel={labels.inverters} color="border-blue-400 bg-blue-50 text-blue-900" />
            <SldArrow />
            <SldNode label="AC Busbar" sublabel={labels.ac} color="border-slate-400 bg-white text-slate-900" />
            <SldArrow />
            <SldNode label="Transformer" sublabel={labels.transformer} color="border-amber-400 bg-amber-50 text-amber-900" />
            <SldArrow />
            <SldNode label="Meter" sublabel={labels.exportLimit} color="border-slate-300 bg-slate-100 text-slate-800" />
            <SldArrow />
            <SldNode label="Grid" color="border-red-400 bg-red-50 text-red-900" />
          </div>

          {project.bess.enabled && (
            <div className="mt-8 flex min-w-[400px] items-center justify-center gap-2">
              <SldNode label="BESS Container" sublabel={labels.bess ?? ""} color="border-amber-400 bg-amber-50 text-amber-900" />
              <SldArrow />
              <SldNode label="PCS" sublabel={`${formatInteger(calcs.bess.pcsQuantity)} units`} color="border-amber-300 bg-amber-50 text-amber-900" />
              <SldArrow />
              <SldNode label="AC Busbar" sublabel="BESS Connection" color="border-slate-400 bg-white text-slate-900" />
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(labels).filter(([, v]) => v).map(([key, val]) => (
            <div key={key} className="rounded-lg border bg-white p-3 text-center">
              <p className="text-[10px] uppercase text-slate-400">{key.replace(/([A-Z])/g, " $1")}</p>
              <p className="text-sm font-semibold">{val}</p>
            </div>
          ))}
        </div>
      </Card>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">SLD Export Preview</h3>
              <button onClick={() => setDrawerOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-slate-600">
              SLD diagram for <strong>{project.info.projectName}</strong> ({project.info.projectType}).
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p>PV DC: {labels.pvDc}</p>
              <p>AC Capacity: {labels.ac}</p>
              <p>Inverters: {labels.inverters}</p>
              {labels.bess && <p>BESS: {labels.bess}</p>}
              <p>Export Limit: {labels.exportLimit}</p>
            </div>
            <button
              onClick={() => showToast("PDF download placeholder — export will be available in production", "info")}
              className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white"
            >
              Download Placeholder
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
