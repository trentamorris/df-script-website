import React from "react";
import { DragIndicator } from "@mui/icons-material";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellDragHandle() {
  const { isGridCanvasMode, handleMovePointerDown } = useCellContext();

  if (!isGridCanvasMode) return null;

  return (
    <span
      onPointerDown={handleMovePointerDown}
      className="cursor-grab active:cursor-grabbing text-[var(--nb-text-muted)] hover:text-[var(--nb-text-secondary)] transition-colors flex items-center touch-none select-none"
      title="Drag to move cell on grid"
    >
      <DragIndicator sx={{ fontSize: 16 }} />
    </span>
  );
}
