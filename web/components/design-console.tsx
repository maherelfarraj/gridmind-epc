"use client";

import { useMemo, useState } from "react";
import { runDesignCalculation, type DesignInput } from "@/lib/engineering";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function DesignConsole() {
  const [input, setInput] = useState<DesignInput>({
    projectName: "GridMind EPC Demonstration Plant",
    capacityMwp: 60,
    trackersCount: 1650,
    cableLengthMeters: 12400,
    ambientTempC: 45
  });

  const output = useMemo(() => runDesignCalculation(input), [input]);

  async function saveDesign() {
    const response = await fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });

    if (!response.ok) {
      alert("Calculation save failed. Check Supabase environment variables.");
      return;
    }

    const data = await response.json();
    alert(`Design calculated and saved. ID: ${data.designId ?? "local-only"}`);
  }

  async function downloadProposal() {
    const response = await fetch("/api/proposal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, output })
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GridMind_Proposal_${input.projectName.replaceAll(" ", "_")}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <section className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-gridmind-navy">Design Inputs</h2>

        <label className="mt-5 block text-sm font-semibold text-slate-600">Project Name</label>
        <input
          className="mt-2 w-full rounded-xl border px-4 py-3"
          value={input.projectName}
          onChange={(event) => setInput({ ...input, projectName: event.target.value })}
        />

        <label className="mt-5 block text-sm font-semibold text-slate-600">Target Capacity MWp</label>
        <input
          type="number"
          className="mt-2 w-full rounded-xl border px-4 py-3"
          value={input.capacityMwp}
          onChange={(event) => setInput({ ...input, capacityMwp: Number(event.target.value) })}
        />

        <label className="mt-5 block text-sm font-semibold text-slate-600">Tracker Structures</label>
        <input
          type="number"
          className="mt-2 w-full rounded-xl border px-4 py-3"
          value={input.trackersCount}
          onChange={(event) => setInput({ ...input, trackersCount: Number(event.target.value) })}
        />

        <label className="mt-5 block text-sm font-semibold text-slate-600">MV Cable Length Meters</label>
        <input
          type="number"
          className="mt-2 w-full rounded-xl border px-4 py-3"
          value={input.cableLengthMeters}
          onChange={(event) => setInput({ ...input, cableLengthMeters: Number(event.target.value) })}
        />

        <label className="mt-5 block text-sm font-semibold text-slate-600">Ambient Temperature °C</label>
        <input
          type="number"
          className="mt-2 w-full rounded-xl border px-4 py-3"
          value={input.ambientTempC}
          onChange={(event) => setInput({ ...input, ambientTempC: Number(event.target.value) })}
        />

        <button onClick={saveDesign} className="mt-6 w-full rounded-xl bg-gridmind-navy px-5 py-3 font-bold text-white">
          Calculate + Save to Supabase
        </button>
        <button onClick={downloadProposal} className="mt-3 w-full rounded-xl bg-gridmind-orange px-5 py-3 font-bold text-white">
          Download Branded PDF Proposal
        </button>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold text-gridmind-navy">Calculated Output</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Metric title="Total EPC CAPEX" value={money(output.totalCostUsd)} />
          <Metric title="Recommended Transformer" value={`${output.transformerMva} MVA`} />
          <Metric title="MV Conductor" value={`${output.conductorSizeMm2} mm² Al`} />
          <Metric title="Estimated Cable Losses" value={`${output.lossPct.toFixed(2)}%`} />
        </div>

        <h3 className="mt-8 text-lg font-bold text-gridmind-navy">BOM Cost Breakdown</h3>
        <div className="mt-4 overflow-hidden rounded-2xl border">
          {Object.entries(output.bom).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b px-4 py-3 last:border-b-0">
              <span className="font-medium text-slate-700">{key}</span>
              <span className="font-semibold text-gridmind-navy">{money(value)}</span>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-lg font-bold text-gridmind-navy">SCADA Preview</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Metric title="Transformer Oil Temp" value="42.3 °C" />
          <Metric title="Dissolved Gas" value="32 PPM" />
          <Metric title="Grid Throughput" value="44.1 MVA" />
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-gridmind-mist p-5">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gridmind-navy">{value}</p>
    </div>
  );
}
