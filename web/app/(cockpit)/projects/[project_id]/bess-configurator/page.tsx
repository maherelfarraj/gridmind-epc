"use client";

import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card, CalcPanel, MetricRow, ValidationBanner } from "@/components/ui-parts";
import { formatInteger, formatNumber } from "@/lib/format";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default function BessConfiguratorPage() {
  const { project, calcs, exportValidation, save } = useProjectPage();
  if (!project) return <ProjectNotFound />;
  if (!calcs || !exportValidation) return null;

  const updateBess = (field: string, value: unknown) => {
    const bess = { ...project.bess, [field]: value };
    save({
      ...project,
      bess,
      info: { ...project.info, projectType: bess.enabled ? "PV + BESS" : "PV Only" }
    });
  };

  return (
    <div>
      <PageHeader title="BESS Configurator" description="Configure battery energy storage system" />
      <div className="mb-4"><ValidationBanner type={exportValidation.exportReady ? "ready" : "locked"} message={exportValidation.message} /></div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card title="BESS Configuration">
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={project.bess.enabled} onChange={(e) => updateBess("enabled", e.target.checked)} />
              Enable BESS
            </label>
          </div>

          {project.bess.enabled ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["bessPowerMw", "BESS Power MW", "number"],
                ["bessEnergyMwh", "BESS Energy MWh", "number"],
                ["batteryChemistry", "Battery Chemistry", "text"],
                ["pcsRatingMw", "PCS Rating MW", "number"],
                ["containerSizeMwh", "Container Size MWh", "number"],
                ["roundTripEfficiencyPct", "Round Trip Efficiency %", "number"],
                ["depthOfDischargePct", "Depth of Discharge %", "number"],
                ["dailyCycles", "Daily Cycles", "number"],
                ["coolingMethod", "Cooling Method", "text"]
              ].map(([field, label, type]) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium">{label}</label>
                  <input
                    type={type}
                    step="any"
                    className={inputCls}
                    value={(project.bess as unknown as Record<string, unknown>)[field] as string | number ?? ""}
                    onChange={(e) => updateBess(field, type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
                  />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={project.bess.fireSystemRequired} onChange={(e) => updateBess("fireSystemRequired", e.target.checked)} />
                <span className="text-sm">Fire System Required</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">BESS is disabled for this project. Enable to configure battery storage.</p>
          )}
        </Card>

        {project.bess.enabled && (
          <CalcPanel title="BESS Calculations">
            <MetricRow label="BESS Duration" value={formatNumber(calcs.bess.bessDuration)} unit="hrs" />
            <MetricRow label="Container Quantity" value={formatInteger(calcs.bess.containerQuantity)} />
            <MetricRow label="PCS Quantity" value={formatInteger(calcs.bess.pcsQuantity)} />
            <MetricRow label="Usable Energy" value={formatNumber(calcs.bess.usableEnergy)} unit="MWh" />
            <MetricRow label="Annual Discharge" value={formatNumber(calcs.bess.annualBessDischargeEnergy)} unit="MWh" />
            <MetricRow label="BESS Losses" value={formatNumber(calcs.bess.bessLosses)} unit="MWh/yr" />
          </CalcPanel>
        )}
      </div>
    </div>
  );
}
