"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { PageHeader, Card } from "@/components/ui-parts";
import { useToast } from "@/components/toast-provider";
import type { AdminSettings, UserRole } from "@/lib/types";
import { Save } from "lucide-react";

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const ROLES: UserRole[] = ["Admin", "Engineer", "Cost Engineer", "Viewer"];

type Tab = "general" | "modules" | "inverters" | "structures" | "costs" | "yield" | "users";

export default function AdminSettingsPage() {
  const { admin, updateAdmin } = useApp();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AdminSettings>(admin);
  const [tab, setTab] = useState<Tab>("general");

  const save = () => {
    updateAdmin(settings);
    showToast("Admin settings saved", "success");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "modules", label: "Module Library" },
    { id: "inverters", label: "Inverter Library" },
    { id: "structures", label: "Structure Library" },
    { id: "costs", label: "Cost Assumptions" },
    { id: "yield", label: "Yield Assumptions" },
    { id: "users", label: "Users & Permissions" }
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <PageHeader title="Admin Settings" description="Manage libraries, assumptions, and user permissions" />
        <button onClick={save} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <Save className="h-4 w-4" /> Save Settings
        </button>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "general" && (
        <Card title="Company Profile">
          <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
            <div>
              <label className="mb-1 block text-sm font-medium">Company Name</label>
              <input className={inputCls} value={settings.companyName} onChange={(e) => setSettings({ ...settings, companyName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <select className={inputCls} value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })}>
                {["USD", "EUR", "GBP", "AUD", "ZAR"].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Transformer Station Rating (MW)</label>
              <input type="number" className={inputCls} value={settings.transformerStationRatingMw} onChange={(e) => setSettings({ ...settings, transformerStationRatingMw: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Cold Temperature Correction Factor</label>
              <input type="number" step="0.01" className={inputCls} value={settings.coldTemperatureCorrectionFactor} onChange={(e) => setSettings({ ...settings, coldTemperatureCorrectionFactor: Number(e.target.value) })} />
            </div>
          </div>
        </Card>
      )}

      {tab === "modules" && (
        <Card title="Module Library">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Manufacturer", "Model", "Power Wp", "Voc", "Unit Cost"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-semibold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settings.moduleLibrary.map((m) => (
                  <tr key={m.id} className="border-t">
                    <td className="px-4 py-2">{m.manufacturer}</td>
                    <td className="px-4 py-2">{m.model}</td>
                    <td className="px-4 py-2">{m.powerWp}</td>
                    <td className="px-4 py-2">{m.voc}</td>
                    <td className="px-4 py-2">${m.unitCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "inverters" && (
        <Card title="Inverter Library">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Manufacturer", "Model", "Power kW", "MPPT", "Unit Cost"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-semibold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settings.inverterLibrary.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="px-4 py-2">{inv.manufacturer}</td>
                    <td className="px-4 py-2">{inv.model}</td>
                    <td className="px-4 py-2">{inv.ratedPowerKw}</td>
                    <td className="px-4 py-2">{inv.mpptCount}</td>
                    <td className="px-4 py-2">${inv.unitCost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "structures" && (
        <Card title="Structure Library">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Type", "Foundation", "Cost per MWp"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-semibold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settings.structureLibrary.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-4 py-2">{s.type}</td>
                    <td className="px-4 py-2">{s.foundationType}</td>
                    <td className="px-4 py-2">${s.costPerMwp.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "costs" && (
        <Card title="Default Cost Assumptions">
          <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
            {Object.entries(settings.defaultCapex).map(([key, val]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{key.replace(/([A-Z])/g, " $1")}</label>
                <input
                  type="number"
                  className={inputCls}
                  value={val ?? ""}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaultCapex: { ...settings.defaultCapex, [key]: e.target.value ? Number(e.target.value) : null }
                  })}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "yield" && (
        <Card title="Default Yield Assumptions">
          <div className="grid gap-4 md:grid-cols-2 max-w-2xl">
            {Object.entries(settings.defaultYield).map(([key, val]) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{key.replace(/([A-Z])/g, " $1")}</label>
                <input
                  type="number"
                  className={inputCls}
                  value={val ?? ""}
                  onChange={(e) => setSettings({
                    ...settings,
                    defaultYield: { ...settings.defaultYield, [key]: e.target.value ? Number(e.target.value) : null }
                  })}
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "users" && (
        <Card title="Users & Permissions">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {["Name", "Email", "Role"].map((h) => (
                    <th key={h} className="px-4 py-2 text-left font-semibold text-slate-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settings.users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">
                      <select
                        className="rounded border px-2 py-1 text-sm"
                        value={u.role}
                        onChange={(e) => setSettings({
                          ...settings,
                          users: settings.users.map((user) =>
                            user.id === u.id ? { ...user, role: e.target.value as UserRole } : user
                          )
                        })}
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
