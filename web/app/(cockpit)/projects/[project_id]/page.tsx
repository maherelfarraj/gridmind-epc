"use client";

import Link from "next/link";
import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card, KpiCard, ValidationBanner, MetricRow } from "@/components/ui-parts";
import { formatCurrency, formatNumber, formatRatio } from "@/lib/format";

export default function ProjectOverviewPage() {
  const { project, calcs, exportValidation } = useProjectPage();
  if (!project) return <ProjectNotFound />;
  if (!calcs || !exportValidation) return null;

  const base = `/projects/${project.id}`;

  return (
    <div>
      <PageHeader
        title={project.info.projectName || "Untitled Project"}
        description={`${project.info.projectType} · ${project.info.projectStage} · ${project.info.clientName || "No client"}`}
      />

      <div className="mb-6">
        <ValidationBanner
          type={exportValidation.exportReady ? "ready" : "locked"}
          message={exportValidation.message}
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="PV DC Capacity" value={`${formatNumber(project.capacity.pvDcCapacityMwp)} MWp`} variant="emerald" />
        <KpiCard title="PV AC Capacity" value={`${formatNumber(project.capacity.pvAcCapacityMwac)} MWac`} variant="emerald" />
        <KpiCard title="DC/AC Ratio" value={formatRatio(calcs.pv.dcAcRatio)} variant="blue" />
        <KpiCard title="Total CAPEX" value={formatCurrency(calcs.capex.totalCapex, project.info.currency)} variant="slate" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Project Details">
          <MetricRow label="Country" value={project.info.country || "—"} />
          <MetricRow label="City" value={project.info.city || "—"} />
          <MetricRow label="Site Address" value={project.info.siteAddress || "—"} />
          <MetricRow label="Currency" value={project.info.currency} />
          <MetricRow label="Export Limit" value={formatNumber(project.capacity.exportLimitMw)} unit="MW" />
        </Card>

        <Card title="Quick Calculations">
          <MetricRow label="Number of Modules" value={formatNumber(calcs.pv.numberOfModules, 0)} />
          <MetricRow label="Inverter Quantity" value={formatNumber(calcs.pv.finalInverterQuantity, 0)} />
          <MetricRow label="Net PV Energy" value={formatNumber(calcs.yield.netPvEnergyMwh)} unit="MWh/yr" />
          <MetricRow label="Performance Ratio" value={formatNumber(calcs.yield.performanceRatio)} unit="%" />
          {project.bess.enabled && (
            <>
              <MetricRow label="BESS Duration" value={formatNumber(calcs.bess.bessDuration)} unit="hrs" />
              <MetricRow label="BESS Containers" value={formatNumber(calcs.bess.containerQuantity, 0)} />
            </>
          )}
        </Card>
      </div>

      <Card title="Module Navigation" className="mt-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["PV Configurator", "pv-configurator"],
            ["BESS Configurator", "bess-configurator"],
            ["Stringing", "stringing"],
            ["Yield Estimate", "yield"],
            ["CAPEX Estimate", "capex"],
            ["BOM / BOQ", "bom"],
            ["SLD Preview", "sld"],
            ["Reports", "reports"]
          ].map(([label, path]) => (
            <Link key={path} href={`${base}/${path}`} className="rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50">
              {label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
