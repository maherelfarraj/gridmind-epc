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
  Activity,
  History,
  Database,
  Users,
  ChevronDown,
  LogOut
} from "lucide-react";
import { useApp, type CurrentUser } from "@/context/app-context";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

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
  { href: "simulation", label: "8760 Simulation", icon: Activity },
  { href: "capex", label: "CAPEX Estimate", icon: DollarSign },
  { href: "bom", label: "BOM / BOQ", icon: Package },
  { href: "sld", label: "SLD Preview", icon: Network },
  { href: "scada", label: "SCADA Data", icon: Database },
  { href: "history", label: "Design History", icon: History },
  { href: "reports", label: "Reports", icon: FileText }
];

export function Sidebar({ user }: { user: CurrentUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeProject, projects, setActive, can } = useApp();
  const [showProjectSelect, setShowProjectSelect] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
    router.refresh();
  };

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
        {can("admin:manage") && (
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              isActive("/admin/settings") ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Settings className="h-4 w-4" />
            Admin Settings
          </Link>
        )}
        {can("roles:manage") && (
          <Link
            href="/admin/users"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              isActive("/admin/users") ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
            }`}
          >
            <Users className="h-4 w-4" />
            User Management
          </Link>
        )}
      </nav>

      <div className="border-t border-slate-700 px-4 py-3">
        <div className="mb-2 flex items-center gap-3 px-1">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            <p className="truncate text-[11px] text-slate-400">{user.email}</p>
          </div>
        </div>
        <div className="mb-2 px-1">
          <span className="inline-flex items-center rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400">
            {user.role}
          </span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
