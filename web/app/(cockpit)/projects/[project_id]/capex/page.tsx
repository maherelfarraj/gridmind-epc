"use client";

import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card, CalcPanel, MetricRow, ValidationBanner } from "@/components/ui-parts";
import { formatCurrency, formatNumber } from "@/lib/format";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#64748b"];

export default function CapexPage() {
  const { project, calcs, exportValidation, save } = useProjectPage();
  if (!project) return <ProjectNotFound />;
  if (!calcs || !exportValidation) return null;

  const updateCapex = (field: string, value: number | null) => {
    save({ ...project, capex: { ...project.capex, [field]: value } });
  };

  const capexPie = [
    { name: "Modules", value: calcs.capex.pvModuleCapex ?? 0 },
    { name: "Inverters", value: calcs.capex.inverterCapex ?? 0 },
    { name: "Structure", value: calcs.capex.structureCapex ?? 0 },
    { name: "BESS", value: calcs.capex.bessCapex ?? 0 },
    { name: "Civil", value: calcs.capex.civilCapex ?? 0 },
    { name: "Electrical", value: calcs.capex.electricalCapex ?? 0 }
  ].filter((d) => d.value > 0);

  return (
    <div>
      <PageHeader title="CAPEX Estimate" description="Capital expenditure breakdown and LCOE" />
      <div className="mb-4"><ValidationBanner type={exportValidation.exportReady ? "ready" : "locked"} message={exportValidation.message} /></div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="CAPEX Assumptions">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["moduleCost", "Module Cost (per module)"],
                ["inverterCost", "Inverter Cost (per unit)"],
                ["structureCostPerMwp", "Structure Cost per MWp"],
                ["bessCostPerMwh", "BESS Cost per MWh"],
                ["civilCostPerMwp", "Civil Cost per MWp"],
                ["electricalCostPerMwac", "Electrical Cost per MWac"],
                ["engineeringCost", "Engineering Cost (fixed)"],
                ["contingencyPct", "Contingency %"]
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium">{label}</label>
                  <input type="number" step="any" className={inputCls} value={(project.capex as unknown as Record<string, unknown>)[field] as number ?? ""} onChange={(e) => updateCapex(field, e.target.value ? Number(e.target.value) : null)} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="CAPEX Breakdown">
            {capexPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={capexPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {capexPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, project.info.currency)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-slate-400">Complete CAPEX inputs to see breakdown</p>
            )}
          </Card>
        </div>

        <CalcPanel title="CAPEX Results">
          <MetricRow label="PV Module CAPEX" value={formatCurrency(calcs.capex.pvModuleCapex, project.info.currency)} />
          <MetricRow label="Inverter CAPEX" value={formatCurrency(calcs.capex.inverterCapex, project.info.currency)} />
          <MetricRow label="Structure CAPEX" value={formatCurrency(calcs.capex.structureCapex, project.info.currency)} />
          <MetricRow label="BESS CAPEX" value={formatCurrency(calcs.capex.bessCapex, project.info.currency)} />
          <MetricRow label="Civil CAPEX" value={formatCurrency(calcs.capex.civilCapex, project.info.currency)} />
          <MetricRow label="Electrical CAPEX" value={formatCurrency(calcs.capex.electricalCapex, project.info.currency)} />
          <MetricRow label="Subtotal" value={formatCurrency(calcs.capex.subtotalCapex, project.info.currency)} />
          <MetricRow label="Contingency" value={formatCurrency(calcs.capex.contingency, project.info.currency)} />
          <div className="mt-2 border-t pt-2">
            <MetricRow label="Total CAPEX" value={formatCurrency(calcs.capex.totalCapex, project.info.currency)} />
          </div>
          <MetricRow label="CAPEX per MWp" value={formatCurrency(calcs.capex.capexPerMwp, project.info.currency)} />
          <MetricRow label="CAPEX per MWac" value={formatCurrency(calcs.capex.capexPerMwac, project.info.currency)} />
          <MetricRow label="Simple LCOE" value={calcs.capex.simpleLcoe ? `$${formatNumber(calcs.capex.simpleLcoe * 1000, 2)}/MWh` : "Needs Input"} />
        </CalcPanel>
      </div>
    </div>
  );
}
