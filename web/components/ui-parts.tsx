import { formatCurrency, formatNumber, formatPercent, formatRatio, NEEDS_INPUT } from "@/lib/format";

export function KpiCard({
  title,
  value,
  subtitle,
  variant = "blue"
}: {
  title: string;
  value: string;
  subtitle?: string;
  variant?: "blue" | "emerald" | "amber" | "slate";
}) {
  const colors = {
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    slate: "border-slate-200 bg-slate-50 text-slate-900"
  };

  return (
    <div className={`rounded-xl border p-4 ${colors[variant]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {subtitle && <p className="mt-1 text-xs opacity-60">{subtitle}</p>}
    </div>
  );
}

export function MetricRow({ label, value, unit }: { label: string; value: string; unit?: string }) {
  const isMissing = value === NEEDS_INPUT;
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-semibold ${isMissing ? "text-slate-400 italic" : "text-slate-900"}`}>
        {value}
        {unit && value !== NEEDS_INPUT ? ` ${unit}` : ""}
      </span>
    </div>
  );
}

export function CalcPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sticky top-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

export function ValidationBanner({ type, message }: { type: "error" | "warning" | "success" | "locked" | "ready"; message: string }) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    locked: "bg-red-50 border-red-300 text-red-900",
    ready: "bg-emerald-50 border-emerald-300 text-emerald-900"
  };
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${styles[type]}`}>
      {message}
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {title && <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>}
      {children}
    </div>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold text-slate-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-slate-400">
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export { formatCurrency, formatNumber, formatPercent, formatRatio, NEEDS_INPUT };
