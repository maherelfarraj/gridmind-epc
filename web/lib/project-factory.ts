import type { AdminSettings, Project } from "./types";
import { createEmptyProject } from "./types";

export type NewProjectData = Omit<Project, "id" | "createdAt" | "updatedAt">;

export function createNewProjectData(admin: AdminSettings): NewProjectData {
  const empty = createEmptyProject();
  return {
    ...empty,
    info: { ...empty.info, currency: admin.currency },
    yield: { ...admin.defaultYield },
    capex: { ...admin.defaultCapex },
  };
}
