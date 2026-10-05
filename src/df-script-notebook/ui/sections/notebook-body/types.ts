import React from "react";
import { CellState, NotebookPage, PageGridConfig } from "../../../types";
import { CellProps } from "../../elements/cell/types";

// NotebookBodyProps inherits all standard cell handlers and configurations directly from CellProps
export interface NotebookBodyProps
  extends Omit<CellProps, "cell" | "index" | "isActive" | "totalCells" | "isGridCanvasMode"> {
  activeCells: CellState[];
  isCanvas: boolean;
  activeCellId: string | null;
  gridConfig: PageGridConfig;
  // Canvas-specific props
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
