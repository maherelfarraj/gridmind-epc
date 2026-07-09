"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createNewProjectData } from "@/lib/project-factory";
import { PageHeader, Card } from "@/components/ui-parts";
import type { Project } from "@/lib/types";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useApp } from "@/context/app-context";

const STEPS = [
  "Project Info",
  "Capacity",
  "PV Module",
  "Inverter",
  "Structure",
  "BESS Optional",
  "Site Conditions",
  "Yield Assumptions",
  "CAPEX Assumptions",
  "Review & Create"
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function NewProjectPage() {
  const router = useRouter();
  const { admin, createProject } = useApp();
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [data, setData] = useState<Omit<Project, "id" | "createdAt" | "updatedAt">>(() => createNewProjectData(admin));

  const update = <K extends keyof typeof data>(section: K, field: string, value: unknown) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const dcAcRatio =
    data.capacity.pvDcCapacityMwp && data.capacity.pvAcCapacityMwac
      ? (data.capacity.pvDcCapacityMwp / data.capacity.pvAcCapacityMwac).toFixed(2)
      : "Needs Input";

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const project = await createProject(data);
      router.push(`/projects/${project.id}`);
    } catch {
      setCreating(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <>
            <Field label="Project Name *">
              <input className={inputCls} value={data.info.projectName} onChange={(e) => update("info", "projectName", e.target.value)} />
            </Field>
            <Field label="Client Name">
              <input className={inputCls} value={data.info.clientName} onChange={(e) => update("info", "clientName", e.target.value)} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Country"><input className={inputCls} value={data.info.country} onChange={(e) => update("info", "country", e.target.value)} /></Field>
              <Field label="City"><input className={inputCls} value={data.info.city} onChange={(e) => update("info", "city", e.target.value)} /></Field>
            </div>
            <Field label="Site Address"><input className={inputCls} value={data.info.siteAddress} onChange={(e) => update("info", "siteAddress", e.target.value)} /></Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Latitude"><input type="number" className={inputCls} value={data.info.latitude ?? ""} onChange={(e) => update("info", "latitude", e.target.value ? Number(e.target.value) : null)} /></Field>
              <Field label="Longitude"><input type="number" className={inputCls} value={data.info.longitude ?? ""} onChange={(e) => update("info", "longitude", e.target.value ? Number(e.target.value) : null)} /></Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Currency">
                <select className={inputCls} value={data.info.currency} onChange={(e) => update("info", "currency", e.target.value)}>
                  {["USD", "EUR", "GBP", "AUD", "ZAR"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Project Type">
                <select className={inputCls} value={data.info.projectType} onChange={(e) => {
                  update("info", "projectType", e.target.value);
                  update("bess", "enabled", e.target.value === "PV + BESS");
                }}>
                  <option value="PV Only">PV Only</option>
                  <option value="PV + BESS">PV + BESS</option>
                </select>
              </Field>
              <Field label="Project Stage">
                <select className={inputCls} value={data.info.projectStage} onChange={(e) => update("info", "projectStage", e.target.value)}>
                  {["Feasibility", "Design", "Tender", "Construction", "O&M"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Notes"><textarea className={inputCls} rows={3} value={data.info.notes} onChange={(e) => update("info", "notes", e.target.value)} /></Field>
          </>
        );
      case 1:
        return (
          <>
            <Field label="PV DC Capacity MWp *">
              <input type="number" step="0.01" className={inputCls} value={data.capacity.pvDcCapacityMwp ?? ""} onChange={(e) => update("capacity", "pvDcCapacityMwp", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="PV AC Capacity MWac *">
              <input type="number" step="0.01" className={inputCls} value={data.capacity.pvAcCapacityMwac ?? ""} onChange={(e) => update("capacity", "pvAcCapacityMwac", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <Field label="Export Limit MW">
              <input type="number" step="0.01" className={inputCls} value={data.capacity.exportLimitMw ?? ""} onChange={(e) => update("capacity", "exportLimitMw", e.target.value ? Number(e.target.value) : null)} />
            </Field>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-800">DC/AC Ratio (calculated)</p>
              <p className="text-2xl font-bold text-blue-900">{dcAcRatio}</p>
            </div>
          </>
        );
      case 2:
        return (
          <>
            {[
              ["moduleTechnology", "Module Technology", "text"],
              ["moduleManufacturer", "Module Manufacturer", "text"],
              ["moduleModel", "Module Model", "text"],
              ["modulePowerWp", "Module Power Wp *", "number"],
              ["moduleVoc", "Module Voc (V) *", "number"],
              ["moduleVmp", "Module Vmp (V)", "number"],
              ["moduleIsc", "Module Isc (A)", "number"],
              ["moduleImp", "Module Imp (A)", "number"],
              ["maxSystemVoltage", "Max System Voltage (V)", "number"],
              ["tempCoeffVoc", "Temperature Coefficient Voc (%/°C)", "number"],
              ["degradationRate", "Degradation Rate (%/year)", "number"]
            ].map(([field, label, type]) => (
              <Field key={field} label={label}>
                <input
                  type={type}
                  step="any"
                  className={inputCls}
                  value={(data.pvModule as unknown as Record<string, unknown>)[field] as string | number ?? ""}
                  onChange={(e) => update("pvModule", field, type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
                />
              </Field>
            ))}
          </>
        );
      case 3:
        return (
          <>
            {[
              ["inverterType", "Inverter Type", "text"],
              ["inverterManufacturer", "Inverter Manufacturer", "text"],
              ["inverterModel", "Inverter Model", "text"],
              ["inverterRatedPowerKw", "Inverter Rated Power kW *", "number"],
              ["maxDcVoltage", "Max DC Voltage (V)", "number"],
              ["mpptCount", "MPPT Count *", "number"],
              ["maxCurrentPerMppt", "Max Current per MPPT (A) *", "number"],
              ["maxStringsPerMppt", "Max Strings per MPPT", "number"],
              ["physicalDcConnectorInputs", "Physical DC Connector Inputs", "number"],
              ["acOutputVoltage", "AC Output Voltage (V)", "number"],
              ["efficiencyPct", "Efficiency %", "number"]
            ].map(([field, label, type]) => (
              <Field key={field} label={label}>
                <input
                  type={type}
                  step="any"
                  className={inputCls}
                  value={(data.inverter as unknown as Record<string, unknown>)[field] as string | number ?? ""}
                  onChange={(e) => update("inverter", field, type === "number" ? (e.target.value ? Number(e.target.value) : null) : e.target.value)}
                />
              </Field>
            ))}
          </>
        );
      case 4:
        return (
          <>
            <Field label="Structure Type"><input className={inputCls} value={data.structure.structureType} onChange={(e) => update("structure", "structureType", e.target.value)} /></Field>
            <Field label="Tilt Angle (°)"><input type="number" className={inputCls} value={data.structure.tiltAngle ?? ""} onChange={(e) => update("structure", "tiltAngle", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Row Pitch (m)"><input type="number" className={inputCls} value={data.structure.rowPitch ?? ""} onChange={(e) => update("structure", "rowPitch", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Ground Coverage Ratio"><input type="number" step="0.01" className={inputCls} value={data.structure.groundCoverageRatio ?? ""} onChange={(e) => update("structure", "groundCoverageRatio", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Foundation Type"><input className={inputCls} value={data.structure.foundationType} onChange={(e) => update("structure", "foundationType", e.target.value)} /></Field>
            <Field label="Tracker Required">
              <input type="checkbox" checked={data.structure.trackerRequired} onChange={(e) => update("structure", "trackerRequired", e.target.checked)} className="mr-2" />
              <span className="text-sm text-slate-600">Enable tracker system</span>
            </Field>
          </>
        );
      case 5:
        return (
          <>
            <Field label="Enable BESS">
              <input type="checkbox" checked={data.bess.enabled} onChange={(e) => {
                update("bess", "enabled", e.target.checked);
                if (e.target.checked) update("info", "projectType", "PV + BESS");
              }} className="mr-2" />
              <span className="text-sm text-slate-600">Include battery energy storage</span>
            </Field>
            {data.bess.enabled && (
              <>
                <Field label="BESS Power MW *"><input type="number" step="0.01" className={inputCls} value={data.bess.bessPowerMw ?? ""} onChange={(e) => update("bess", "bessPowerMw", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="BESS Energy MWh *"><input type="number" step="0.01" className={inputCls} value={data.bess.bessEnergyMwh ?? ""} onChange={(e) => update("bess", "bessEnergyMwh", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Battery Chemistry"><input className={inputCls} value={data.bess.batteryChemistry} onChange={(e) => update("bess", "batteryChemistry", e.target.value)} placeholder="LFP" /></Field>
                <Field label="PCS Rating MW"><input type="number" step="0.01" className={inputCls} value={data.bess.pcsRatingMw ?? ""} onChange={(e) => update("bess", "pcsRatingMw", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Container Size MWh"><input type="number" step="0.01" className={inputCls} value={data.bess.containerSizeMwh ?? ""} onChange={(e) => update("bess", "containerSizeMwh", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Round Trip Efficiency %"><input type="number" className={inputCls} value={data.bess.roundTripEfficiencyPct ?? ""} onChange={(e) => update("bess", "roundTripEfficiencyPct", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Depth of Discharge %"><input type="number" className={inputCls} value={data.bess.depthOfDischargePct ?? ""} onChange={(e) => update("bess", "depthOfDischargePct", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Daily Cycles"><input type="number" className={inputCls} value={data.bess.dailyCycles ?? ""} onChange={(e) => update("bess", "dailyCycles", e.target.value ? Number(e.target.value) : null)} /></Field>
                <Field label="Cooling Method"><input className={inputCls} value={data.bess.coolingMethod} onChange={(e) => update("bess", "coolingMethod", e.target.value)} /></Field>
                <Field label="Fire System Required"><input type="checkbox" checked={data.bess.fireSystemRequired} onChange={(e) => update("bess", "fireSystemRequired", e.target.checked)} className="mr-2" /><span className="text-sm">Required</span></Field>
              </>
            )}
          </>
        );
      case 6:
        return (
          <>
            <Field label="Site Area"><input type="number" className={inputCls} value={data.site.siteArea ?? ""} onChange={(e) => update("site", "siteArea", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Site Area Unit">
              <select className={inputCls} value={data.site.siteAreaUnit} onChange={(e) => update("site", "siteAreaUnit", e.target.value)}>
                <option value="hectares">Hectares</option>
                <option value="acres">Acres</option>
                <option value="m2">m²</option>
              </select>
            </Field>
            <Field label="Terrain Type"><input className={inputCls} value={data.site.terrainType} onChange={(e) => update("site", "terrainType", e.target.value)} /></Field>
            <Field label="Soil Type"><input className={inputCls} value={data.site.soilType} onChange={(e) => update("site", "soilType", e.target.value)} /></Field>
            <Field label="Flood Risk"><input className={inputCls} value={data.site.floodRisk} onChange={(e) => update("site", "floodRisk", e.target.value)} /></Field>
            <Field label="Grid Distance (km)"><input type="number" className={inputCls} value={data.site.gridDistance ?? ""} onChange={(e) => update("site", "gridDistance", e.target.value ? Number(e.target.value) : null)} /></Field>
            <Field label="Access Road Required"><input type="checkbox" checked={data.site.accessRoadRequired} onChange={(e) => update("site", "accessRoadRequired", e.target.checked)} className="mr-2" /></Field>
            <Field label="Water Available"><input type="checkbox" checked={data.site.waterAvailable} onChange={(e) => update("site", "waterAvailable", e.target.checked)} className="mr-2" /></Field>
          </>
        );
      case 7:
        return (
          <>
            {[
              ["specificYieldKwhPerKwp", "Specific Yield kWh/kWp *"],
              ["poaIrradiance", "POA Irradiance (kWh/m²)"],
              ["totalLossPct", "Total Loss %"],
              ["availabilityPct", "Availability %"],
              ["year1DegradationPct", "Year 1 Degradation %"],
              ["annualDegradationPct", "Annual Degradation %"],
              ["projectLifeYears", "Project Life Years"]
            ].map(([field, label]) => (
              <Field key={field} label={label}>
                <input type="number" step="any" className={inputCls} value={(data.yield as unknown as Record<string, unknown>)[field] as number ?? ""} onChange={(e) => update("yield", field, e.target.value ? Number(e.target.value) : null)} />
              </Field>
            ))}
          </>
        );
      case 8:
        return (
          <>
            {[
              ["moduleCost", "Module Cost (per module) *"],
              ["inverterCost", "Inverter Cost (per unit) *"],
              ["structureCostPerMwp", "Structure Cost per MWp"],
              ["bessCostPerMwh", "BESS Cost per MWh"],
              ["civilCostPerMwp", "Civil Cost per MWp"],
              ["electricalCostPerMwac", "Electrical Cost per MWac"],
              ["engineeringCost", "Engineering Cost (fixed)"],
              ["contingencyPct", "Contingency %"]
            ].map(([field, label]) => (
              <Field key={field} label={label}>
                <input type="number" step="any" className={inputCls} value={(data.capex as unknown as Record<string, unknown>)[field] as number ?? ""} onChange={(e) => update("capex", field, e.target.value ? Number(e.target.value) : null)} />
              </Field>
            ))}
          </>
        );
      case 9:
        return (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">{data.info.projectName || "Untitled Project"}</h3>
              <p className="text-sm text-slate-500">{data.info.projectType} · {data.info.projectStage} · {data.info.country}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4"><p className="text-xs text-slate-500">PV DC Capacity</p><p className="text-lg font-bold">{data.capacity.pvDcCapacityMwp ?? "Needs Input"} MWp</p></div>
              <div className="rounded-lg border p-4"><p className="text-xs text-slate-500">PV AC Capacity</p><p className="text-lg font-bold">{data.capacity.pvAcCapacityMwac ?? "Needs Input"} MWac</p></div>
              <div className="rounded-lg border p-4"><p className="text-xs text-slate-500">Module</p><p className="text-lg font-bold">{data.pvModule.moduleManufacturer} {data.pvModule.moduleModel}</p></div>
              <div className="rounded-lg border p-4"><p className="text-xs text-slate-500">Inverter</p><p className="text-lg font-bold">{data.inverter.inverterManufacturer} {data.inverter.inverterModel}</p></div>
              {data.bess.enabled && (
                <div className="rounded-lg border p-4"><p className="text-xs text-slate-500">BESS</p><p className="text-lg font-bold">{data.bess.bessPowerMw} MW / {data.bess.bessEnergyMwh} MWh</p></div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader title="New Project" description="Multi-step wizard to create a PV or PV+BESS project configuration" />

      <div className="mb-6 flex items-center gap-1 overflow-x-auto">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                i === step ? "bg-blue-600 text-white" : i < step ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {i < step ? <Check className="h-3 w-3" /> : <span>{i + 1}</span>}
              {s}
            </button>
            {i < STEPS.length - 1 && <div className="mx-1 h-px w-4 bg-slate-200" />}
          </div>
        ))}
      </div>

      <Card title={STEPS[step]}>
        <div className="max-w-2xl">{renderStep()}</div>
        <div className="mt-6 flex justify-between border-t pt-4">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
              <button onClick={handleCreate} disabled={creating} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                <Check className="h-4 w-4" /> {creating ? "Creating..." : "Create Project"}
              </button>
          )}
        </div>
      </Card>
    </div>
  );
}
