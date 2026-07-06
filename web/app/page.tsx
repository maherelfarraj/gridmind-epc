import Link from "next/link";
import { Zap, Sun, Battery, BarChart3, FileText } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="mb-6 flex items-center gap-3">
          <Zap className="h-8 w-8 text-emerald-400" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-400">GridMind EPC</p>
            <p className="text-xs text-slate-400">Solar Design & Configuration</p>
          </div>
        </div>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight text-white">
          PV_Mind Cockpit
        </h1>
        <p className="mt-4 max-w-2xl text-xl text-slate-300">
          A focused AI-powered cockpit for creating, sizing, checking, and exporting PV / PV+BESS project configurations.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Sun, label: "PV Sizing", desc: "Module & inverter configuration" },
            { icon: Battery, label: "BESS Sizing", desc: "Battery storage integration" },
            { icon: BarChart3, label: "Yield & CAPEX", desc: "Energy and cost estimates" },
            { icon: FileText, label: "Reports & BOM", desc: "Export-ready deliverables" }
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
              <item.icon className="mb-2 h-6 w-6 text-emerald-400" />
              <p className="font-semibold text-white">{item.label}</p>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex gap-4">
          <Link href="/dashboard" className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white shadow-lg hover:bg-emerald-600">
            Open Dashboard
          </Link>
          <Link href="/projects/new" className="rounded-xl border border-slate-600 px-6 py-3 font-semibold text-white hover:bg-slate-800">
            Create New Project
          </Link>
        </div>
      </section>
    </main>
  );
}
