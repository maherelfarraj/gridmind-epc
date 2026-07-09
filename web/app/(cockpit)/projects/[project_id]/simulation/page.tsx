"use client";

import { useMemo, useState } from "react";
import { useProjectPage, ProjectNotFound } from "@/hooks/use-project-page";
import { PageHeader, Card, CalcPanel, MetricRow } from "@/components/ui-parts";
import { LossDiagram } from "@/components/loss-diagram";
import { formatNumber } from "@/lib/format";
import { useToast } from "@/components/toast-provider";
import { runSimulation, defaultSimInputs, type SimulationInputs } from "@/lib/simulation";
import { downloadReport } from "@/lib/export";
import { Play, Upload, FileText, RotateCcw } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart
} from "recharts";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function SimulationPage() {
  const { project, calcs, save } = useProjectPage();
  const { showToast } = useToast();

  const [inputs, setInputs] = useState<SimulationInputs | null>(null);
  const [meteoText, setMeteoText] = useState("");
  const [hasRun, setHasRun] = useState(false);

  // initialize inputs from project once available
  const baseInputs = useMemo(() => (project ? defaultSimInputs(project) : null), [project]);
  const effective = inputs ?? baseInputs;

  const result = useMemo(() => {
    if (!effective || !hasRun) return null;
    return runSimulation(effective);
  }, [effective, hasRun]);

  if (!project) return <ProjectNotFound />;
  if (!effective) return null;

  const update = (patch: Partial<SimulationInputs>) => {
    setInputs({ ...effective, ...patch });
  };

  const pct = (v: number) => Math.round(v * 1000) / 10; // fraction -> %
  const fromPct = (v: number) => v / 100;

  const handleRun = () => {
    setHasRun(true);
    showToast("8760 hourly simulation complete", "success");
  };

  const handleReset = () => {
    setInputs(baseInputs);
    setMeteoText("");
    setHasRun(false);
    showToast("Simulation inputs reset to project defaults", "info");
  };

  const handleParseMeteo = () => {
    // Accept 12 comma/space/newline separated monthly GHI values (kWh/m2/day)
    const nums = meteoText
      .split(/[\s,;]+/)
      .map((s) => parseFloat(s))
      .filter((n) => !Number.isNaN(n));
    if (nums.length < 12) {
      showToast("Provide 12 monthly GHI values (kWh/m2/day)", "warning");
      return;
    }
    update({ monthlyGhiOverride: nums.slice(0, 12) });
    showToast("Imported 12 monthly GHI values", "success");
  };

  const handleSaveYield = () => {
    if (!result) return;
    save({
      ...project,
      yield: {
        ...project.yield,
        specificYieldKwhPerKwp: result.specificYield,
        poaIrradiance: result.annualPoa,
      },
    });
    showToast("Specific yield & POA saved to Yield Estimate", "success");
  };

  return (
    <div>
      <PageHeader title="8760 Simulation" description="Hourly energy model with orientation, shading, thermal and inverter physics" />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* ---------------- Controls ---------------- */}
        <div className="space-y-6">
          <Card title="Meteo & Location">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Latitude</label>
                  <input type="number" step="any" className={inputCls} value={effective.latitude}
                    onChange={(e) => update({ latitude: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Longitude</label>
                  <input type="number" step="any" className={inputCls} value={effective.longitude}
                    onChange={(e) => update({ longitude: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Annual clearness index (Kt): {effective.clearnessIndex.toFixed(2)}
                </label>
                <input type="range" min={0.4} max={0.8} step={0.01} className="w-full"
                  value={effective.clearnessIndex}
                  onChange={(e) => update({ clearnessIndex: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Ground albedo: {effective.albedo.toFixed(2)}</label>
                <input type="range" min={0.1} max={0.5} step={0.01} className="w-full"
                  value={effective.albedo}
                  onChange={(e) => update({ albedo: Number(e.target.value) })} />
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="mb-1 block text-xs font-medium text-slate-600">Import monthly GHI (kWh/m²/day × 12)</label>
                <textarea className={`${inputCls} h-16 font-mono text-xs`} placeholder="5.1, 5.6, 6.4, 7.0, 7.6, 7.9, 7.7, 7.3, 6.8, 6.0, 5.3, 4.9"
                  value={meteoText} onChange={(e) => setMeteoText(e.target.value)} />
                <button onClick={handleParseMeteo}
                  className="mt-2 flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100">
                  <Upload className="h-3.5 w-3.5" /> Import TMY
                </button>
                {effective.monthlyGhiOverride && (
                  <p className="mt-1.5 text-[11px] text-emerald-600">Using imported meteo data</p>
                )}
              </div>
            </div>
          </Card>

          <Card title="Orientation & Layout">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={effective.tracking}
                  onChange={(e) => update({ tracking: e.target.checked })} />
                Single-axis tracker (backtracking)
              </label>
              {!effective.tracking && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Tilt °</label>
                    <input type="number" className={inputCls} value={effective.tilt}
                      onChange={(e) => update({ tilt: Number(e.target.value) })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Azimuth ° (180=S)</label>
                    <input type="number" className={inputCls} value={effective.azimuth}
                      onChange={(e) => update({ azimuth: Number(e.target.value) })} />
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Ground coverage ratio (GCR): {effective.groundCoverageRatio.toFixed(2)}
                </label>
                <input type="range" min={0.2} max={0.8} step={0.01} className="w-full"
                  value={effective.groundCoverageRatio}
                  onChange={(e) => update({ groundCoverageRatio: Number(e.target.value) })} />
              </div>
            </div>
          </Card>

          <Card title="Loss Assumptions">
            <div className="grid grid-cols-2 gap-3">
              {([
                ["soiling", "Soiling %"],
                ["mismatch", "Mismatch %"],
                ["lidQuality", "LID + Quality %"],
                ["dcOhmic", "DC ohmic %"],
                ["acOhmic", "AC ohmic %"],
                ["transformer", "Transformer %"],
              ] as [keyof SimulationInputs, string][]).map(([field, label]) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
                  <input type="number" step="0.1" className={inputCls}
                    value={pct(effective[field] as number)}
                    onChange={(e) => update({ [field]: fromPct(Number(e.target.value)) } as Partial<SimulationInputs>)} />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Inverter eff. %</label>
                <input type="number" step="0.1" className={inputCls}
                  value={pct(effective.inverterEfficiency)}
                  onChange={(e) => update({ inverterEfficiency: fromPct(Number(e.target.value)) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Availability %</label>
                <input type="number" step="0.1" className={inputCls}
                  value={pct(effective.availability)}
                  onChange={(e) => update({ availability: fromPct(Number(e.target.value)) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Temp coeff %/°C</label>
                <input type="number" step="0.01" className={inputCls}
                  value={effective.tempCoeffPowerPctPerC}
                  onChange={(e) => update({ tempCoeffPowerPctPerC: Number(e.target.value) })} />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={handleRun}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                <Play className="h-4 w-4" /> Run Simulation
              </button>
              <button onClick={handleReset}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </Card>
        </div>

        {/* ---------------- Results ---------------- */}
        <div className="space-y-6">
          {!result ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Activity />
                <p className="mt-4 text-lg font-semibold text-slate-700">Ready to simulate</p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Configure meteo, orientation and losses on the left, then run the 8760-hour model to
                  see the annual energy yield and detailed loss diagram.
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <KpiTile label="Specific Yield" value={formatNumber(result.specificYield)} unit="kWh/kWp" accent="blue" />
                <KpiTile label="Annual Energy" value={formatNumber(result.annualEnergyMwh)} unit="MWh/yr" accent="emerald" />
                <KpiTile label="Performance Ratio" value={`${result.performanceRatio}`} unit="%" accent="amber" />
                <KpiTile label="Capacity Factor" value={`${result.capacityFactor}`} unit="%" accent="slate" />
              </div>

              <Card title="PV Loss Diagram (energy cascade)">
                <LossDiagram losses={result.losses} />
              </Card>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card title="Monthly GHI vs POA">
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={result.monthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="ghi" fill="#f59e0b" name="GHI kWh/m²" />
                      <Line type="monotone" dataKey="poa" stroke="#2563eb" strokeWidth={2} name="POA kWh/m²" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Monthly Energy Production">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={result.monthly}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="energy" fill="#10b981" name="MWh" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              <Card title="Representative Day Power Profile (June)">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={result.hourlySample}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} label={{ value: "Hour", position: "insideBottom", offset: -2, fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="poa" stroke="#f59e0b" fill="#fde68a" name="POA W/m²" />
                    <Area type="monotone" dataKey="ac" stroke="#10b981" fill="#a7f3d0" name="AC MW" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <CalcPanel title="Simulation Detail">
                <MetricRow label="Annual GHI" value={formatNumber(result.annualGhi)} unit="kWh/m²" />
                <MetricRow label="Annual POA" value={formatNumber(result.annualPoa)} unit="kWh/m²" />
                <MetricRow label="Transposition Gain" value={`${result.transpositionGain}`} unit="%" />
                <MetricRow label="Avg Cell Temp" value={`${result.avgCellTemp}`} unit="°C" />
                <MetricRow label="Clipping Loss" value={`${result.clippingLossPct}`} unit="%" />
                <MetricRow label="Clipping Hours" value={formatNumber(result.peakClippingHours)} unit="h/yr" />
              </CalcPanel>

              <div className="flex flex-wrap gap-2">
                <button onClick={handleSaveYield}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                  Save results to Yield Estimate
                </button>
                <button onClick={() => calcs && downloadReport("Yield Estimate Report", project, calcs)}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <FileText className="h-4 w-4" /> Export Yield Report
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiTile({ label, value, unit, accent }: { label: string; value: string; unit: string; accent: string }) {
  const accents: Record<string, string> = {
    blue: "text-blue-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    slate: "text-slate-700",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accents[accent] ?? "text-slate-900"}`}>{value}</p>
      <p className="text-[11px] text-slate-400">{unit}</p>
    </div>
  );
}

function Activity() {
  return (
    <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h4l3 8 4-16 3 8h4" />
    </svg>
  );
}
