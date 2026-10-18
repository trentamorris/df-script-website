import React from "react";

export type CellWidth = "full" | "half";
export type CellType = "code" | "markdown";
export type LayoutMode = "document" | "canvas";

export interface CellLayout {
  x: number; // 0-indexed column
  y: number; // 0-indexed row
  w: number; // column span (e.g. 1 to cols)
  h: number; // row span (e.g. 1 to rows)
  z?: number; // z-index layer
}

export interface CellState {
  id: string;
  type: CellType;
  code: string;
  output: any;
  error: string | null;
  timeTaken: string | null;
  lastRunTime?: string | null;
  execIndex: number | null;
  width?: CellWidth;
  layout?: CellLayout;
  logs?: string[];
  metadata?: Record<string, any>;
  outputNode?: any;
  isCodeCollapsed?: boolean;
  isOutputCollapsed?: boolean;
  splitOrientation?: "vertical" | "horizontal";
  variables?: Record<string, any>;
}

export interface PageGridConfig {
  columns: number;
  rows: number;
  rowHeight: number; // in pixels, default 48px
  showGridLines: boolean;
}

export interface NotebookPage {
  id: string;
  title: string;
  cellIds: string[];
  layoutMode?: LayoutMode;
  gridConfig?: PageGridConfig;
}

export interface MoveCellToCanvasOptions {
  cellId: string;
  targetPageId?: string;
  isCopy?: boolean;
  createNewCanvas?: boolean;
}

export interface CanvasPageManagementProps {
  pages: NotebookPage[];
  activePageId: string;
  editingPageId: string | null;
  showGridConfigModal: boolean;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, newTitle: string) => void;
  onSetEditingPageId: (id: string | null) => void;
  onToggleGridModal: () => void;
  onUpdateGridConfig: (config: Partial<PageGridConfig>) => void;
  onMoveCellToCanvas?: (options: MoveCellToCanvasOptions) => void;
}

export interface NotebookFile {
  name: string;
  cells: CellState[];
  pages?: NotebookPage[];
  activePageId?: string;
}

export type CommandScope = "global" | "cell" | "editor";
export type CommandMode = "Global" | "Command Mode" | "Edit Mode";

export interface NotebookCommand {
  id: string;
  name: string;
  defaultKeybinding: string;
  mode: CommandMode;
}

/** State Types */
export type StateSetter<T> = React.Dispatch<React.SetStateAction<T>>;
export type StateTuple<T> = [T, StateSetter<T>];
