/**
 * Returns Tailwind CSS badge classes corresponding to a column's inferred data type.
 */
export function getTypeBadgeClass(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("int") || n.includes("float") || n.includes("num")) {
    return "text-emerald-400 border-emerald-950/30 bg-emerald-950/10";
  }
  if (n.includes("str") || n.includes("char") || n.includes("text")) {
    return "text-sky-400 border-sky-950/30 bg-sky-950/10";
  }
  if (n.includes("bool")) {
    return "text-amber-400 border-amber-950/30 bg-amber-950/10";
  }
  if (n.includes("date") || n.includes("time")) {
    return "text-purple-400 border-purple-950/30 bg-purple-950/10";
  }
  return "text-[var(--nb-text-secondary)] border-white/10 bg-[var(--nb-bg-hover)]";
}

/**
 * Formats a cell value safely for tabular display.
 */
export function formatCellValue(val: unknown): string {
  if (val === null) return "null";
  if (val === undefined) return "undefined";
  if (typeof val === "object") {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
}
