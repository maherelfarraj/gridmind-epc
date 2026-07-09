"use client";

import type { Project } from "./types";

type NewProject = Omit<Project, "id" | "createdAt" | "updatedAt">;

export type { NewProject };

const SAMPLE_PROJECTS: NewProject[] = [
  {
    info: {
      projectName: "Al Dhafra Solar Park",
      clientName: "Emirates Water & Electricity Co.",
      country: "United Arab Emirates",
      city: "Abu Dhabi",
      siteAddress: "Al Dhafra Region, 35 km south of Abu Dhabi",
      latitude: 24.0,
      longitude: 54.3,
      currency: "USD",
      projectType: "PV Only",
      projectStage: "Design",
      notes: "Utility-scale single-axis tracker plant with 1500 V DC architecture."
    },
    capacity: { pvDcCapacityMwp: 100, pvAcCapacityMwac: 80, exportLimitMw: 80 },
    pvModule: {
      moduleTechnology: "TOPCon",
      moduleManufacturer: "Jinko Solar",
      moduleModel: "Tiger Neo 620W",
      modulePowerWp: 620,
      moduleVoc: 48.2,
      moduleVmp: 40.1,
      moduleIsc: 16.2,
      moduleImp: 15.5,
      maxSystemVoltage: 1500,
      tempCoeffVoc: -0.25,
      degradationRate: 0.45
    },
    inverter: {
      inverterType: "Central",
      inverterManufacturer: "Sungrow",
      inverterModel: "SG350HX",
      inverterRatedPowerKw: 350,
      maxDcVoltage: 1500,
      mpptCount: 12,
      maxCurrentPerMppt: 30,
      maxStringsPerMppt: 2,
      physicalDcConnectorInputs: 24,
      acOutputVoltage: 800,
      efficiencyPct: 98.5
    },
    structure: {
      structureType: "Single-Axis Tracker",
      tiltAngle: 0,
      rowPitch: 6.5,
      groundCoverageRatio: 0.35,
      foundationType: "Driven Pile",
      trackerRequired: true
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
      siteArea: 200,
      siteAreaUnit: "hectares",
      terrainType: "Flat Desert",
      soilType: "Sandy",
      floodRisk: "Low",
      gridDistance: 5,
      accessRoadRequired: true,
      waterAvailable: true
    },
    yield: {
      specificYieldKwhPerKwp: 1750,
      poaIrradiance: 2150,
      totalLossPct: 13,
      availabilityPct: 98.5,
      year1DegradationPct: 2,
      annualDegradationPct: 0.45,
      projectLifeYears: 25
    },
    capex: {
      moduleCost: 175,
      inverterCost: 45000,
      structureCostPerMwp: 120000,
      bessCostPerMwh: 250000,
      civilCostPerMwp: 45000,
      electricalCostPerMwac: 120000,
      engineeringCost: 500000,
      contingencyPct: 5
    },
    reports: [
      { id: "rep-sample-1", type: "Technical Design Report", status: "Draft", generatedAt: null }
    ]
  },
  {
    info: {
      projectName: "NEOM Hybrid Energy Hub",
      clientName: "NEOM Energy",
      country: "Saudi Arabia",
      city: "Tabuk",
      siteAddress: "NEOM Development Zone, northwest Saudi Arabia",
      latitude: 28.0,
      longitude: 35.3,
      currency: "USD",
      projectType: "PV + BESS",
      projectStage: "Feasibility",
      notes: "Hybrid PV + BESS plant providing firm capacity and evening peak shifting."
    },
    capacity: { pvDcCapacityMwp: 150, pvAcCapacityMwac: 120, exportLimitMw: 100 },
    pvModule: {
      moduleTechnology: "Mono PERC",
      moduleManufacturer: "Trina Solar",
      moduleModel: "Vertex 650W",
      modulePowerWp: 650,
      moduleVoc: 49.5,
      moduleVmp: 41.2,
      moduleIsc: 16.8,
      moduleImp: 15.8,
      maxSystemVoltage: 1500,
      tempCoeffVoc: -0.27,
      degradationRate: 0.5
    },
    inverter: {
      inverterType: "String",
      inverterManufacturer: "Huawei",
      inverterModel: "SUN2000-215KTL",
      inverterRatedPowerKw: 215,
      maxDcVoltage: 1100,
      mpptCount: 10,
      maxCurrentPerMppt: 26,
      maxStringsPerMppt: 2,
      physicalDcConnectorInputs: 20,
      acOutputVoltage: 800,
      efficiencyPct: 98.7
    },
    structure: {
      structureType: "Fixed Tilt Ground Mount",
      tiltAngle: 25,
      rowPitch: 7,
      groundCoverageRatio: 0.4,
      foundationType: "Driven Pile",
      trackerRequired: false
    },
    bess: {
      enabled: true,
      bessPowerMw: 50,
      bessEnergyMwh: 200,
      batteryChemistry: "LFP",
      pcsRatingMw: 50,
      containerSizeMwh: 5,
      roundTripEfficiencyPct: 88,
      depthOfDischargePct: 90,
      dailyCycles: 1.5,
      coolingMethod: "Liquid Cooled",
      fireSystemRequired: true
    },
    site: {
      siteArea: 320,
      siteAreaUnit: "hectares",
      terrainType: "Rolling Hills",
      soilType: "Rocky",
      floodRisk: "Low",
      gridDistance: 12,
      accessRoadRequired: true,
      waterAvailable: false
    },
    yield: {
      specificYieldKwhPerKwp: 1820,
      poaIrradiance: 2250,
      totalLossPct: 14,
      availabilityPct: 98,
      year1DegradationPct: 2,
      annualDegradationPct: 0.5,
      projectLifeYears: 25
    },
    capex: {
      moduleCost: 180,
      inverterCost: 32000,
      structureCostPerMwp: 85000,
      bessCostPerMwh: 250000,
      civilCostPerMwp: 45000,
      electricalCostPerMwac: 120000,
      engineeringCost: 500000,
      contingencyPct: 6
    },
    reports: [
      { id: "rep-sample-2", type: "Feasibility Study", status: "Draft", generatedAt: null }
    ]
  }
];

export function getSampleProjectData(): NewProject[] {
  return SAMPLE_PROJECTS;
}
