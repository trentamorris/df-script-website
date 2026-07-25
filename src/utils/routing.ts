import type { OperationItem } from "../types";

export function getQualifiedPath(op: Pick<OperationItem, "name" | "category">): string {
  const cleanSymbol = op.name.replace(/^\./, "").replace(/\(\)$/, "");
  
  if (op.category === "DataFrame") {
    return `$df.${cleanSymbol}`;
  }
  if (op.category === "ColumnExpression") {
    if (op.name.match(/^\w/)) { // Top-level functions like lit(), all(), when()
      return `$df.${cleanSymbol}`;
    }
    return `$df.col.${cleanSymbol}`;
  }
  
  // Default fallback (e.g. DataTypes/Exceptions)
  return `$df.${cleanSymbol}`;
}
