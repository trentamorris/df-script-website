import React from "react";
import { CellLayout, CellState, CellType, PageGridConfig } from "../../../types";

export interface CellSlots {
  toolbar?: React.ComponentType<any> | React.ReactNode;
  editor?: React.ComponentType<any> | React.ReactNode;
  output?: React.ComponentType<any> | React.ReactNode;
  footer?: React.ComponentType<any> | React.ReactNode;
}

export interface CellSlotProps {
  toolbar?: Record<string, any>;
  editor?: Record<string, any>;
  output?: Record<string, any>;
  footer?: Record<string, any>;
}

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
  onAddCell: (index: number, type: CellType) => void;
  onSplitCell?: (index: number, beforeCode: string, afterCode: string) => void;
  onCopyCell: (id: string) => void;
  onCopyCellCode: (id: string) => void;
  onSelectCell?: (id: string) => void;
  onAdvanceCell?: (index: number) => void;
  onClearOutput?: (id: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUpdateLayout?: (id: string, layout: Partial<CellLayout>) => void;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  isGridCanvasMode?: boolean;
  gridConfig?: PageGridConfig;
  onInteractionChange?: (isInteracting: boolean) => void;
  onOpenCommands?: () => void;
  // Slots & Direct overrides
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  slots?: CellSlots;
  slotProps?: CellSlotProps;
}

export interface CellContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  cell: CellState;
  isSelected?: boolean;
  isMoving?: boolean;
  isGridCanvasMode?: boolean;
  toolbar?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  resizeHandle?: React.ReactNode;
  insertZone?: React.ReactNode;
  onSelect?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  gridStyle?: React.CSSProperties;
}

export interface CellContextValue {
  cell: CellState;
  index: number;
  totalCells: number;
  isActive: boolean;
  isMoving: boolean;
  isResizing: boolean;
  isGridCanvasMode?: boolean;
  gridConfig?: PageGridConfig;
  currentLayout?: CellLayout;
  editorInstanceRef: React.MutableRefObject<any>;
  cellRef: React.RefObject<HTMLDivElement>;
  activePanelTab: "position" | "size" | null;
  setActivePanelTab: React.Dispatch<React.SetStateAction<"position" | "size" | null>>;
  positionTabRef: React.RefObject<HTMLButtonElement>;
  dimensionsTabRef: React.RefObject<HTMLButtonElement>;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleCodeCollapse: (id: string) => void;
  onClearOutput?: (id: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onUpdateLayout?: (id: string, layout: Partial<CellLayout>) => void;
  handleMovePointerDown: (e: React.PointerEvent) => void;
}
