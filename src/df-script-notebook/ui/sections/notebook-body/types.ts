import React from "react";
import { CellState, PageGridConfig, CanvasPageManagementProps } from "../../../types";
import { CellProps } from "../../elements/cell/types";

// NotebookBodyProps inherits all standard cell handlers from CellProps and page handlers from CanvasPageManagementProps
export interface NotebookBodyProps
  extends Omit<CellProps, "cell" | "index" | "isActive" | "totalCells" | "isGridCanvasMode">,
    CanvasPageManagementProps {
  activeCells: CellState[];
  isCanvas: boolean;
  activeCellId: string | null;
  gridConfig: PageGridConfig;
}
