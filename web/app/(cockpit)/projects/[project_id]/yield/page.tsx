"use client";

import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card, CalcPanel, MetricRow, ValidationBanner } from "@/components/ui-parts";
import { formatNumber } from "@/lib/format";
import { downloadReport } from "@/lib/export";
import { FileText } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#ef4444"];

export default function YieldPage() {
  const { project, calcs, exportValidation, save } = useProjectPage();
  if (!project) return <ProjectNotFound />;
  if (!calcs || !exportValidation) return null;

  const updateYield = (field: string, value: number | null) => {
    save({ ...project, yield: { ...project.yield, [field]: value } });
  };

  const lossData = [
    { name: "Net Energy", value: calcs.yield.netPvEnergyMwh ?? 0 },
    { name: "Losses", value: (calcs.yield.grossPvEnergyMwh ?? 0) - (calcs.yield.netPvEnergyMwh ?? 0) }
  ];

  const exportData = project.bess.enabled
    ? [
        { name: "PV Export", value: calcs.yield.netPvEnergyMwh ?? 0 },
        { name: "BESS Export", value: calcs.bess.annualBessDischargeEnergy ?? 0 }
      ]
    : [{ name: "PV Export", value: calcs.yield.netPvEnergyMwh ?? 0 }];

  return (
    <div>
      <PageHeader title="Yield Estimate" description="Energy production and degradation analysis" />
      <div className="mb-4"><ValidationBanner type={exportValidation.exportReady ? "ready" : "locked"} message={exportValidation.message} /></div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => downloadReport("Yield Estimate Report", project, calcs)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <FileText className="h-4 w-4" /> Download PDF
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card title="Yield Assumptions">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["specificYieldKwhPerKwp", "Specific Yield kWh/kWp"],
                ["poaIrradiance", "POA Irradiance"],
                ["totalLossPct", "Total Loss %"],
                ["availabilityPct", "Availability %"],
                ["year1DegradationPct", "Year 1 Degradation %"],
                ["annualDegradationPct", "Annual Degradation %"],
                ["projectLifeYears", "Project Life Years"]
              ].map(([field, label]) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium">{label}</label>
                  <input type="number" step="any" className={inputCls} value={(project.yield as unknown as Record<string, unknown>)[field] as number ?? ""} onChange={(e) => updateYield(field, e.target.value ? Number(e.target.value) : null)} />
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Monthly Energy Estimate">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={calcs.yield.monthlyEnergy}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="energy" fill="#2563eb" name="MWh" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card title="Loss Summary">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={lossData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                    {lossData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card title="25-Year Degradation Curve">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={calcs.yield.yearlyEnergy.slice(0, 25)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {project.bess.enabled && (
              <Card title="PV vs BESS Export">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={exportData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                      {exportData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>
        </div>

        <CalcPanel title="Yield Results">
          <MetricRow label="Gross PV Energy" value={formatNumber(calcs.yield.grossPvEnergyMwh)} unit="MWh/yr" />
          <MetricRow label="Net PV Energy" value={formatNumber(calcs.yield.netPvEnergyMwh)} unit="MWh/yr" />
          <MetricRow label="Performance Ratio" value={formatNumber(calcs.yield.performanceRatio)} unit="%" />
          <MetricRow label="Capacity Factor" value={formatNumber(calcs.yield.capacityFactor)} unit="%" />
          <MetricRow label="Lifetime Energy" value={formatNumber(calcs.yield.lifetimeEnergy)} unit="MWh" />
          {project.bess.enabled && (
            <MetricRow label="Net Export Energy" value={formatNumber(calcs.yield.netExportEnergy)} unit="MWh/yr" />
          )}
        </CalcPanel>
      </div>
    </div>
  );
}
