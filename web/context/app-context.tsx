"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AdminSettings, Project } from "@/lib/types";
import {
  getActiveProjectId,
  getAdminSettings,
  getProject,
  getProjects,
  saveAdminSettings,
  saveProject,
  setActiveProjectId
} from "@/lib/storage";

interface AppContextValue {
  projects: Project[];
  activeProject: Project | null;
  admin: AdminSettings;
  refresh: () => void;
  setActive: (id: string | null) => void;
  updateProject: (project: Project) => void;
  updateAdmin: (settings: AdminSettings) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [admin, setAdmin] = useState<AdminSettings>(getAdminSettings());
  const [mounted, setMounted] = useState(false);

  const refresh = useCallback(() => {
    const list = getProjects();
    setProjects(list);
    const activeId = getActiveProjectId();
    if (activeId) {
      const proj = getProject(activeId);
      setActiveProject(proj);
    } else if (list.length > 0) {
      setActiveProject(list[0]);
      setActiveProjectId(list[0].id);
    } else {
      setActiveProject(null);
    }
    setAdmin(getAdminSettings());
  }, []);

  useEffect(() => {
    refresh();
    setMounted(true);
  }, [refresh]);

  const setActive = (id: string | null) => {
    setActiveProjectId(id);
    setActiveProject(id ? getProject(id) : null);
  };

  const updateProject = (project: Project) => {
    saveProject(project);
    refresh();
  };

  const updateAdmin = (settings: AdminSettings) => {
    saveAdminSettings(settings);
    setAdmin(settings);
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <AppContext.Provider value={{ projects, activeProject, admin, refresh, setActive, updateProject, updateAdmin }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
