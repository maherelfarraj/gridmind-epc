import type { AdminSettings, BessConfig, CapacityConfig, CapexAssumptions, InverterConfig, Project, PvModuleConfig, StructureConfig, YieldAssumptions } from "./types";
import { ceilPositive, floorPositive, isValidNumber, safeDivide } from "./format";

export interface PvCalculationResult {
  pvDcCapacityWp: number | null;
  pvAcCapacityKw: number | null;
  dcAcRatio: number | null;
  numberOfModules: number | null;
  correctedColdVoc: number | null;
  modulesPerString: number | null;
  numberOfStrings: number | null;
  stringsPerMppt: number | null;
  stringsPerInverter: number | null;
  inverterQtyByAc: number | null;
  inverterQtyByString: number | null;
  finalInverterQuantity: number | null;
  transformerQuantity: number | null;
  validations: ValidationItem[];
}

export interface BessCalculationResult {
  bessDuration: number | null;
  containerQuantity: number | null;
  pcsQuantity: number | null;
  usableEnergy: number | null;
  annualBessDischargeEnergy: number | null;
  bessLosses: number | null;
}

export interface YieldCalculationResult {
  grossPvEnergyMwh: number | null;
  netPvEnergyMwh: number | null;
  energySoldToGrid: number | null;
  performanceRatio: number | null;
  capacityFactor: number | null;
  lifetimeEnergy: number | null;
  yearlyEnergy: { year: number; energy: number }[];
  monthlyEnergy: { month: string; energy: number }[];
  netExportEnergy: number | null;
}

export interface CapexCalculationResult {
  pvModuleCapex: number | null;
  inverterCapex: number | null;
  structureCapex: number | null;
  bessCapex: number | null;
  civilCapex: number | null;
  electricalCapex: number | null;
  subtotalCapex: number | null;
  contingency: number | null;
  totalCapex: number | null;
  capexPerMwp: number | null;
  capexPerMwac: number | null;
  simpleLcoe: number | null;
}

export interface BomItem {
  category: string;
  description: string;
  unit: string;
  quantity: number | null;
  unitCost: number | null;
  totalCost: number | null;
  notes: string;
}

export interface ValidationItem {
  type: "error" | "warning" | "success";
  message: string;
}

function pctToDecimal(pct: number | null): number | null {
  if (!isValidNumber(pct)) return null;
  return pct / 100;
}

export function calculatePv(
  capacity: CapacityConfig,
  pvModule: PvModuleConfig,
  inverter: InverterConfig,
  admin: AdminSettings
): PvCalculationResult {
  const validations: ValidationItem[] = [];
  const pvDcCapacityWp = isValidNumber(capacity.pvDcCapacityMwp)
    ? capacity.pvDcCapacityMwp * 1_000_000
    : null;
  const pvAcCapacityKw = isValidNumber(capacity.pvAcCapacityMwac)
    ? capacity.pvAcCapacityMwac * 1000
    : null;
  const dcAcRatio = safeDivide(capacity.pvDcCapacityMwp, capacity.pvAcCapacityMwac);

  if (isValidNumber(dcAcRatio) && dcAcRatio > 1.45) {
    validations.push({
      type: "warning",
      message: `DC/AC ratio ${dcAcRatio.toFixed(2)} exceeds 1.45 — clipping risk expected`
    });
  }

  const numberOfModules = safeDivide(pvDcCapacityWp, pvModule.modulePowerWp);
  const modulesRounded = ceilPositive(numberOfModules);

  const correctedColdVoc =
    isValidNumber(pvModule.moduleVoc) && isValidNumber(admin.coldTemperatureCorrectionFactor)
      ? pvModule.moduleVoc * admin.coldTemperatureCorrectionFactor
      : null;

  const modulesPerStringRaw = safeDivide(pvModule.maxSystemVoltage, correctedColdVoc);
  const modulesPerString = floorPositive(modulesPerStringRaw);

  const numberOfStrings = safeDivide(modulesRounded, modulesPerString);
  const stringsRounded = ceilPositive(numberOfStrings);

  const stringsPerMpptRaw = safeDivide(inverter.maxCurrentPerMppt, pvModule.moduleImp);
  const stringsPerMppt = floorPositive(stringsPerMpptRaw);

  const stringsPerInverter =
    isValidNumber(inverter.mpptCount) && isValidNumber(stringsPerMppt)
      ? inverter.mpptCount * stringsPerMppt
      : null;

  const inverterQtyByAc = safeDivide(pvAcCapacityKw, inverter.inverterRatedPowerKw);
  const inverterQtyByString = safeDivide(stringsRounded, stringsPerInverter);

  let finalInverterQuantity: number | null = null;
  if (isValidNumber(inverterQtyByAc) || isValidNumber(inverterQtyByString)) {
    const ac = inverterQtyByAc ?? 0;
    const str = inverterQtyByString ?? 0;
    finalInverterQuantity = Math.max(ac, str);
    if (finalInverterQuantity > 0) finalInverterQuantity = Math.ceil(finalInverterQuantity);
    else finalInverterQuantity = null;
  }

  const transformerQuantity = safeDivide(
    capacity.pvAcCapacityMwac,
    admin.transformerStationRatingMw
  );
  const transformerQty = isValidNumber(transformerQuantity) ? Math.ceil(transformerQuantity) : null;

  if (
    isValidNumber(modulesPerString) &&
    isValidNumber(pvModule.moduleVoc) &&
    isValidNumber(pvModule.maxSystemVoltage)
  ) {
    const stringVoltage = modulesPerString * pvModule.moduleVoc;
    if (stringVoltage > pvModule.maxSystemVoltage) {
      validations.push({
        type: "error",
        message: `String voltage ${stringVoltage.toFixed(0)}V exceeds max system voltage ${pvModule.maxSystemVoltage}V`
      });
    } else {
      validations.push({ type: "success", message: "String voltage within max system voltage" });
    }
  }

  if (isValidNumber(stringsPerMppt) && isValidNumber(inverter.maxStringsPerMppt)) {
    if (stringsPerMppt > inverter.maxStringsPerMppt) {
      validations.push({
        type: "error",
        message: `Strings per MPPT (${stringsPerMppt}) exceeds max strings per MPPT (${inverter.maxStringsPerMppt})`
      });
    }
  }

  if (isValidNumber(stringsRounded) && isValidNumber(inverter.physicalDcConnectorInputs) && isValidNumber(finalInverterQuantity)) {
    const totalConnectorsNeeded = stringsRounded;
    const totalAvailable = finalInverterQuantity * inverter.physicalDcConnectorInputs;
    if (totalConnectorsNeeded > totalAvailable) {
      validations.push({
        type: "error",
        message: `Configured strings (${totalConnectorsNeeded}) exceed physical DC connector inputs (${totalAvailable})`
      });
    }
  }

  if (isValidNumber(pvModule.moduleImp) && isValidNumber(inverter.maxCurrentPerMppt)) {
    const mpptCurrent = pvModule.moduleImp;
    if (mpptCurrent > inverter.maxCurrentPerMppt) {
      validations.push({
        type: "error",
        message: `Module Imp (${mpptCurrent}A) exceeds max current per MPPT (${inverter.maxCurrentPerMppt}A)`
      });
    }
  }

  return {
    pvDcCapacityWp,
    pvAcCapacityKw,
    dcAcRatio,
    numberOfModules: modulesRounded,
    correctedColdVoc,
    modulesPerString,
    numberOfStrings: stringsRounded,
    stringsPerMppt,
    stringsPerInverter,
    inverterQtyByAc: isValidNumber(inverterQtyByAc) ? Math.ceil(inverterQtyByAc) : null,
    inverterQtyByString: isValidNumber(inverterQtyByString) ? Math.ceil(inverterQtyByString) : null,
    finalInverterQuantity,
    transformerQuantity: transformerQty,
    validations
  };
}

export function calculateBess(bess: BessConfig): BessCalculationResult {
  if (!bess.enabled) {
    return {
      bessDuration: null,
      containerQuantity: null,
      pcsQuantity: null,
      usableEnergy: null,
      annualBessDischargeEnergy: null,
      bessLosses: null
    };
  }

  const bessDuration = safeDivide(bess.bessEnergyMwh, bess.bessPowerMw);
  const containerQtyRaw = safeDivide(bess.bessEnergyMwh, bess.containerSizeMwh);
  const containerQuantity = isValidNumber(containerQtyRaw) ? Math.ceil(containerQtyRaw) : null;
  const pcsQtyRaw = safeDivide(bess.bessPowerMw, bess.pcsRatingMw);
  const pcsQuantity = isValidNumber(pcsQtyRaw) ? Math.ceil(pcsQtyRaw) : null;

  const dod = pctToDecimal(bess.depthOfDischargePct);
  const rte = pctToDecimal(bess.roundTripEfficiencyPct);
  const usableEnergy =
    isValidNumber(bess.bessEnergyMwh) && isValidNumber(dod) && isValidNumber(rte)
      ? bess.bessEnergyMwh * dod * rte
      : null;

  const annualBessDischargeEnergy =
    isValidNumber(usableEnergy) && isValidNumber(bess.dailyCycles)
      ? usableEnergy * bess.dailyCycles * 365
      : null;

  const bessLosses =
    isValidNumber(bess.bessEnergyMwh) && isValidNumber(rte)
      ? bess.bessEnergyMwh * 365 * (1 - rte)
      : null;

  return {
    bessDuration,
    containerQuantity,
    pcsQuantity,
    usableEnergy,
    annualBessDischargeEnergy,
    bessLosses
  };
}

export function calculateYield(
  capacity: CapacityConfig,
  yieldAssumptions: YieldAssumptions,
  bess: BessConfig,
  bessCalc: BessCalculationResult
): YieldCalculationResult {
  const grossPvEnergyMwh =
    isValidNumber(capacity.pvDcCapacityMwp) && isValidNumber(yieldAssumptions.specificYieldKwhPerKwp)
      ? capacity.pvDcCapacityMwp * yieldAssumptions.specificYieldKwhPerKwp
      : null;

  const lossDecimal = pctToDecimal(yieldAssumptions.totalLossPct);
  const netPvEnergyMwh =
    isValidNumber(grossPvEnergyMwh) && isValidNumber(lossDecimal)
      ? grossPvEnergyMwh * (1 - lossDecimal)
      : null;

  const energySoldToGrid = netPvEnergyMwh;

  const performanceRatio = safeDivide(
    netPvEnergyMwh,
    isValidNumber(capacity.pvDcCapacityMwp) && isValidNumber(yieldAssumptions.poaIrradiance)
      ? capacity.pvDcCapacityMwp * yieldAssumptions.poaIrradiance
      : null
  );

  const capacityFactor = safeDivide(
    netPvEnergyMwh,
    isValidNumber(capacity.pvAcCapacityMwac) ? capacity.pvAcCapacityMwac * 8760 : null
  );

  const yearlyEnergy: { year: number; energy: number }[] = [];
  let lifetimeEnergy: number | null = null;

  if (isValidNumber(netPvEnergyMwh) && isValidNumber(yieldAssumptions.projectLifeYears)) {
    const year1Deg = pctToDecimal(yieldAssumptions.year1DegradationPct) ?? 0;
    const annualDeg = pctToDecimal(yieldAssumptions.annualDegradationPct) ?? 0;
    const year1Energy = netPvEnergyMwh * (1 - year1Deg);
    let total = 0;
    for (let n = 1; n <= yieldAssumptions.projectLifeYears; n++) {
      const energy = n === 1 ? year1Energy : year1Energy * Math.pow(1 - annualDeg, n - 1);
      yearlyEnergy.push({ year: n, energy });
      total += energy;
    }
    lifetimeEnergy = total;
  }

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const seasonalFactors = [0.06, 0.07, 0.09, 0.1, 0.11, 0.11, 0.11, 0.1, 0.09, 0.08, 0.06, 0.05];
  const monthlyEnergy = months.map((month, i) => ({
    month,
    energy: isValidNumber(netPvEnergyMwh) ? netPvEnergyMwh * seasonalFactors[i] : 0
  }));

  let netExportEnergy: number | null = netPvEnergyMwh;
  if (bess.enabled && isValidNumber(netPvEnergyMwh)) {
    const bessExport = bessCalc.annualBessDischargeEnergy ?? 0;
    const losses = bessCalc.bessLosses ?? 0;
    netExportEnergy = netPvEnergyMwh + bessExport - losses;
  }

  return {
    grossPvEnergyMwh,
    netPvEnergyMwh,
    energySoldToGrid,
    performanceRatio: isValidNumber(performanceRatio) ? performanceRatio * 100 : null,
    capacityFactor: isValidNumber(capacityFactor) ? capacityFactor * 100 : null,
    lifetimeEnergy,
    yearlyEnergy,
    monthlyEnergy,
    netExportEnergy
  };
}

export function calculateCapex(
  capacity: CapacityConfig,
  capex: CapexAssumptions,
  pvCalc: PvCalculationResult,
  bess: BessConfig,
  yieldCalc: YieldCalculationResult,
  currency: string
): CapexCalculationResult {
  const pvModuleCapex =
    isValidNumber(pvCalc.numberOfModules) && isValidNumber(capex.moduleCost)
      ? pvCalc.numberOfModules * capex.moduleCost
      : null;

  const inverterCapex =
    isValidNumber(pvCalc.finalInverterQuantity) && isValidNumber(capex.inverterCost)
      ? pvCalc.finalInverterQuantity * capex.inverterCost
      : null;

  const structureCapex =
    isValidNumber(capacity.pvDcCapacityMwp) && isValidNumber(capex.structureCostPerMwp)
      ? capacity.pvDcCapacityMwp * capex.structureCostPerMwp
      : null;

  const bessCapex =
    bess.enabled && isValidNumber(bess.bessEnergyMwh) && isValidNumber(capex.bessCostPerMwh)
      ? bess.bessEnergyMwh * capex.bessCostPerMwh
      : bess.enabled ? null : 0;

  const civilCapex =
    isValidNumber(capacity.pvDcCapacityMwp) && isValidNumber(capex.civilCostPerMwp)
      ? capacity.pvDcCapacityMwp * capex.civilCostPerMwp
      : null;

  const electricalCapex =
    isValidNumber(capacity.pvAcCapacityMwac) && isValidNumber(capex.electricalCostPerMwac)
      ? capacity.pvAcCapacityMwac * capex.electricalCostPerMwac
      : null;

  const parts = [pvModuleCapex, inverterCapex, structureCapex, bessCapex, civilCapex, electricalCapex, capex.engineeringCost];
  const subtotalCapex = parts.every((p) => isValidNumber(p)) ? parts.reduce((a, b) => a + (b as number), 0) : null;

  const contingencyPct = pctToDecimal(capex.contingencyPct);
  const contingency =
    isValidNumber(subtotalCapex) && isValidNumber(contingencyPct)
      ? subtotalCapex * contingencyPct
      : null;

  const totalCapex =
    isValidNumber(subtotalCapex) && isValidNumber(contingency) ? subtotalCapex + contingency : null;

  const capexPerMwp = safeDivide(totalCapex, capacity.pvDcCapacityMwp);
  const capexPerMwac = safeDivide(totalCapex, capacity.pvAcCapacityMwac);
  const simpleLcoe = safeDivide(totalCapex, yieldCalc.lifetimeEnergy);

  void currency;
  return {
    pvModuleCapex,
    inverterCapex,
    structureCapex,
    bessCapex,
    civilCapex,
    electricalCapex,
    subtotalCapex,
    contingency,
    totalCapex,
    capexPerMwp,
    capexPerMwac,
    simpleLcoe
  };
}

export function generateBom(
  project: Project,
  pvCalc: PvCalculationResult,
  bessCalc: BessCalculationResult,
  capexCalc: CapexCalculationResult
): BomItem[] {
  const { capacity, pvModule, inverter, structure, bess, capex } = project;
  const items: BomItem[] = [];

  const add = (category: string, description: string, unit: string, qty: number | null, unitCost: number | null, notes = "") => {
    const totalCost = isValidNumber(qty) && isValidNumber(unitCost) ? qty * unitCost : null;
    items.push({ category, description, unit, quantity: qty, unitCost, totalCost, notes });
  };

  add("PV Modules", `${pvModule.moduleManufacturer} ${pvModule.moduleModel}`, "pcs", pvCalc.numberOfModules, capex.moduleCost);
  add("Inverters", `${inverter.inverterManufacturer} ${inverter.inverterModel}`, "pcs", pvCalc.finalInverterQuantity, capex.inverterCost);
  add("Mounting Structure", structure.structureType || "Ground Mount", "system", 1, capexCalc.structureCapex, `Tilt ${structure.tiltAngle ?? "—"}°`);
  if (structure.trackerRequired) {
    add("Trackers", "Single-Axis Tracker System", "MWp", capacity.pvDcCapacityMwp, safeDivide(capexCalc.structureCapex, capacity.pvDcCapacityMwp));
  }
  add("Foundation / Piles", structure.foundationType || "Driven Pile", "MWp", capacity.pvDcCapacityMwp, safeDivide(capexCalc.civilCapex, capacity.pvDcCapacityMwp) ? (capex.civilCostPerMwp ?? null) : null);
  add("DC Cables", "PV DC Collection Cables", "km", isValidNumber(capacity.pvDcCapacityMwp) ? capacity.pvDcCapacityMwp * 2.5 : null, 15000);
  add("AC Cables", "Inverter to Transformer AC Cables", "km", isValidNumber(capacity.pvAcCapacityMwac) ? capacity.pvAcCapacityMwac * 1.2 : null, 25000);
  add("MV Cables", "MV Collection to Grid", "km", project.site.gridDistance, 45000);
  add("Connectors", "MC4 / DC Connectors", "sets", pvCalc.numberOfStrings, 25);
  add("Combiner Boxes", "DC Combiner Boxes", "pcs", pvCalc.finalInverterQuantity, 3500);
  add("Transformers", "MV Transformer Station", "pcs", pvCalc.transformerQuantity, 500000);
  add("Switchgear", "MV Switchgear", "set", 1, 250000);
  add("SCADA", "SCADA Monitoring Device", "set", 1, 75000, "Placeholder");
  add("Weather Station", "Meteorological Station", "set", 1, 35000);
  add("Earthing", "Grounding System", "system", 1, isValidNumber(capacity.pvDcCapacityMwp) ? capacity.pvDcCapacityMwp * 15000 : null);
  add("Lightning Protection", "Lightning Protection System", "system", 1, isValidNumber(capacity.pvDcCapacityMwp) ? capacity.pvDcCapacityMwp * 8000 : null);

  if (bess.enabled) {
    add("BESS Containers", bess.batteryChemistry || "LFP Container", "pcs", bessCalc.containerQuantity, safeDivide(capex.bessCostPerMwh, bess.containerSizeMwh));
    add("PCS", "Power Conversion System", "pcs", bessCalc.pcsQuantity, 180000);
    add("EMS", "Energy Management System", "set", 1, 120000);
    if (bess.fireSystemRequired) {
      add("Fire System", "BESS Fire Suppression", "set", bessCalc.containerQuantity, 25000);
    }
  }

  return items;
}

export function runProjectCalculations(project: Project, admin: AdminSettings) {
  const pv = calculatePv(project.capacity, project.pvModule, project.inverter, admin);
  const bess = calculateBess(project.bess);
  const yieldCalc = calculateYield(project.capacity, project.yield, project.bess, bess);
  const capex = calculateCapex(project.capacity, project.capex, pv, project.bess, yieldCalc, project.info.currency);
  const bom = generateBom(project, pv, bess, capex);
  return { pv, bess, yield: yieldCalc, capex, bom };
}
