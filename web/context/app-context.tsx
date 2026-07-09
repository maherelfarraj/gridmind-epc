"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AdminSettings, Project } from "@/lib/types";
import { DEFAULT_ADMIN_SETTINGS } from "@/lib/admin-defaults";
import { getActiveProjectId, setActiveProjectId } from "@/lib/storage";
import {
  createProjectAction,
  deleteProjectAction,
  getAdminSettingsAction,
  listProjects,
  saveAdminSettingsAction,
  saveProjectAction,
} from "@/app/actions/projects";
import type { NewProjectData } from "@/lib/project-factory";

interface AppContextValue {
  projects: Project[];
  activeProject: Project | null;
  admin: AdminSettings;
  loading: boolean;
  refresh: () => Promise<void>;
  setActive: (id: string | null) => void;
  createProject: (data: NewProjectData) => Promise<Project>;
  updateProject: (project: Project) => void;
  deleteProject: (id: string) => Promise<void>;
  updateAdmin: (settings: AdminSettings) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [list, savedAdmin] = await Promise.all([listProjects(), getAdminSettingsAction()]);
    setProjects(list);
    setAdmin(savedAdmin ? { ...DEFAULT_ADMIN_SETTINGS, ...savedAdmin } : DEFAULT_ADMIN_SETTINGS);

    const storedActive = getActiveProjectId();
    const resolved = storedActive && list.some((p) => p.id === storedActive)
      ? storedActive
      : list[0]?.id ?? null;
    setActiveProjectIdState(resolved);
    setActiveProjectId(resolved);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const setActive = (id: string | null) => {
    setActiveProjectId(id);
    setActiveProjectIdState(id);
  };

  const createProject = async (data: NewProjectData) => {
    const created = await createProjectAction(data);
    setProjects((prev) => [created, ...prev]);
    setActive(created.id);
    return created;
  };

  const updateProject = (project: Project) => {
    // optimistic local update, then persist
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    void saveProjectAction(project).then((saved) => {
      setProjects((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
    });
  };

  const deleteProject = async (id: string) => {
    await deleteProjectAction(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (activeProjectId === id) setActive(null);
  };

  const updateAdmin = (settings: AdminSettings) => {
    setAdmin(settings);
    void saveAdminSettingsAction(settings);
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  return (
    <AppContext.Provider
      value={{
        projects,
        activeProject,
        admin,
        loading,
        refresh,
        setActive,
        createProject,
        updateProject,
        deleteProject,
        updateAdmin,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
