"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Battery,
  Cable,
  FileText,
  LayoutDashboard,
  FolderKanban,
  PlusCircle,
  Settings,
  Sun,
  Zap,
  BarChart3,
  DollarSign,
  Package,
  Network,
  ClipboardList,
  Rocket,
  ChevronDown
} from "lucide-react";
import { useApp } from "@/context/app-context";
import { useState } from "react";

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/projects/new", label: "New Project", icon: PlusCircle },
  { href: "/rollouts", label: "Rollouts", icon: Rocket }
];

const projectNav = [
  { href: "pv-configurator", label: "PV Configurator", icon: Sun },
  { href: "bess-configurator", label: "BESS Configurator", icon: Battery },
  { href: "stringing", label: "Stringing", icon: Cable },
  { href: "yield", label: "Yield Estimate", icon: BarChart3 },
  { href: "capex", label: "CAPEX Estimate", icon: DollarSign },
  { href: "bom", label: "BOM / BOQ", icon: Package },
  { href: "sld", label: "SLD Preview", icon: Network },
  { href: "reports", label: "Reports", icon: FileText }
];

export function Sidebar() {
  const pathname = usePathname();
  const { activeProject, projects, setActive } = useApp();
  const [showProjectSelect, setShowProjectSelect] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-700 px-5 py-5">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-emerald-400" />
          <div>
            <p className="text-sm font-bold tracking-tight">PV_Mind Cockpit</p>
            <p className="text-[10px] text-slate-400">A GridMind EPC Solar Design & Configuration Cockpit</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Main</p>
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              isActive(item.href) ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}

        <div className="relative mt-6">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Active Project</p>
          <button
            onClick={() => setShowProjectSelect(!showProjectSelect)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-800 px-3 py-2.5 text-sm text-slate-200 hover:bg-slate-700"
          >
            <span className="truncate">{activeProject?.info.projectName || "No project selected"}</span>
            <ChevronDown className="h-4 w-4 shrink-0" />
          </button>
          {showProjectSelect && (
            <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
              {projects.length === 0 ? (
                <p className="px-3 py-2 text-xs text-slate-400">No projects yet</p>
              ) : (
                projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActive(p.id);
                      setShowProjectSelect(false);
                    }}
                    className={`block w-full truncate px-3 py-2 text-left text-sm hover:bg-slate-700 ${
                      activeProject?.id === p.id ? "text-emerald-400" : "text-slate-300"
                    }`}
                  >
                    {p.info.projectName || "Untitled"}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {activeProject && (
          <>
            <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Project Modules</p>
            {projectNav.map((item) => {
              const href = `/projects/${activeProject.id}/${item.href}`;
              return (
                <Link
                  key={item.href}
                  href={href}
                  className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    pathname === href ? "bg-emerald-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href={`/projects/${activeProject.id}`}
              className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                pathname === `/projects/${activeProject.id}` ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              Project Overview
            </Link>
          </>
        )}

        <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">System</p>
        <Link
          href="/admin/settings"
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
            isActive("/admin/settings") ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
          }`}
        >
          <Settings className="h-4 w-4" />
          Admin Settings
        </Link>
      </nav>

      <div className="border-t border-slate-700 px-5 py-3">
        <p className="text-[10px] text-slate-500">GridMind EPC</p>
      </div>
    </aside>
  );
}
