"use client";

import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card, CalcPanel, MetricRow, ValidationBanner } from "@/components/ui-parts";
import { formatInteger, formatNumber } from "@/lib/format";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default function StringingPage() {
  const { project, calcs, exportValidation, save } = useProjectPage();
  if (!project) return <ProjectNotFound />;
  if (!calcs || !exportValidation) return null;

  const updateInverter = (field: string, value: number | string | null) => {
    save({ ...project, inverter: { ...project.inverter, [field]: value } });
  };

  return (
    <div>
      <PageHeader title="Stringing & Inverter Check" description="Validate string configuration and inverter sizing" />
      <div className="mb-4"><ValidationBanner type={exportValidation.exportReady ? "ready" : "locked"} message={exportValidation.message} /></div>

      <div className="mb-6 space-y-2">
        {calcs.pv.validations.map((v, i) => (
          <ValidationBanner key={i} type={v.type} message={v.message} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card title="Inverter Configuration">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["inverterManufacturer", "Manufacturer", "text"],
              ["inverterModel", "Model", "text"],
              ["inverterRatedPowerKw", "Rated Power kW", "number"],
              ["mpptCount", "MPPT Count", "number"],
              ["maxCurrentPerMppt", "Max Current per MPPT (A)", "number"],
              ["maxStringsPerMppt", "Max Strings per MPPT", "number"],
              ["physicalDcConnectorInputs", "Physical DC Connector Inputs", "number"],
              ["efficiencyPct", "Efficiency %", "number"]
            ].map(([field, label, type]) => (
              <div key={field}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <input
                  type={type}
                  step="any"
                  className={inputCls}
                  value={(project.inverter as unknown as Record<string, unknown>)[field] as string | number ?? ""}
                  onChange={(e) => updateInverter(field, type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
                />
              </div>
            ))}
          </div>
        </Card>

        <CalcPanel title="Stringing Results">
          <MetricRow label="Corrected Cold Voc" value={formatNumber(calcs.pv.correctedColdVoc)} unit="V" />
          <MetricRow label="Modules per String" value={formatInteger(calcs.pv.modulesPerString)} />
          <MetricRow label="Number of Strings" value={formatInteger(calcs.pv.numberOfStrings)} />
          <MetricRow label="Strings per MPPT" value={formatInteger(calcs.pv.stringsPerMppt)} />
          <MetricRow label="Strings per Inverter" value={formatInteger(calcs.pv.stringsPerInverter)} />
          <MetricRow label="Inverter Qty (AC)" value={formatInteger(calcs.pv.inverterQtyByAc)} />
          <MetricRow label="Inverter Qty (String)" value={formatInteger(calcs.pv.inverterQtyByString)} />
          <MetricRow label="Final Inverter Qty" value={formatInteger(calcs.pv.finalInverterQuantity)} />
          <MetricRow label="Transformer Qty" value={formatInteger(calcs.pv.transformerQuantity)} />
        </CalcPanel>
      </div>
    </div>
  );
}
