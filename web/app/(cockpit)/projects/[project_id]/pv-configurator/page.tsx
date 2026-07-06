"use client";

import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card, CalcPanel, MetricRow, ValidationBanner } from "@/components/ui-parts";
import { formatInteger, formatNumber } from "@/lib/format";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default function PvConfiguratorPage() {
  const { project, calcs, exportValidation, save } = useProjectPage();
  if (!project) return <ProjectNotFound />;
  if (!calcs || !exportValidation) return null;

  const updateCapacity = (field: string, value: number | null) => {
    save({ ...project, capacity: { ...project.capacity, [field]: value } });
  };

  const updateModule = (field: string, value: number | string | null) => {
    save({ ...project, pvModule: { ...project.pvModule, [field]: value } });
  };

  return (
    <div>
      <PageHeader title="PV Configurator" description="Configure PV capacity and module specifications" />
      <div className="mb-4"><ValidationBanner type={exportValidation.exportReady ? "ready" : "locked"} message={exportValidation.message} /></div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="Capacity">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">PV DC Capacity MWp</label>
                <input type="number" step="0.01" className={inputCls} value={project.capacity.pvDcCapacityMwp ?? ""} onChange={(e) => updateCapacity("pvDcCapacityMwp", e.target.value ? Number(e.target.value) : null)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">PV AC Capacity MWac</label>
                <input type="number" step="0.01" className={inputCls} value={project.capacity.pvAcCapacityMwac ?? ""} onChange={(e) => updateCapacity("pvAcCapacityMwac", e.target.value ? Number(e.target.value) : null)} />
              </div>
            </div>
          </Card>

          <Card title="PV Module">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["moduleManufacturer", "Manufacturer", "text"],
                ["moduleModel", "Model", "text"],
                ["modulePowerWp", "Power Wp", "number"],
                ["moduleVoc", "Voc (V)", "number"],
                ["moduleVmp", "Vmp (V)", "number"],
                ["moduleIsc", "Isc (A)", "number"],
                ["moduleImp", "Imp (A)", "number"],
                ["maxSystemVoltage", "Max System Voltage (V)", "number"]
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium">{label}</label>
                  <input
                    type={type}
                    step="any"
                    className={inputCls}
                    value={(project.pvModule as unknown as Record<string, unknown>)[field] as string | number ?? ""}
                    onChange={(e) => updateModule(field, type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <CalcPanel title="PV Calculations">
          <MetricRow label="PV DC Capacity Wp" value={formatInteger(calcs.pv.pvDcCapacityWp)} />
          <MetricRow label="PV AC Capacity kW" value={formatInteger(calcs.pv.pvAcCapacityKw)} />
          <MetricRow label="DC/AC Ratio" value={formatNumber(calcs.pv.dcAcRatio)} />
          <MetricRow label="Number of Modules" value={formatInteger(calcs.pv.numberOfModules)} />
          <MetricRow label="Modules per String" value={formatInteger(calcs.pv.modulesPerString)} />
          <MetricRow label="Number of Strings" value={formatInteger(calcs.pv.numberOfStrings)} />
        </CalcPanel>
      </div>
    </div>
  );
}
