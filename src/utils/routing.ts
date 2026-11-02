import type { OperationItem } from "../types";

export function getQualifiedPath(op: Pick<OperationItem, "category"> & { callExpression?: string; name?: string }): string {
  const expr = op.callExpression || op.name || "";
  const cleanSymbol = expr.replace(/^\./, "").replace(/\(\)$/, "");
  
  if (op.category === "DataFrame" || op.category === "Function") {
    return `$df.${cleanSymbol}`;
  }
  if (op.category === "ColumnExpression") {
    if (expr.match(/^\w/)) { // Top-level functions like lit(), all(), when()
      return `$df.${cleanSymbol}`;
    }
    return `$df.col.${cleanSymbol}`;
  }
  
  // Default fallback (e.g. DataTypes/Exceptions)
  return `$df.${cleanSymbol}`;
}
