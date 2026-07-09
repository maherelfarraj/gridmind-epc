import type { Project } from "./types";
import type { runProjectCalculations } from "./calculations";
import { formatCurrency, formatInteger, formatNumber, formatPercent, formatRatio } from "./format";

type Calcs = ReturnType<typeof runProjectCalculations>;

/* ---------- Generic file helpers ---------- */

export function triggerDownload(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeCsv(value: string | number): string {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
  triggerDownload(filename, "\uFEFF" + csv, "text/csv;charset=utf-8;");
}

export function slugify(value: string): string {
  return (value || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "project";
}

/* ---------- Printable PDF report (browser print engine) ---------- */

type Section = { heading: string; rows: [string, string][] } | { heading: string; table: { headers: string[]; rows: (string | number)[][] } };

function isTableSection(s: Section): s is { heading: string; table: { headers: string[]; rows: (string | number)[][] } } {
  return "table" in s;
}

function renderSection(section: Section): string {
  if (isTableSection(section)) {
    const head = section.table.headers.map((h) => `<th>${h}</th>`).join("");
    const body = section.table.rows
      .map((r) => `<tr>${r.map((c, i) => `<td class="${i >= 2 ? "num" : ""}">${c}</td>`).join("")}</tr>`)
      .join("");
    return `<section><h2>${section.heading}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></section>`;
  }
  const rows = section.rows.map(([k, v]) => `<tr><td class="key">${k}</td><td class="val">${v}</td></tr>`).join("");
  return `<section><h2>${section.heading}</h2><table class="kv"><tbody>${rows}</tbody></table></section>`;
}

export function openPrintableReport(opts: { title: string; subtitle: string; sections: Section[] }) {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return false;
  const generated = new Date().toLocaleString("en-US");
  const html = `<!doctype html><html><head><meta charset="utf-8" /><title>${opts.title}</title>
<style>
  :root { --brand:#2563eb; --emerald:#059669; --slate:#0f172a; --muted:#64748b; --border:#e2e8f0; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: var(--slate); margin: 0; padding: 40px; }
  header { border-bottom: 3px solid var(--brand); padding-bottom: 16px; margin-bottom: 24px; }
  .badge { display:inline-block; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#fff; background:var(--emerald); padding:3px 8px; border-radius:4px; }
  h1 { font-size: 22px; margin: 10px 0 2px; }
  .subtitle { color: var(--muted); font-size: 13px; margin: 0; }
  .meta { color: var(--muted); font-size: 11px; margin-top: 6px; }
  h2 { font-size: 14px; color: var(--brand); margin: 22px 0 8px; border-bottom:1px solid var(--border); padding-bottom:4px; }
  table { width:100%; border-collapse: collapse; font-size: 12px; }
  th, td { text-align:left; padding: 6px 8px; border-bottom: 1px solid var(--border); }
  th { background:#f8fafc; font-weight:700; color:#334155; }
  td.num { text-align:right; font-variant-numeric: tabular-nums; }
  table.kv td.key { color: var(--muted); width: 45%; }
  table.kv td.val { font-weight:600; }
  footer { margin-top: 32px; border-top:1px solid var(--border); padding-top:10px; color:var(--muted); font-size:10px; text-align:center; }
  @media print { body { padding: 20px; } .noprint { display:none; } }
  .noprint { position: fixed; top: 16px; right: 16px; }
  .noprint button { background: var(--brand); color:#fff; border:0; padding:10px 16px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
</style></head>
<body>
  <div class="noprint"><button onclick="window.print()">Download / Print PDF</button></div>
  <header>
    <span class="badge">GridMind EPC</span>
    <h1>${opts.title}</h1>
    <p class="subtitle">${opts.subtitle}</p>
    <p class="meta">Generated ${generated} · PV_Mind Cockpit</p>
  </header>
  ${opts.sections.map(renderSection).join("")}
  <footer>GridMind EPC™ — PV_Mind Cockpit. This document is auto-generated from project configuration data.</footer>
  <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 400); };</script>
</body></html>`;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}

/* ---------- Report content builders ---------- */

function infoSection(project: Project): Section {
  const i = project.info;
  return {
    heading: "Project Information",
    rows: [
      ["Project Name", i.projectName || "—"],
      ["Client", i.clientName || "—"],
      ["Type", i.projectType],
      ["Stage", i.projectStage],
      ["Location", [i.city, i.country].filter(Boolean).join(", ") || "—"],
      ["Currency", i.currency]
    ]
  };
}

function pvSection(project: Project, calcs: Calcs): Section {
  return {
    heading: "PV Configuration",
    rows: [
      ["DC Capacity", `${formatNumber(project.capacity.pvDcCapacityMwp)} MWp`],
      ["AC Capacity", `${formatNumber(project.capacity.pvAcCapacityMwac)} MWac`],
      ["DC/AC Ratio", formatRatio(calcs.pv.dcAcRatio)],
      ["Module", `${project.pvModule.moduleManufacturer} ${project.pvModule.moduleModel}`.trim() || "—"],
      ["Number of Modules", formatInteger(calcs.pv.numberOfModules)],
      ["Modules per String", formatInteger(calcs.pv.modulesPerString)],
      ["Number of Strings", formatInteger(calcs.pv.numberOfStrings)],
      ["Inverter", `${project.inverter.inverterManufacturer} ${project.inverter.inverterModel}`.trim() || "—"],
      ["Inverter Quantity", formatInteger(calcs.pv.finalInverterQuantity)],
      ["Transformer Quantity", formatInteger(calcs.pv.transformerQuantity)]
    ]
  };
}

function bessSection(project: Project, calcs: Calcs): Section {
  return {
    heading: "BESS Configuration",
    rows: [
      ["Power Rating", `${formatNumber(project.bess.bessPowerMw)} MW`],
      ["Energy Capacity", `${formatNumber(project.bess.bessEnergyMwh)} MWh`],
      ["Duration", `${formatNumber(calcs.bess.bessDuration)} hrs`],
      ["Chemistry", project.bess.batteryChemistry || "—"],
      ["Containers", formatInteger(calcs.bess.containerQuantity)],
      ["PCS Units", formatInteger(calcs.bess.pcsQuantity)],
      ["Usable Energy", `${formatNumber(calcs.bess.usableEnergy)} MWh`],
      ["Annual Discharge", `${formatNumber(calcs.bess.annualBessDischargeEnergy)} MWh/yr`]
    ]
  };
}

function yieldSection(project: Project, calcs: Calcs): Section {
  return {
    heading: "Yield Estimate",
    rows: [
      ["Gross PV Energy", `${formatNumber(calcs.yield.grossPvEnergyMwh)} MWh/yr`],
      ["Net PV Energy", `${formatNumber(calcs.yield.netPvEnergyMwh)} MWh/yr`],
      ["Energy Sold to Grid", `${formatNumber(calcs.yield.energySoldToGrid)} MWh/yr`],
      ["Performance Ratio", formatPercent(calcs.yield.performanceRatio)],
      ["Capacity Factor", formatPercent(calcs.yield.capacityFactor)],
      ["Lifetime Energy", `${formatNumber(calcs.yield.lifetimeEnergy)} MWh`]
    ]
  };
}

function capexSection(project: Project, calcs: Calcs): Section {
  const cur = project.info.currency;
  return {
    heading: "CAPEX Estimate",
    rows: [
      ["PV Module CAPEX", formatCurrency(calcs.capex.pvModuleCapex, cur)],
      ["Inverter CAPEX", formatCurrency(calcs.capex.inverterCapex, cur)],
      ["Structure CAPEX", formatCurrency(calcs.capex.structureCapex, cur)],
      ["BESS CAPEX", formatCurrency(calcs.capex.bessCapex, cur)],
      ["Civil CAPEX", formatCurrency(calcs.capex.civilCapex, cur)],
      ["Electrical CAPEX", formatCurrency(calcs.capex.electricalCapex, cur)],
      ["Subtotal", formatCurrency(calcs.capex.subtotalCapex, cur)],
      ["Contingency", formatCurrency(calcs.capex.contingency, cur)],
      ["Total CAPEX", formatCurrency(calcs.capex.totalCapex, cur)],
      ["CAPEX per MWp", formatCurrency(calcs.capex.capexPerMwp, cur)]
    ]
  };
}

function bomSection(project: Project, calcs: Calcs): Section {
  const cur = project.info.currency;
  return {
    heading: "Bill of Materials",
    table: {
      headers: ["Category", "Description", "Unit", "Qty", "Unit Cost", "Total Cost"],
      rows: calcs.bom.map((item) => [
        item.category,
        item.description,
        item.unit,
        formatInteger(item.quantity),
        formatCurrency(item.unitCost, cur),
        formatCurrency(item.totalCost, cur)
      ])
    }
  };
}

function stringingSection(project: Project, calcs: Calcs): Section {
  return {
    heading: "Stringing Validation",
    rows: [
      ["Corrected Cold Voc", formatNumber(calcs.pv.correctedColdVoc)],
      ["Modules per String", formatInteger(calcs.pv.modulesPerString)],
      ["Strings per MPPT", formatInteger(calcs.pv.stringsPerMppt)],
      ["Strings per Inverter", formatInteger(calcs.pv.stringsPerInverter)],
      ["Number of Strings", formatInteger(calcs.pv.numberOfStrings)],
      ["Max System Voltage", `${formatNumber(project.pvModule.maxSystemVoltage)} V`]
    ]
  };
}

function sldSection(project: Project, calcs: Calcs): Section {
  const rows: [string, string][] = [
    ["PV Array", `${formatNumber(project.capacity.pvDcCapacityMwp)} MWp`],
    ["Inverters", `${formatInteger(calcs.pv.finalInverterQuantity)} units`],
    ["AC Busbar", `${formatNumber(project.capacity.pvAcCapacityMwac)} MWac`],
    ["Transformer", "33/132 kV"],
    ["Export Limit", `${formatNumber(project.capacity.exportLimitMw)} MW`]
  ];
  if (project.bess.enabled) {
    rows.push(["BESS", `${formatNumber(project.bess.bessPowerMw)} MW / ${formatNumber(project.bess.bessEnergyMwh)} MWh`]);
    rows.push(["PCS Units", `${formatInteger(calcs.bess.pcsQuantity)} units`]);
  }
  return { heading: "Single-Line Diagram Summary", rows };
}

const REPORT_SECTION_MAP: Record<string, (p: Project, c: Calcs) => Section[]> = {
  "Project Summary Report": (p, c) => [
    infoSection(p),
    pvSection(p, c),
    ...(p.bess.enabled ? [bessSection(p, c)] : []),
    yieldSection(p, c),
    capexSection(p, c)
  ],
  "PV Configuration Report": (p, c) => [infoSection(p), pvSection(p, c)],
  "Stringing Validation Report": (p, c) => [infoSection(p), stringingSection(p, c)],
  "BESS Configuration Report": (p, c) => [infoSection(p), bessSection(p, c)],
  "Yield Estimate Report": (p, c) => [infoSection(p), yieldSection(p, c)],
  "CAPEX Estimate Report": (p, c) => [infoSection(p), capexSection(p, c)],
  "BOM / BOQ Report": (p, c) => [infoSection(p), bomSection(p, c)],
  "SLD Preview Report": (p, c) => [infoSection(p), sldSection(p, c)]
};

export function downloadReport(type: string, project: Project, calcs: Calcs) {
  const builder = REPORT_SECTION_MAP[type];
  const sections = builder ? builder(project, calcs) : [infoSection(project)];
  return openPrintableReport({
    title: type,
    subtitle: `${project.info.projectName || "Untitled Project"} · ${project.info.projectType} · ${project.info.projectStage}`,
    sections
  });
}

/* ---------- Convenience CSV exports ---------- */

export function downloadBomCsv(project: Project, calcs: Calcs) {
  const cur = project.info.currency;
  const rows: (string | number)[][] = [
    ["Category", "Description", "Unit", "Quantity", `Unit Cost (${cur})`, `Total Cost (${cur})`, "Notes"]
  ];
  for (const item of calcs.bom) {
    rows.push([
      item.category,
      item.description,
      item.unit,
      item.quantity ?? "",
      item.unitCost ?? "",
      item.totalCost ?? "",
      item.notes || ""
    ]);
  }
  const total = calcs.bom.reduce((s, i) => s + (i.totalCost ?? 0), 0);
  rows.push(["", "", "", "", "", total, "TOTAL"]);
  downloadCsv(`${slugify(project.info.projectName)}-bom.csv`, rows);
}

export function downloadSldReport(project: Project, calcs: Calcs) {
  return downloadReport("SLD Preview Report", project, calcs);
}
