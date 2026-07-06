export const NEEDS_INPUT = "Needs Input";

export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function safeDivide(numerator: number | null, denominator: number | null): number | null {
  if (!isValidNumber(numerator) || !isValidNumber(denominator) || denominator === 0) return null;
  const result = numerator / denominator;
  return Number.isFinite(result) ? result : null;
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (!isValidNumber(value)) return NEEDS_INPUT;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function formatInteger(value: number | null | undefined): string {
  if (!isValidNumber(value)) return NEEDS_INPUT;
  return Math.round(value).toLocaleString("en-US");
}

export function formatCurrency(value: number | null | undefined, currency = "USD"): string {
  if (!isValidNumber(value)) return NEEDS_INPUT;
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (!isValidNumber(value)) return NEEDS_INPUT;
  return `${value.toFixed(decimals)}%`;
}

export function formatRatio(value: number | null | undefined, decimals = 2): string {
  if (!isValidNumber(value)) return NEEDS_INPUT;
  return value.toFixed(decimals);
}

export function ceilPositive(value: number | null): number | null {
  if (!isValidNumber(value) || value <= 0) return null;
  return Math.ceil(value);
}

export function floorPositive(value: number | null): number | null {
  if (!isValidNumber(value) || value <= 0) return null;
  return Math.floor(value);
}
