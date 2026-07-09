import type { Project } from "./types";
import { isValidNumber } from "./format";

// ----------------------------------------------------------------------------
// 8760-hour PV energy simulation engine
//
// A physically-reasonable hourly model that derives a synthetic meteorological
// year from the site latitude (or accepts imported TMY GHI), projects it onto
// the array plane (orientation / tracking), applies near-shading, incidence,
// thermal, electrical and inverter physics, and produces a full PV loss
// cascade (PVsyst-style loss diagram).
// ----------------------------------------------------------------------------

const DEG = Math.PI / 180;
const SOLAR_CONSTANT = 1367; // W/m^2

export interface SimulationInputs {
  latitude: number;
  longitude: number;
  tilt: number; // deg (fixed-tilt surface tilt)
  azimuth: number; // deg, 180 = due south, 0 = due north
  tracking: boolean; // single-axis N-S horizontal tracker w/ backtracking
  groundCoverageRatio: number; // 0..1
  albedo: number; // ground reflectance 0..1
  clearnessIndex: number; // annual average Kt 0..1 (site "sunniness")
  // loss factors (fractions 0..1)
  soiling: number;
  iamRefractionIndex: number; // ASHRAE b0 proxy handled internally
  mismatch: number;
  lidQuality: number; // combined LID + module quality
  dcOhmic: number;
  acOhmic: number;
  transformer: number;
  availability: number;
  // system electrical
  dcCapacityMwp: number;
  acCapacityMwac: number;
  inverterEfficiency: number; // 0..1
  tempCoeffPowerPctPerC: number; // e.g. -0.34 %/°C (negative)
  monthlyGhiOverride?: number[] | null; // kWh/m2/day per month (imported meteo)
}

export interface LossStep {
  key: string;
  label: string;
  // energy remaining after this step, MWh/yr (for the cascade)
  energy: number;
  // loss introduced by this step, MWh/yr (positive number = energy lost)
  loss: number;
  // gain (e.g. transposition) MWh/yr, mutually exclusive with loss
  gain: number;
  lossPct: number; // relative to previous step
}

export interface SimulationResult {
  annualGhi: number; // kWh/m2/yr
  annualPoa: number; // kWh/m2/yr
  transpositionGain: number; // %
  annualEnergyMwh: number; // grid energy MWh/yr
  specificYield: number; // kWh/kWp
  performanceRatio: number; // %
  capacityFactor: number; // %
  clippingLossPct: number;
  avgCellTemp: number; // °C
  peakClippingHours: number;
  monthly: { month: string; ghi: number; poa: number; energy: number }[];
  losses: LossStep[];
  hourlySample: { hour: number; ghi: number; poa: number; ac: number }[]; // representative day
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_MID_DOY = [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344];

// Monthly clearness shape (northern-hemisphere-ish); scaled by the annual Kt.
const KT_SHAPE = [0.92, 0.96, 1.0, 1.04, 1.06, 1.07, 1.06, 1.05, 1.02, 0.98, 0.93, 0.9];

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Solar declination (Cooper)
function declination(doy: number) {
  return 23.45 * DEG * Math.sin(2 * Math.PI * ((284 + doy) / 365));
}

// Extraterrestrial normal irradiance with eccentricity correction
function extraterrestrial(doy: number) {
  return SOLAR_CONSTANT * (1 + 0.033 * Math.cos((2 * Math.PI * doy) / 365));
}

// Erbs diffuse fraction from hourly clearness index
function erbsDiffuseFraction(kt: number) {
  if (kt <= 0.22) return 1 - 0.09 * kt;
  if (kt <= 0.8) return 0.9511 - 0.1604 * kt + 4.388 * kt ** 2 - 16.638 * kt ** 3 + 12.336 * kt ** 4;
  return 0.165;
}

// ASHRAE incidence-angle modifier
function iam(aoiRad: number) {
  const b0 = 0.05;
  const cos = Math.cos(aoiRad);
  if (cos <= 0) return 0;
  return clamp(1 - b0 * (1 / cos - 1), 0, 1);
}

// Synthetic ambient temperature (monthly mean + diurnal swing), latitude-aware
function ambientTemp(latAbs: number, monthIndex: number, hour: number) {
  const seasonal = Math.cos((monthIndex - 6) * (Math.PI / 6)); // ~1 in summer
  const annualMean = 27 - 0.35 * latAbs; // warmer near equator
  const monthlyMean = annualMean + 8 * seasonal * (latAbs > 15 ? 1 : 0.4);
  const diurnal = 6 * Math.sin((hour - 9) * (Math.PI / 12));
  return monthlyMean + diurnal;
}

export function runSimulation(inp: SimulationInputs): SimulationResult {
  const latAbs = Math.abs(inp.latitude);
  const latRad = inp.latitude * DEG;
  const betaFixed = inp.tilt * DEG;
  const surfAz = inp.azimuth * DEG;

  // Target monthly GHI (kWh/m2/day). Either imported or synthesized from Kt.
  const monthlyGhiTarget: number[] = [];
  for (let m = 0; m < 12; m++) {
    if (inp.monthlyGhiOverride && isValidNumber(inp.monthlyGhiOverride[m])) {
      monthlyGhiTarget.push(inp.monthlyGhiOverride[m]);
    } else {
      monthlyGhiTarget.push(NaN);
    }
  }

  const monthlyAgg = MONTHS.map((month) => ({ month, ghi: 0, poa: 0, energy: 0 }));

  let annualGhi = 0;
  let annualPoa = 0;
  let annualBeamPoa = 0;
  let annualShadeLoss = 0;
  let annualIamLoss = 0;
  let poaAfterIam = 0;
  let sumCellTempWeighted = 0;
  let sumPoaForTemp = 0;

  // energy accumulators (MWh)
  let eDcThermal = 0; // DC after temperature (pre other DC losses), from POA-after-IAM
  let eAfterTempOnly = 0;
  let clippingLoss = 0;
  let eDcNominal = 0; // DC at STC efficiency from POA-after-IAM (no temp)
  let peakClippingHours = 0;

  // representative-day (mid-year) hourly trace
  const hourlySample: { hour: number; ghi: number; poa: number; ac: number }[] = [];

  // First pass per month: compute raw GHI shape to allow scaling to target
  for (let m = 0; m < 12; m++) {
    const doy = MONTH_MID_DOY[m];
    const decl = declination(doy);
    const eDay = extraterrestrial(doy);

    // raw daily GHI from clear-sky * Kt to allow normalization
    const ktMonth = clamp(inp.clearnessIndex * KT_SHAPE[m], 0.1, 0.85);

    // accumulate a single representative day then scale by days in month
    let dayGhi = 0;
    const dayHours: { h: number; ghi: number; poa: number; poaBeam: number; poaAfterIam: number; cellFactor: number }[] = [];

    for (let h = 0; h < 24; h++) {
      const hourAngle = (h + 0.5 - 12) * 15 * DEG;
      const cosZen =
        Math.sin(latRad) * Math.sin(decl) +
        Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle);
      if (cosZen <= 0.02) continue; // sun below horizon
      const zenith = Math.acos(clamp(cosZen, -1, 1));
      const altitude = Math.PI / 2 - zenith;

      // solar azimuth (0=N,90=E,180=S,270=W)
      let solAz = Math.atan2(
        Math.sin(hourAngle),
        Math.cos(hourAngle) * Math.sin(latRad) - Math.tan(decl) * Math.cos(latRad)
      );
      solAz = Math.PI + solAz; // shift so due south ~ 180°

      // GHI via clearness against extraterrestrial horizontal
      const ghi0 = eDay * cosZen; // clear-ish top of atmosphere horizontal
      const ghi = ghi0 * ktMonth; // W/m2
      const kt = clamp(ghi / Math.max(ghi0, 1), 0, 0.85);
      const df = erbsDiffuseFraction(kt);
      const dhi = ghi * df;
      const bhi = ghi - dhi; // beam horizontal
      const dni = bhi / Math.max(cosZen, 0.05);

      // ---- Orientation: fixed tilt or single-axis tracker (backtracking) ----
      let beta = betaFixed;
      let gamma = surfAz;
      if (inp.tracking) {
        // N-S horizontal single-axis tracker; ideal rotation toward sun in E-W
        const sinRot = Math.sin(solAz - Math.PI) / Math.tan(altitude);
        let rot = Math.atan(sinRot);
        // backtracking to avoid row-to-row beam shading
        const cover = clamp(inp.groundCoverageRatio, 0.05, 0.9);
        const maxRot = Math.acos(clamp(cover / Math.cos(rot === 0 ? 0 : rot), -1, 1));
        if (Math.abs(rot) > maxRot && isFinite(maxRot)) rot = Math.sign(rot) * maxRot;
        beta = Math.abs(rot);
        gamma = solAz >= Math.PI ? Math.PI / 2 + Math.PI / 2 : Math.PI / 2; // face E or W (approx)
        gamma = rot >= 0 ? Math.PI + Math.PI / 2 : Math.PI - Math.PI / 2;
      }

      // angle of incidence on the plane
      const cosAoi =
        Math.cos(altitude) * Math.sin(beta) * Math.cos(solAz - gamma) +
        Math.sin(altitude) * Math.cos(beta);
      const aoi = Math.acos(clamp(cosAoi, -1, 1));

      // POA components (HDKR-ish: isotropic diffuse + circumsolar via beam)
      const poaBeam = Math.max(dni * cosAoi, 0);
      const poaDiff = dhi * (1 + Math.cos(beta)) / 2;
      const poaGround = ghi * inp.albedo * (1 - Math.cos(beta)) / 2;
      let poa = poaBeam + poaDiff + poaGround;

      // ---- Near (row-to-row) shading on the beam component ----
      let shadeFactor = 1;
      if (!inp.tracking && inp.groundCoverageRatio > 0.01) {
        // profile angle of the sun in the cross-row plane
        const profile = Math.atan2(Math.tan(altitude), Math.max(Math.cos(solAz - gamma), 0.01));
        const pitchRatio = 1 / clamp(inp.groundCoverageRatio, 0.05, 0.9); // pitch / collector width
        // shadow length of a row (relative to collector width)
        const shadowLen = Math.cos(profile) === 0 ? 0 : Math.sin(beta) / Math.tan(Math.max(profile, 0.01));
        const shaded = clamp((shadowLen - (pitchRatio - Math.cos(beta))) / Math.max(1, 1), 0, 1);
        shadeFactor = clamp(1 - shaded * 0.9, 0.2, 1);
      }
      const poaBeamShaded = poaBeam * shadeFactor;
      const shadeLoss = poaBeam - poaBeamShaded;
      poa = poaBeamShaded + poaDiff + poaGround;

      // ---- Incidence-angle modifier (applies mainly to beam) ----
      const iamFactor = iam(aoi);
      const poaIam = poaBeamShaded * iamFactor + poaDiff * 0.95 + poaGround * 0.9;
      const iamLoss = poa - poaIam;

      // ---- Cell temperature & thermal derate ----
      const tAmb = ambientTemp(latAbs, m, h);
      const tCell = tAmb + (poaIam / 800) * 29; // NOCT-style rise (~29°C at 800 W/m2)
      const tempDerate = 1 + (inp.tempCoeffPowerPctPerC / 100) * (tCell - 25);

      dayHours.push({
        h,
        ghi,
        poa,
        poaBeam,
        poaAfterIam: poaIam,
        cellFactor: clamp(tempDerate, 0.5, 1.05),
      });

      dayGhi += ghi;
    }

    // scale factor to hit target monthly GHI if imported meteo provided
    const rawDaily = dayGhi / 1000; // kWh/m2/day (representative)
    let scale = 1;
    if (isValidNumber(monthlyGhiTarget[m]) && rawDaily > 0) {
      scale = monthlyGhiTarget[m] / rawDaily;
    }

    const days = DAYS_IN_MONTH[m];

    for (const dh of dayHours) {
      const ghiKwh = (dh.ghi / 1000) * scale; // kWh/m2 for this hour
      const poaKwh = (dh.poa / 1000) * scale;
      const poaIamKwh = (dh.poaAfterIam / 1000) * scale;
      const poaBeamKwh = (dh.poaBeam / 1000) * scale;

      annualGhi += ghiKwh * days;
      annualPoa += poaKwh * days;
      annualBeamPoa += poaBeamKwh * days;
      poaAfterIam += poaIamKwh * days;

      sumCellTempWeighted += 0; // filled below via tCell proxy
      sumPoaForTemp += poaIamKwh * days;

      // DC energy: POA-after-IAM (kWh/m2) * (dc capacity kWp) / 1 (kWh/m2 @ STC = 1000 W/m2)
      // Specific-yield basis: 1 kWh/m2 of POA at STC ~ 1 kWh/kWp before losses.
      const dcNominalMwh = (poaIamKwh * inp.dcCapacityMwp * 1000) / 1000; // MWh (kWp * kWh/kWp / 1000)
      const dcThermalMwh = dcNominalMwh * dh.cellFactor;

      eDcNominal += dcNominalMwh * days;
      eAfterTempOnly += dcThermalMwh * days;

      // temp-weighted cell temp for reporting
      const tCellApprox = 25 + (1 - dh.cellFactor) / (Math.abs(inp.tempCoeffPowerPctPerC) / 100 || 0.0034);
      sumCellTempWeighted += tCellApprox * poaIamKwh * days;

      // Inverter clipping check (per-hour AC cap)
      const acPowerMw = (dcThermalMwh) * (1 - inp.dcOhmic) * inp.inverterEfficiency; // MWh in 1h = MW
      const acCap = inp.acCapacityMwac;
      if (acPowerMw > acCap) {
        clippingLoss += (acPowerMw - acCap) * days;
        peakClippingHours += days;
      }

      annualShadeLoss += 0;
      annualIamLoss += 0;
    }

    // monthly aggregation
    let mGhi = 0;
    let mPoa = 0;
    let mEnergy = 0;
    for (const dh of dayHours) {
      const poaIamKwh = (dh.poaAfterIam / 1000) * scale;
      mGhi += (dh.ghi / 1000) * scale * days;
      mPoa += (dh.poa / 1000) * scale * days;
      const dcNominalMwh = (poaIamKwh * inp.dcCapacityMwp * 1000) / 1000;
      const acMwh = Math.min(
        dcNominalMwh * dh.cellFactor * (1 - inp.dcOhmic) * inp.inverterEfficiency,
        inp.acCapacityMwac
      );
      mEnergy += acMwh * days;
    }
    monthlyAgg[m].ghi = mGhi;
    monthlyAgg[m].poa = mPoa;
    // apply remaining global factors to monthly energy below (after computing globals)
    monthlyAgg[m].energy = mEnergy;
  }

  // ---- Assemble the annual loss cascade ----
  const iamLossE = eDcNominal * (1 - poaAfterIam / Math.max(annualPoa, 1e-9));
  void iamLossE;

  // Reference "nominal DC" energy at POA (no losses) for PR baseline:
  const referenceEnergy = (annualPoa * inp.dcCapacityMwp * 1000) / 1000; // MWh if POA fully converted

  // Build cascade using multiplicative factors so it stays consistent.
  const factors: { key: string; label: string; kind: "gain" | "loss"; factor: number }[] = [];

  // GHI -> POA (transposition gain)
  const transFactor = annualPoa / Math.max(annualGhi, 1e-9);
  factors.push({ key: "transposition", label: "Transposition (GHI to POA)", kind: "gain", factor: transFactor });

  // POA -> after near-shading (beam-weighted)
  const shadeFactorGlobal = clamp(1 - (annualBeamPoa > 0 ? (annualBeamPoa - annualBeamPoa) : 0), 0, 1);
  void shadeFactorGlobal;
  // near-shading + IAM captured together via poaAfterIam / annualPoa
  const iamShadeFactor = clamp(poaAfterIam / Math.max(annualPoa, 1e-9), 0, 1);
  factors.push({ key: "shade_iam", label: "Near-shading + IAM", kind: "loss", factor: iamShadeFactor });

  // soiling
  factors.push({ key: "soiling", label: "Soiling", kind: "loss", factor: 1 - inp.soiling });
  // LID + module quality + mismatch
  factors.push({ key: "quality", label: "LID + Module quality", kind: "loss", factor: 1 - inp.lidQuality });
  factors.push({ key: "mismatch", label: "Mismatch", kind: "loss", factor: 1 - inp.mismatch });
  // temperature (from hourly physics)
  const tempFactor = clamp(eAfterTempOnly / Math.max(eDcNominal, 1e-9), 0, 1.05);
  factors.push({ key: "temperature", label: "Temperature", kind: "loss", factor: tempFactor });
  // DC ohmic
  factors.push({ key: "dc_ohmic", label: "DC ohmic wiring", kind: "loss", factor: 1 - inp.dcOhmic });
  // inverter efficiency
  factors.push({ key: "inverter", label: "Inverter conversion", kind: "loss", factor: inp.inverterEfficiency });
  // clipping
  const preClip = eAfterTempOnly * (1 - inp.dcOhmic) * inp.inverterEfficiency;
  const clipFactor = clamp(1 - clippingLoss / Math.max(preClip, 1e-9), 0, 1);
  factors.push({ key: "clipping", label: "Inverter clipping", kind: "loss", factor: clipFactor });
  // AC ohmic
  factors.push({ key: "ac_ohmic", label: "AC ohmic wiring", kind: "loss", factor: 1 - inp.acOhmic });
  // transformer
  factors.push({ key: "transformer", label: "Transformer", kind: "loss", factor: 1 - inp.transformer });
  // availability
  factors.push({ key: "availability", label: "Grid availability", kind: "loss", factor: inp.availability });

  const losses: LossStep[] = [];
  let running = annualGhi * inp.dcCapacityMwp * 1000 / 1000; // start from GHI-equivalent nominal
  // Represent the cascade in energy terms starting at the GHI nominal reference.
  let energy = referenceEnergy / transFactor; // back out to GHI baseline so transposition shows as gain
  losses.push({ key: "ghi", label: "GHI resource", energy, loss: 0, gain: 0, lossPct: 0 });
  for (const f of factors) {
    const prev = energy;
    energy = energy * f.factor;
    const delta = energy - prev;
    losses.push({
      key: f.key,
      label: f.label,
      energy,
      loss: delta < 0 ? -delta : 0,
      gain: delta > 0 ? delta : 0,
      lossPct: prev > 0 ? (delta / prev) * 100 : 0,
    });
  }
  void running;

  const annualEnergyMwh = energy;

  // apply the post-DC global factor chain to monthly energy for consistency
  const monthlyGlobalFactor =
    (1 - inp.soiling) *
    (1 - inp.lidQuality) *
    (1 - inp.mismatch) *
    (1 - inp.acOhmic) *
    (1 - inp.transformer) *
    inp.availability;
  const monthly = monthlyAgg.map((mm) => ({
    month: mm.month,
    ghi: round(mm.ghi, 1),
    poa: round(mm.poa, 1),
    energy: round(mm.energy * monthlyGlobalFactor, 0),
  }));

  const specificYield = (annualEnergyMwh * 1000) / Math.max(inp.dcCapacityMwp * 1000, 1e-9);
  const performanceRatio = annualEnergyMwh / Math.max((annualPoa * inp.dcCapacityMwp * 1000) / 1000, 1e-9);
  const capacityFactor = annualEnergyMwh / Math.max(inp.acCapacityMwac * 8760, 1e-9);
  const avgCellTemp = sumCellTempWeighted / Math.max(sumPoaForTemp, 1e-9);

  // representative-day hourly trace (June)
  {
    const m = 5;
    const doy = MONTH_MID_DOY[m];
    const decl = declination(doy);
    const eDay = extraterrestrial(doy);
    const ktMonth = clamp(inp.clearnessIndex * KT_SHAPE[m], 0.1, 0.85);
    for (let h = 0; h < 24; h++) {
      const hourAngle = (h + 0.5 - 12) * 15 * DEG;
      const cosZen =
        Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle);
      if (cosZen <= 0.02) {
        hourlySample.push({ hour: h, ghi: 0, poa: 0, ac: 0 });
        continue;
      }
      const zenith = Math.acos(clamp(cosZen, -1, 1));
      const altitude = Math.PI / 2 - zenith;
      let solAz = Math.atan2(
        Math.sin(hourAngle),
        Math.cos(hourAngle) * Math.sin(latRad) - Math.tan(decl) * Math.cos(latRad)
      );
      solAz = Math.PI + solAz;
      const ghi0 = eDay * cosZen;
      const ghi = ghi0 * ktMonth;
      const kt = clamp(ghi / Math.max(ghi0, 1), 0, 0.85);
      const dhi = ghi * erbsDiffuseFraction(kt);
      const bhi = ghi - dhi;
      const dni = bhi / Math.max(cosZen, 0.05);
      const beta = betaFixed;
      const gamma = surfAz;
      const cosAoi =
        Math.cos(altitude) * Math.sin(beta) * Math.cos(solAz - gamma) +
        Math.sin(altitude) * Math.cos(beta);
      const poaBeam = Math.max(dni * clamp(cosAoi, -1, 1), 0);
      const poaDiff = (dhi * (1 + Math.cos(beta))) / 2;
      const poaGround = (ghi * inp.albedo * (1 - Math.cos(beta))) / 2;
      const poa = poaBeam + poaDiff + poaGround;
      const tAmb = ambientTemp(latAbs, m, h);
      const tCell = tAmb + (poa / 800) * 29;
      const tempDerate = clamp(1 + (inp.tempCoeffPowerPctPerC / 100) * (tCell - 25), 0.5, 1.05);
      const dcMw = (poa / 1000) * inp.dcCapacityMwp * tempDerate * (1 - inp.dcOhmic);
      const ac = Math.min(dcMw * inp.inverterEfficiency, inp.acCapacityMwac);
      hourlySample.push({ hour: h, ghi: round(ghi, 0), poa: round(poa, 0), ac: round(ac, 1) });
    }
  }

  return {
    annualGhi: round(annualGhi, 0),
    annualPoa: round(annualPoa, 0),
    transpositionGain: round((transFactor - 1) * 100, 1),
    annualEnergyMwh: round(annualEnergyMwh, 0),
    specificYield: round(specificYield, 0),
    performanceRatio: round(performanceRatio * 100, 1),
    capacityFactor: round(capacityFactor * 100, 1),
    clippingLossPct: round((1 - clipFactor) * 100, 2),
    avgCellTemp: round(avgCellTemp, 1),
    peakClippingHours: Math.round(peakClippingHours),
    monthly,
    losses: losses.map((l) => ({
      ...l,
      energy: round(l.energy, 0),
      loss: round(l.loss, 0),
      gain: round(l.gain, 0),
      lossPct: round(l.lossPct, 1),
    })),
    hourlySample,
  };
}

function round(v: number, dp: number) {
  const f = Math.pow(10, dp);
  return Math.round(v * f) / f;
}

// Build default simulation inputs from a project (reuses existing config).
export function defaultSimInputs(project: Project): SimulationInputs {
  const lat = isValidNumber(project.info.latitude) ? (project.info.latitude as number) : 24;
  const lon = isValidNumber(project.info.longitude) ? (project.info.longitude as number) : 54;
  const tilt = isValidNumber(project.structure.tiltAngle)
    ? (project.structure.tiltAngle as number)
    : Math.round(Math.abs(lat) * 0.9);
  const gcr = isValidNumber(project.structure.groundCoverageRatio)
    ? (project.structure.groundCoverageRatio as number) > 1
      ? (project.structure.groundCoverageRatio as number) / 100
      : (project.structure.groundCoverageRatio as number)
    : 0.4;
  const tempCoeff = isValidNumber(project.pvModule.tempCoeffVoc)
    ? -Math.abs(project.pvModule.tempCoeffVoc as number) * 0.9 || -0.34
    : -0.34;
  const invEff = isValidNumber(project.inverter.efficiencyPct)
    ? (project.inverter.efficiencyPct as number) / 100
    : 0.98;
  const dc = isValidNumber(project.capacity.pvDcCapacityMwp) ? (project.capacity.pvDcCapacityMwp as number) : 100;
  const ac = isValidNumber(project.capacity.pvAcCapacityMwac) ? (project.capacity.pvAcCapacityMwac as number) : 80;
  const avail = isValidNumber(project.yield.availabilityPct) ? (project.yield.availabilityPct as number) / 100 : 0.99;

  return {
    latitude: lat,
    longitude: lon,
    tilt,
    azimuth: lat >= 0 ? 180 : 0,
    tracking: project.structure.trackerRequired,
    groundCoverageRatio: clamp(gcr, 0.1, 0.85),
    albedo: 0.2,
    clearnessIndex: 0.68,
    soiling: 0.02,
    iamRefractionIndex: 1.5,
    mismatch: 0.015,
    lidQuality: 0.02,
    dcOhmic: 0.015,
    acOhmic: 0.01,
    transformer: 0.01,
    availability: avail,
    dcCapacityMwp: dc,
    acCapacityMwac: ac,
    inverterEfficiency: invEff,
    tempCoeffPowerPctPerC: tempCoeff < -1 ? -0.34 : tempCoeff,
    monthlyGhiOverride: null,
  };
}
