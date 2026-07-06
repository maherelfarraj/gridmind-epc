export function formFieldValue(value: string | number | boolean | null | undefined): string | number {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "";
  return value;
}
