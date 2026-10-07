import React from "react";
import { CellLayout, CellState, CellType, PageGridConfig, StateSetter } from "../../../types";
import { CellCommandId, CellKeybindings } from "../../../commands";

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

export type CellActionById = (id: string) => void;
export type CellActionByIndex = (index: number) => void;

export interface CellProps {
  cell: CellState;
  index: number;
  isActive: boolean;
  totalCells: number;
  copiedCellId: string | null;
  copiedCellCodeId: string | null;
  onRun: CellActionById;
  onDelete: CellActionById;
  onMoveUp: CellActionByIndex;
  onMoveDown: CellActionByIndex;
  onToggleCodeCollapse: CellActionById;
  onToggleOutputCollapse: CellActionById;
  onChangeCellType?: (id: string, type: CellType) => void;
  onUpdateCode: (id: string, code: string) => void;
  onAddCell: (index: number, type: CellType) => void;
  onSplitCell?: (index: number, beforeCode: string, afterCode: string) => void;
  onCopyCell: CellActionById;
  onCopyCellCode: CellActionById;
  onSelectCell?: CellActionById;
  onAdvanceCell?: CellActionByIndex;
  onClearOutput?: CellActionById;
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
  keybindings?: CellKeybindings;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  slots?: CellSlots;
  slotProps?: CellSlotProps;
}

export type CellLayoutTab = "position" | "size";

export interface UseCellGridDragOptions {
  cellId: string;
  layout?: CellLayout;
  isGridCanvasMode?: boolean;
  gridConfig?: PageGridConfig;
  cellElementRef: React.RefObject<HTMLElement | null>;
  onUpdateLayout?: (id: string, layout: Partial<CellLayout>) => void;
  onInteractionChange?: (isInteracting: boolean) => void;
}

export interface UseCellGridDragReturn {
  isMoving: boolean;
  isResizing: boolean;
  liveLayout: CellLayout | null;
  handleMovePointerDown: (e: React.PointerEvent) => void;
  handleResizePointerDown: (e: React.PointerEvent) => void;
}

export interface CellProviderProps {
  value: CellContextValue;
  children: React.ReactNode;
}

export interface CellContextValue
  extends Pick<
      CellProps,
      | "cell"
      | "index"
      | "totalCells"
      | "isActive"
      | "isGridCanvasMode"
      | "gridConfig"
      | "onRun"
      | "onDelete"
      | "onMoveUp"
      | "onMoveDown"
      | "onToggleCodeCollapse"
      | "onChangeCellType"
      | "onClearOutput"
      | "onUndo"
      | "onRedo"
      | "onUpdateLayout"
    >,
    Pick<UseCellGridDragReturn, "isMoving" | "isResizing" | "handleMovePointerDown"> {
  currentLayout?: CellLayout;
  editorInstanceRef: React.MutableRefObject<any>;
  cellRef: React.RefObject<HTMLDivElement>;
  activePanelTab: CellLayoutTab | null;
  setActivePanelTab: StateSetter<CellLayoutTab | null>;
  positionTabRef: React.RefObject<HTMLButtonElement>;
  dimensionsTabRef: React.RefObject<HTMLButtonElement>;
  keybindings: Record<CellCommandId, string>;
}
