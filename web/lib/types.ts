export type ProjectType = "PV Only" | "PV + BESS";
export type ProjectStage = "Feasibility" | "Design" | "Tender" | "Construction" | "O&M";
export type ReportStatus = "Draft" | "Ready" | "Exported";
export type UserRole = "Admin" | "Engineer" | "Cost Engineer" | "Viewer";

export interface ProjectInfo {
  projectName: string;
  clientName: string;
  country: string;
  city: string;
  siteAddress: string;
  latitude: number | null;
  longitude: number | null;
  currency: string;
  projectType: ProjectType;
  projectStage: ProjectStage;
  notes: string;
}

export interface CapacityConfig {
  pvDcCapacityMwp: number | null;
  pvAcCapacityMwac: number | null;
  exportLimitMw: number | null;
}

export interface PvModuleConfig {
  moduleTechnology: string;
  moduleManufacturer: string;
  moduleModel: string;
  modulePowerWp: number | null;
  moduleVoc: number | null;
  moduleVmp: number | null;
  moduleIsc: number | null;
  moduleImp: number | null;
  maxSystemVoltage: number | null;
  tempCoeffVoc: number | null;
  degradationRate: number | null;
}

export interface InverterConfig {
  inverterType: string;
  inverterManufacturer: string;
  inverterModel: string;
  inverterRatedPowerKw: number | null;
  maxDcVoltage: number | null;
  mpptCount: number | null;
  maxCurrentPerMppt: number | null;
  maxStringsPerMppt: number | null;
  physicalDcConnectorInputs: number | null;
  acOutputVoltage: number | null;
  efficiencyPct: number | null;
}

export interface StructureConfig {
  structureType: string;
  tiltAngle: number | null;
  rowPitch: number | null;
  groundCoverageRatio: number | null;
  foundationType: string;
  trackerRequired: boolean;
}

export interface BessConfig {
  enabled: boolean;
  bessPowerMw: number | null;
  bessEnergyMwh: number | null;
  batteryChemistry: string;
  pcsRatingMw: number | null;
  containerSizeMwh: number | null;
  roundTripEfficiencyPct: number | null;
  depthOfDischargePct: number | null;
  dailyCycles: number | null;
  coolingMethod: string;
  fireSystemRequired: boolean;
}

export interface SiteConditions {
  siteArea: number | null;
  siteAreaUnit: string;
  terrainType: string;
  soilType: string;
  floodRisk: string;
  gridDistance: number | null;
  accessRoadRequired: boolean;
  waterAvailable: boolean;
}

export interface YieldAssumptions {
  specificYieldKwhPerKwp: number | null;
  poaIrradiance: number | null;
  totalLossPct: number | null;
  availabilityPct: number | null;
  year1DegradationPct: number | null;
  annualDegradationPct: number | null;
  projectLifeYears: number | null;
}

export interface CapexAssumptions {
  moduleCost: number | null;
  inverterCost: number | null;
  structureCostPerMwp: number | null;
  bessCostPerMwh: number | null;
  civilCostPerMwp: number | null;
  electricalCostPerMwac: number | null;
  engineeringCost: number | null;
  contingencyPct: number | null;
}

export interface ReportRecord {
  id: string;
  type: string;
  status: ReportStatus;
  generatedAt: string | null;
}

export interface Project {
  id: string;
  createdAt: string;
  updatedAt: string;
  info: ProjectInfo;
  capacity: CapacityConfig;
  pvModule: PvModuleConfig;
  inverter: InverterConfig;
  structure: StructureConfig;
  bess: BessConfig;
  site: SiteConditions;
  yield: YieldAssumptions;
  capex: CapexAssumptions;
  reports: ReportRecord[];
}

export interface LibraryModule {
  id: string;
  technology: string;
  manufacturer: string;
  model: string;
  powerWp: number;
  voc: number;
  vmp: number;
  isc: number;
  imp: number;
  maxSystemVoltage: number;
  tempCoeffVoc: number;
  degradationRate: number;
  unitCost: number;
}

export interface LibraryInverter {
  id: string;
  type: string;
  manufacturer: string;
  model: string;
  ratedPowerKw: number;
  maxDcVoltage: number;
  mpptCount: number;
  maxCurrentPerMppt: number;
  maxStringsPerMppt: number;
  physicalDcConnectorInputs: number;
  acOutputVoltage: number;
  efficiencyPct: number;
  unitCost: number;
}

export interface LibraryStructure {
  id: string;
  type: string;
  costPerMwp: number;
  foundationType: string;
}

export interface AdminSettings {
  currency: string;
  companyName: string;
  companyLogo: string;
  transformerStationRatingMw: number;
  coldTemperatureCorrectionFactor: number;
  moduleLibrary: LibraryModule[];
  inverterLibrary: LibraryInverter[];
  structureLibrary: LibraryStructure[];
  defaultYield: YieldAssumptions;
  defaultCapex: CapexAssumptions;
  users: { id: string; name: string; email: string; role: UserRole }[];
}

export function createEmptyProject(): Omit<Project, "id" | "createdAt" | "updatedAt"> {
  return {
    info: {
      projectName: "",
      clientName: "",
      country: "",
      city: "",
      siteAddress: "",
      latitude: null,
      longitude: null,
      currency: "USD",
      projectType: "PV Only",
      projectStage: "Feasibility",
      notes: ""
    },
    capacity: { pvDcCapacityMwp: null, pvAcCapacityMwac: null, exportLimitMw: null },
    pvModule: {
      moduleTechnology: "",
      moduleManufacturer: "",
      moduleModel: "",
      modulePowerWp: null,
      moduleVoc: null,
      moduleVmp: null,
      moduleIsc: null,
      moduleImp: null,
      maxSystemVoltage: null,
      tempCoeffVoc: null,
      degradationRate: null
    },
    inverter: {
      inverterType: "",
      inverterManufacturer: "",
      inverterModel: "",
      inverterRatedPowerKw: null,
      maxDcVoltage: null,
      mpptCount: null,
      maxCurrentPerMppt: null,
      maxStringsPerMppt: null,
      physicalDcConnectorInputs: null,
      acOutputVoltage: null,
      efficiencyPct: null
    },
    structure: {
      structureType: "",
      tiltAngle: null,
      rowPitch: null,
      groundCoverageRatio: null,
      foundationType: "",
      trackerRequired: false
    },
    bess: {
      enabled: false,
      bessPowerMw: null,
      bessEnergyMwh: null,
      batteryChemistry: "",
      pcsRatingMw: null,
      containerSizeMwh: null,
      roundTripEfficiencyPct: null,
      depthOfDischargePct: null,
      dailyCycles: null,
      coolingMethod: "",
      fireSystemRequired: false
    },
    site: {
      siteArea: null,
      siteAreaUnit: "hectares",
      terrainType: "",
      soilType: "",
      floodRisk: "",
      gridDistance: null,
      accessRoadRequired: false,
      waterAvailable: false
    },
    yield: {
      specificYieldKwhPerKwp: null,
      poaIrradiance: null,
      totalLossPct: null,
      availabilityPct: null,
      year1DegradationPct: null,
      annualDegradationPct: null,
      projectLifeYears: null
    },
    capex: {
      moduleCost: null,
      inverterCost: null,
      structureCostPerMwp: null,
      bessCostPerMwh: null,
      civilCostPerMwp: null,
      electricalCostPerMwac: null,
      engineeringCost: null,
      contingencyPct: null
    },
    reports: []
  };
}
