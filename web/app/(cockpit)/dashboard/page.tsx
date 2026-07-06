"use client";

import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { useApp } from "@/context/app-context";
import { runProjectCalculations } from "@/lib/calculations";
import { validateExportReady } from "@/lib/validation";
import { KpiCard, PageHeader, Card } from "@/components/ui-parts";
import { formatCurrency, formatNumber, formatRatio } from "@/lib/format";

const CHART_COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function DashboardPage() {
  const { projects, admin } = useApp();

  let totalPvDc = 0;
  let totalPvAc = 0;
  let bessCount = 0;
  let totalBessPower = 0;
  let totalBessEnergy = 0;
  let totalCapex = 0;
  let dcAcSum = 0;
  let dcAcCount = 0;
  let yieldSum = 0;
  let yieldCount = 0;
  let exportReady = 0;
  let incomplete = 0;

  const capacityByProject: { name: string; dc: number; ac: number }[] = [];
  const capexByProject: { name: string; capex: number }[] = [];
  const yieldByProject: { name: string; yield: number }[] = [];
  const typeCounts: Record<string, number> = {};
  const capexBreakdown = { modules: 0, inverters: 0, structure: 0, bess: 0, civil: 0, electrical: 0 };

  projects.forEach((p) => {
    const calcs = runProjectCalculations(p, admin);
    const v = validateExportReady(p);
    if (v.exportReady) exportReady++;
    else incomplete++;

    const dc = p.capacity.pvDcCapacityMwp ?? 0;
    const ac = p.capacity.pvAcCapacityMwac ?? 0;
    totalPvDc += dc;
    totalPvAc += ac;

    if (p.bess.enabled) {
      bessCount++;
      totalBessPower += p.bess.bessPowerMw ?? 0;
      totalBessEnergy += p.bess.bessEnergyMwh ?? 0;
    }

    if (calcs.capex.totalCapex) totalCapex += calcs.capex.totalCapex;
    if (calcs.pv.dcAcRatio) {
      dcAcSum += calcs.pv.dcAcRatio;
      dcAcCount++;
    }
    if (p.yield.specificYieldKwhPerKwp) {
      yieldSum += p.yield.specificYieldKwhPerKwp;
      yieldCount++;
    }

    const name = p.info.projectName || "Untitled";
    capacityByProject.push({ name: name.slice(0, 20), dc, ac });
    if (calcs.capex.totalCapex) capexByProject.push({ name: name.slice(0, 20), capex: calcs.capex.totalCapex / 1e6 });
    if (calcs.yield.netPvEnergyMwh) yieldByProject.push({ name: name.slice(0, 20), yield: calcs.yield.netPvEnergyMwh });

    typeCounts[p.info.projectType] = (typeCounts[p.info.projectType] ?? 0) + 1;

    capexBreakdown.modules += calcs.capex.pvModuleCapex ?? 0;
    capexBreakdown.inverters += calcs.capex.inverterCapex ?? 0;
    capexBreakdown.structure += calcs.capex.structureCapex ?? 0;
    capexBreakdown.bess += calcs.capex.bessCapex ?? 0;
    capexBreakdown.civil += calcs.capex.civilCapex ?? 0;
    capexBreakdown.electrical += calcs.capex.electricalCapex ?? 0;
  });

  const projectsByType = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
  const capexPie = [
    { name: "Modules", value: capexBreakdown.modules },
    { name: "Inverters", value: capexBreakdown.inverters },
    { name: "Structure", value: capexBreakdown.structure },
    { name: "BESS", value: capexBreakdown.bess },
    { name: "Civil", value: capexBreakdown.civil },
    { name: "Electrical", value: capexBreakdown.electrical }
  ].filter((d) => d.value > 0);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Portfolio overview for PV_Mind Cockpit projects"
      />

      {projects.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <p className="text-lg font-semibold text-slate-700">No projects yet</p>
            <p className="mt-2 text-sm text-slate-500">Create your first PV or PV+BESS project to see portfolio metrics.</p>
            <Link href="/projects/new" className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
              Create New Project
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total Projects" value={String(projects.length)} variant="blue" />
            <KpiCard title="Total PV DC Capacity" value={`${formatNumber(totalPvDc)} MWp`} variant="emerald" />
            <KpiCard title="Total PV AC Capacity" value={`${formatNumber(totalPvAc)} MWac`} variant="emerald" />
            <KpiCard title="Projects with BESS" value={String(bessCount)} variant="blue" />
            <KpiCard title="Total BESS Power" value={`${formatNumber(totalBessPower)} MW`} variant="amber" />
            <KpiCard title="Total BESS Energy" value={`${formatNumber(totalBessEnergy)} MWh`} variant="amber" />
            <KpiCard title="Total Estimated CAPEX" value={formatCurrency(totalCapex, admin.currency)} variant="slate" />
            <KpiCard title="Avg DC/AC Ratio" value={dcAcCount > 0 ? formatRatio(dcAcSum / dcAcCount) : "Needs Input"} variant="blue" />
            <KpiCard title="Avg Specific Yield" value={yieldCount > 0 ? `${formatNumber(yieldSum / yieldCount, 0)} kWh/kWp` : "Needs Input"} variant="emerald" />
            <KpiCard title="Export-Ready Projects" value={String(exportReady)} variant="emerald" />
            <KpiCard title="Incomplete Projects" value={String(incomplete)} variant="amber" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Projects by Type">
              {projectsByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={projectsByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {projectsByType.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-slate-400">No data</p>
              )}
            </Card>

            <Card title="Capacity by Project (MWp / MWac)">
              {capacityByProject.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={capacityByProject}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="dc" fill="#2563eb" name="DC MWp" />
                    <Bar dataKey="ac" fill="#10b981" name="AC MWac" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-slate-400">No data</p>
              )}
            </Card>

            <Card title="CAPEX Breakdown">
              {capexPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={capexPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                      {capexPie.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v, admin.currency)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-slate-400">No CAPEX data</p>
              )}
            </Card>

            <Card title="Yield Estimate by Project (MWh/year)">
              {yieldByProject.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={yieldByProject}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="yield" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-8 text-center text-slate-400">No yield data</p>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
