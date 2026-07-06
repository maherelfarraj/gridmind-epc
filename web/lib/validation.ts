import type { Project } from "./types";
import { isValidNumber } from "./format";

export interface ExportValidation {
  exportReady: boolean;
  missingFields: string[];
  message: string;
}

export function validateExportReady(project: Project): ExportValidation {
  const missing: string[] = [];

  if (!project.info.projectName?.trim()) missing.push("Project Name");
  if (!isValidNumber(project.capacity.pvDcCapacityMwp)) missing.push("PV DC Capacity MWp");
  if (!isValidNumber(project.capacity.pvAcCapacityMwac)) missing.push("PV AC Capacity MWac");
  if (!isValidNumber(project.pvModule.modulePowerWp)) missing.push("Module Power Wp");
  if (!isValidNumber(project.pvModule.moduleVoc)) missing.push("Module Voc");
  if (!isValidNumber(project.inverter.inverterRatedPowerKw)) missing.push("Inverter Rating");
  if (!isValidNumber(project.inverter.mpptCount)) missing.push("MPPT Count");
  if (!isValidNumber(project.inverter.maxCurrentPerMppt)) missing.push("Max Current per MPPT");
  if (!isValidNumber(project.yield.specificYieldKwhPerKwp)) missing.push("Specific Yield");
  if (!isValidNumber(project.capex.moduleCost)) missing.push("Module Cost");
  if (!isValidNumber(project.capex.inverterCost)) missing.push("Inverter Cost");

  if (project.bess.enabled) {
    if (!isValidNumber(project.bess.bessPowerMw)) missing.push("BESS Power MW");
    if (!isValidNumber(project.bess.bessEnergyMwh)) missing.push("BESS Energy MWh");
  }

  const exportReady = missing.length === 0;
  return {
    exportReady,
    missingFields: missing,
    message: exportReady
      ? "[PV_MIND PROJECT READY FOR EXPORT]"
      : "🔒 Export Locked: Complete required PV, BESS, yield, and CAPEX inputs before exporting."
  };
}

export function isProjectIncomplete(project: Project): boolean {
  return !validateExportReady(project).exportReady;
}
