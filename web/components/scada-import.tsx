"use client";

import { useRef, useState } from "react";
import { parseScadaCsv, SAMPLE_SCADA_CSV, type CsvParseResult } from "@/lib/scada-csv";
import { importScadaLogs } from "@/app/actions/scada";
import { useToast } from "@/components/toast-provider";
import { Upload, FileWarning, CheckCircle2, Download } from "lucide-react";

export function ScadaImport({
  projectId,
  onImported,
}: {
  projectId: string;
  onImported: () => void;
}) {
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<CsvParseResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file: File) => {
    const text = await file.text();
    setFileName(file.name);
    setParsed(parseScadaCsv(text));
  };

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0 || importing) return;
    setImporting(true);
    try {
      const { inserted } = await importScadaLogs(projectId, parsed.rows);
      showToast(`Imported ${inserted.toLocaleString()} SCADA records`, "success");
      setParsed(null);
      setFileName(null);
      if (inputRef.current) inputRef.current.value = "";
      onImported();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Import failed", "warning");
    } finally {
      setImporting(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_SCADA_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scada-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const matched = parsed
    ? Object.entries(parsed.matchedColumns).filter(([, v]) => v !== null)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          <Upload className="h-4 w-4" />
          Choose CSV File
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </label>
        <button
          onClick={downloadSample}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <Download className="h-4 w-4" /> Sample CSV
        </button>
      </div>

      {fileName && (
        <p className="text-xs text-slate-500">
          Loaded <span className="font-medium text-slate-700">{fileName}</span>
        </p>
      )}

      {parsed && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap gap-2">
            {matched.map(([field, col]) => (
              <span
                key={field}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700"
              >
                <CheckCircle2 className="h-3 w-3" />
                {field} ← {col}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">
              <span className="font-semibold text-slate-900">
                {parsed.rows.length.toLocaleString()}
              </span>{" "}
              valid rows ready to import
            </span>
            <button
              onClick={handleImport}
              disabled={parsed.rows.length === 0 || importing}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {importing ? "Importing..." : "Import Data"}
            </button>
          </div>

          {parsed.errors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                <FileWarning className="h-3.5 w-3.5" />
                {parsed.errors.length} issue{parsed.errors.length > 1 ? "s" : ""} (rows skipped)
              </p>
              <ul className="max-h-24 space-y-0.5 overflow-y-auto text-xs text-amber-700">
                {parsed.errors.slice(0, 8).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {parsed.errors.length > 8 && (
                  <li>...and {parsed.errors.length - 8} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
