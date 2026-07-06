import type { AdminSettings } from "./types";

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  currency: "USD",
  companyName: "GridMind EPC",
  companyLogo: "",
  transformerStationRatingMw: 40,
  coldTemperatureCorrectionFactor: 1.15,
  moduleLibrary: [
    {
      id: "mod-1",
      technology: "Mono PERC",
      manufacturer: "Trina Solar",
      model: "Vertex 650W",
      powerWp: 650,
      voc: 49.5,
      vmp: 41.2,
      isc: 16.8,
      imp: 15.8,
      maxSystemVoltage: 1500,
      tempCoeffVoc: -0.27,
      degradationRate: 0.5,
      unitCost: 180
    },
    {
      id: "mod-2",
      technology: "TOPCon",
      manufacturer: "Jinko Solar",
      model: "Tiger Neo 620W",
      powerWp: 620,
      voc: 48.2,
      vmp: 40.1,
      isc: 16.2,
      imp: 15.5,
      maxSystemVoltage: 1500,
      tempCoeffVoc: -0.25,
      degradationRate: 0.45,
      unitCost: 175
    }
  ],
  inverterLibrary: [
    {
      id: "inv-1",
      type: "Central",
      manufacturer: "Sungrow",
      model: "SG350HX",
      ratedPowerKw: 350,
      maxDcVoltage: 1500,
      mpptCount: 12,
      maxCurrentPerMppt: 30,
      maxStringsPerMppt: 2,
      physicalDcConnectorInputs: 24,
      acOutputVoltage: 800,
      efficiencyPct: 98.5,
      unitCost: 45000
    },
    {
      id: "inv-2",
      type: "String",
      manufacturer: "Huawei",
      model: "SUN2000-215KTL",
      ratedPowerKw: 215,
      maxDcVoltage: 1100,
      mpptCount: 10,
      maxCurrentPerMppt: 26,
      maxStringsPerMppt: 2,
      physicalDcConnectorInputs: 20,
      acOutputVoltage: 800,
      efficiencyPct: 98.7,
      unitCost: 32000
    }
  ],
  structureLibrary: [
    { id: "str-1", type: "Fixed Tilt Ground Mount", costPerMwp: 85000, foundationType: "Driven Pile" },
    { id: "str-2", type: "Single-Axis Tracker", costPerMwp: 120000, foundationType: "Driven Pile" }
  ],
  defaultYield: {
    specificYieldKwhPerKwp: 1650,
    poaIrradiance: 2000,
    totalLossPct: 14,
    availabilityPct: 98,
    year1DegradationPct: 2,
    annualDegradationPct: 0.5,
    projectLifeYears: 25
  },
  defaultCapex: {
    moduleCost: 180,
    inverterCost: 45000,
    structureCostPerMwp: 85000,
    bessCostPerMwh: 250000,
    civilCostPerMwp: 45000,
    electricalCostPerMwac: 120000,
    engineeringCost: 500000,
    contingencyPct: 5
  },
  users: [
    { id: "u-1", name: "Admin User", email: "admin@pvmind.ai", role: "Admin" },
    { id: "u-2", name: "Engineer User", email: "engineer@pvmind.ai", role: "Engineer" }
  ]
};
