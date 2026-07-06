"use client";

import type { AdminSettings, Project } from "./types";
import { createEmptyProject } from "./types";
import { DEFAULT_ADMIN_SETTINGS } from "./admin-defaults";

const PROJECTS_KEY = "pv_mind_projects";
const ADMIN_KEY = "pv_mind_admin";
const ACTIVE_KEY = "pv_mind_active_project";

function generateId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    return raw ? (JSON.parse(raw) as Project[]) : [];
  } catch {
    return [];
  }
}

export function getProject(id: string): Project | null {
  return getProjects().find((p) => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === project.id);
  const updated = { ...project, updatedAt: new Date().toISOString() };
  if (idx >= 0) projects[idx] = updated;
  else projects.push(updated);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function createProject(
  data: Omit<Project, "id" | "createdAt" | "updatedAt">
): Project {
  const now = new Date().toISOString();
  const project: Project = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now
  };
  saveProject(project);
  return project;
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function getActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProjectId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function getAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return DEFAULT_ADMIN_SETTINGS;
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(raw) } : DEFAULT_ADMIN_SETTINGS;
  } catch {
    return DEFAULT_ADMIN_SETTINGS;
  }
}

export function saveAdminSettings(settings: AdminSettings): void {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(settings));
}

export function createNewProjectData(): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  const admin = getAdminSettings();
  const empty = createEmptyProject();
  return {
    ...empty,
    info: { ...empty.info, currency: admin.currency },
    yield: { ...admin.defaultYield },
    capex: { ...admin.defaultCapex }
  };
}
