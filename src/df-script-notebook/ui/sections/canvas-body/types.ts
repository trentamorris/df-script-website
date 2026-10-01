import React from "react";
import { CellLayout, CellState, CellType, PageGridConfig } from "../../../types";

export interface CanvasBodyProps {
  activeCells: CellState[];
  isCanvas: boolean;
  gridConfig: PageGridConfig;
  activeCellId: string | null;
  copiedCellId: string | null;
  copiedCellCodeId: string | null;
  onRunCell: (id: string) => void;
  onDeleteCell: (id: string) => void;
  onMoveCellUp: (index: number) => void;
  onMoveCellDown: (index: number) => void;
  onToggleCodeCollapse: (id: string) => void;
  onToggleOutputCollapse: (id: string) => void;
  onUpdateCellCode: (id: string, code: string) => void;
  onAddCellAtIndex: (index: number, type: CellType) => void;
  onCopyCell: (id: string) => void;
  onCopyCellCode: (id: string) => void;
  onSelectCell?: (id: string) => void;
  onUpdateCellLayout: (id: string, layout: Partial<CellLayout>) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}
