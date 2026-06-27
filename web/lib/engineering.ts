export type DesignInput = {
  projectName: string;
  capacityMwp: number;
  trackersCount: number;
  cableLengthMeters: number;
  ambientTempC: number;
};

export type DesignOutput = {
  transformerMva: number;
  conductorSizeMm2: number;
  lineCurrentA: number;
  lossPct: number;
  totalCostUsd: number;
  bom: {
    pvModules: number;
    trackerStructures: number;
    mvCollectionCable: number;
    transformerSubstation: number;
    installationLabor: number;
  };
};

export function calculateMvCableRequirements(
  blockPowerKw: number,
  lineVoltageV: number,
  distanceMeters: number
) {
  const powerFactor = 0.95;
  const lineCurrent = (blockPowerKw * 1000) / (Math.sqrt(3) * lineVoltageV * powerFactor);
  const standardSizes = [50, 70, 95, 120, 150, 185, 240, 300, 400];
  const ampacityLimits: Record<number, number> = {
    50: 145,
    70: 175,
    95: 210,
    120: 240,
    150: 270,
    185: 310,
    240: 360,
    300: 410,
    400: 470
  };
  const selectedSize = standardSizes.find((size) => ampacityLimits[size] >= lineCurrent) ?? 400;
  const resistance = (2.82e-8 * distanceMeters) / (selectedSize * 1e-6);
  const lossPct = (3 * lineCurrent ** 2 * resistance / (blockPowerKw * 1000)) * 100;
  return {
    size: selectedSize,
    lossPct: Number(lossPct.toFixed(3)),
    lineCurrentA: Number(lineCurrent.toFixed(2))
  };
}

export function sizeHighVoltageTransformer(plantMwp: number, ambientTempC: number) {
  const baseMva = plantMwp / 0.95;
  const deratingFactor = Math.max(0.55, 1.0 - Math.max(0, ambientTempC - 30.0) * 0.01);
  const standardSizes = [25, 40, 63, 80, 100, 125, 160, 200, 250];
  return standardSizes.find((size) => size >= baseMva / deratingFactor) ?? 250;
}

export function generateBomAndPricing(
  totalTrackers: number,
  calculatedMwp: number,
  totalCableMeters: number,
  transformerMva: number
) {
  const priceBook = {
    tracker: 1850.0,
    pv: 0.18,
    cable: 24.5,
    tx: 11500.0,
    labor: 450.0
  };

  const pvModules = calculatedMwp * 1_000_000 * priceBook.pv;
  const trackerStructures = totalTrackers * priceBook.tracker;
  const mvCollectionCable = totalCableMeters * priceBook.cable;
  const transformerSubstation = transformerMva * priceBook.tx;
  const installationLabor = totalTrackers * priceBook.labor;
  const totalCostUsd =
    pvModules + trackerStructures + mvCollectionCable + transformerSubstation + installationLabor;

  return {
    totalCostUsd,
    bom: {
      pvModules,
      trackerStructures,
      mvCollectionCable,
      transformerSubstation,
      installationLabor
    }
  };
}

export function runDesignCalculation(input: DesignInput): DesignOutput {
  const transformerMva = sizeHighVoltageTransformer(input.capacityMwp, input.ambientTempC);
  const mvData = calculateMvCableRequirements(input.capacityMwp * 1000, 33000, input.cableLengthMeters / 10);
  const pricing = generateBomAndPricing(input.trackersCount, input.capacityMwp, input.cableLengthMeters, transformerMva);

  return {
    transformerMva,
    conductorSizeMm2: mvData.size,
    lineCurrentA: mvData.lineCurrentA,
    lossPct: mvData.lossPct,
    totalCostUsd: pricing.totalCostUsd,
    bom: pricing.bom
  };
}
