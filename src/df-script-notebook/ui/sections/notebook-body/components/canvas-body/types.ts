import React from "react";
import { CellState, NotebookPage, PageGridConfig } from "../../../../../types";
import { CellProps } from "../../../../elements/cell/types";

export interface CanvasBodyProps
  extends Omit<CellProps, "cell" | "index" | "isActive" | "totalCells" | "isGridCanvasMode"> {
  activeCells: CellState[];
  activeCellId: string | null;
  gridConfig: PageGridConfig;
  isInteractingContainer?: boolean;
  onInteractionChange?: (isInteracting: boolean) => void;
  // Canvas Toolbar props
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
}
