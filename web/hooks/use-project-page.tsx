"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useApp } from "@/context/app-context";
import type { Project } from "@/lib/types";
import { runProjectCalculations } from "@/lib/calculations";
import { validateExportReady } from "@/lib/validation";

export function useProjectPage() {
  const params = useParams();
  const projectId = params.project_id as string;
  const { projects, admin, updateProject, setActive } = useApp();

  const project = projects.find((p) => p.id === projectId) ?? null;

  useEffect(() => {
    if (projectId) setActive(projectId);
  }, [projectId, setActive]);

  const calcs = project ? runProjectCalculations(project, admin) : null;
  const exportValidation = project ? validateExportReady(project) : null;

  const save = (updated: Project) => updateProject(updated);

  return { project, projectId, admin, calcs, exportValidation, save };
}

export function NoProjectSelected() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16">
      <p className="text-lg font-semibold text-slate-700">No project selected</p>
      <p className="mt-2 text-sm text-slate-500">Create a new project or select one from the sidebar.</p>
      <a href="/projects/new" className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Create New Project
      </a>
    </div>
  );
}

export function ProjectNotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white py-16">
      <p className="text-lg font-semibold text-slate-700">Project not found</p>
      <a href="/projects" className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        View All Projects
      </a>
    </div>
  );
}
