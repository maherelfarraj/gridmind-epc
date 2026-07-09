"use client";

// Only ephemeral, per-browser UI state lives here now. All project and admin
// data is persisted in Neon via server actions in app/actions/projects.ts.

const ACTIVE_KEY = "pv_mind_active_project";

export function getActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProjectId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}
