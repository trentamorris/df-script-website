import React from "react";
import { CellLayout, CellState, PageGridConfig } from "../../../types";

export interface CellProps {
  cell: CellState;
  index: number;
  isActive: boolean;
  totalCells: number;
  copiedCellId: string | null;
  copiedCellCodeId: string | null;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleCodeCollapse: (id: string) => void;
  onToggleOutputCollapse: (id: string) => void;
  onUpdateCode: (id: string, code: string) => void;
  onAddCell: (index: number, type: "code" | "jsx" | "markdown") => void;
  onCopyCell: (id: string) => void;
  onCopyCellCode: (id: string) => void;
  onUpdateLayout?: (id: string, layout: Partial<CellLayout>) => void;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  isGridCanvasMode?: boolean;
  gridConfig?: PageGridConfig;
  onInteractionChange?: (isInteracting: boolean) => void;
}
