import React from "react";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellIndexBadge() {
  const { index } = useCellContext();

  return (
    <span className="text-[11px] font-mono font-medium text-[var(--nb-text-muted)] select-none">
      [{index + 1}]
    </span>
  );
}

export { CellIndexBadge as CellIndexBadgeChip };
