import { DataFrame } from "df-script";
import { CellState } from "../../../../../../../types";
import { VariableDisplayItem } from "./types";

export function getTypeLabel(value: any): string {
  if (value instanceof DataFrame) {
    return `DataFrame · ${value.height} × ${value.width}`;
  }
  if (Array.isArray(value)) {
    return `Array (${value.length})`;
  }
  if (typeof HTMLElement !== "undefined" && (value instanceof HTMLElement || value instanceof SVGElement)) {
    return "DOM Node";
  }
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "object") {
    const keys = Object.keys(value);
    return `Object (${keys.length})`;
  }
  return typeof value;
}

export function getVariableDisplayItems(cell: CellState): VariableDisplayItem[] {
  const items: VariableDisplayItem[] = [];
  const seenValues = new Set<any>();

  // 1. If console logs exist, make them Slide #0
  if (cell.logs && cell.logs.length > 0) {
    items.push({
      id: "console",
      name: "console",
      value: cell.logs,
      typeLabel: `${cell.logs.length} ${cell.logs.length === 1 ? "log" : "logs"}`,
      isConsole: true,
    });
  }

  // 2. Collect all declared / assigned variables from cell.variables
  if (cell.variables && typeof cell.variables === "object") {
    for (const [name, value] of Object.entries(cell.variables)) {
      if (name === "$df" || name.startsWith("_")) continue;
      items.push({
        id: `var-${name}`,
        name,
        value,
        typeLabel: getTypeLabel(value),
        isConsole: false,
      });
      if (value !== null && (typeof value === "object" || typeof value === "function")) {
        seenValues.add(value);
      }
    }
  }

  // 3. If cell.output is present and not already displayed as one of the variables, include it
  if (cell.output !== null && cell.output !== undefined) {
    const alreadyIncluded =
      seenValues.has(cell.output) ||
      items.some((item) => !item.isConsole && item.value === cell.output);

    if (!alreadyIncluded) {
      items.push({
        id: "output",
        name: items.length === 0 || (items.length === 1 && items[0].isConsole) ? "output" : "result",
        value: cell.output,
        typeLabel: getTypeLabel(cell.output),
        isConsole: false,
      });
    }
  }

  // 4. Fallback for DOM node output
  if (items.length === 0 && cell.outputNode) {
    items.push({
      id: "dom-output",
      name: "DOM Output",
      value: cell.outputNode,
      typeLabel: "DOM Node",
      isConsole: false,
    });
  }

  return items;
}
