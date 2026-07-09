import type { ScadaInput } from "@/app/actions/scada";

export type CsvParseResult = {
  rows: ScadaInput[];
  errors: string[];
  matchedColumns: Record<string, string | null>;
};

// Header aliases → canonical field. Matching is case/space/underscore-insensitive.
const FIELD_ALIASES: Record<keyof Omit<ScadaInput, "timestamp">, string[]> = {
  acPowerKw: ["acpowerkw", "acpower", "ackw", "activepowerkw", "power", "pac"],
  dcPowerKw: ["dcpowerkw", "dcpower", "dckw", "pdc"],
  poaIrradiance: ["poairradiance", "poa", "irradiance", "ghi", "poawm2", "irradiancewm2"],
  moduleTempC: ["moduletempc", "moduletemp", "celltemp", "moduletemperature", "tmod"],
  ambientTempC: ["ambienttempc", "ambienttemp", "airtemp", "tamb", "ambient"],
};

const TIMESTAMP_ALIASES = ["timestamp", "time", "datetime", "date", "ts", "utc", "localtime"];

function normalize(header: string): string {
  return header.toLowerCase().replace(/[\s_\-()]/g, "");
}

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

function toNumber(raw: string): number | null {
  if (raw === "" || raw == null) return null;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function parseScadaCsv(text: string): CsvParseResult {
  const errors: string[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      errors: ["File is empty or has no data rows."],
      matchedColumns: {},
    };
  }

  const rawHeaders = splitLine(lines[0]);
  const normHeaders = rawHeaders.map(normalize);

  const tsIndex = normHeaders.findIndex((h) => TIMESTAMP_ALIASES.includes(h));
  if (tsIndex === -1) {
    errors.push(
      "No timestamp column found. Include a column named 'timestamp', 'time', or 'datetime'."
    );
    return { rows: [], errors, matchedColumns: {} };
  }

  const fieldIndex: Partial<Record<keyof ScadaInput, number>> = {};
  const matchedColumns: Record<string, string | null> = {
    timestamp: rawHeaders[tsIndex],
  };
  (Object.keys(FIELD_ALIASES) as (keyof typeof FIELD_ALIASES)[]).forEach((field) => {
    const idx = normHeaders.findIndex((h) => FIELD_ALIASES[field].includes(h));
    fieldIndex[field] = idx === -1 ? undefined : idx;
    matchedColumns[field] = idx === -1 ? null : rawHeaders[idx];
  });

  const rows: ScadaInput[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const tsRaw = cells[tsIndex];
    const date = new Date(tsRaw);
    if (!tsRaw || Number.isNaN(date.getTime())) {
      errors.push(`Row ${i + 1}: invalid timestamp "${tsRaw}" (skipped).`);
      continue;
    }
    rows.push({
      timestamp: date.toISOString(),
      acPowerKw: fieldIndex.acPowerKw != null ? toNumber(cells[fieldIndex.acPowerKw]) : null,
      dcPowerKw: fieldIndex.dcPowerKw != null ? toNumber(cells[fieldIndex.dcPowerKw]) : null,
      poaIrradiance:
        fieldIndex.poaIrradiance != null ? toNumber(cells[fieldIndex.poaIrradiance]) : null,
      moduleTempC:
        fieldIndex.moduleTempC != null ? toNumber(cells[fieldIndex.moduleTempC]) : null,
      ambientTempC:
        fieldIndex.ambientTempC != null ? toNumber(cells[fieldIndex.ambientTempC]) : null,
    });
  }

  return { rows, errors, matchedColumns };
}

// Small sample CSV so users can see the expected format / try the feature.
export const SAMPLE_SCADA_CSV = `timestamp,ac_power_kw,dc_power_kw,poa_irradiance,module_temp_c,ambient_temp_c
2024-06-01 06:00,0,0,45,28.1,26.4
2024-06-01 08:00,4200,4380,410,41.2,31.0
2024-06-01 10:00,9800,10250,820,55.8,35.2
2024-06-01 12:00,11200,11900,1010,63.4,38.7
2024-06-01 14:00,10600,11150,915,61.1,39.1
2024-06-01 16:00,6400,6650,520,49.7,36.8
2024-06-01 18:00,900,940,90,33.2,32.0`;
