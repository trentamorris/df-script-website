import React from "react";
import { CellState, PageGridConfig, CanvasPageManagementProps } from "../../../../../types";
import { CellProps } from "../../../../elements/cell/types";

export interface CanvasBodyProps
  extends Omit<CellProps, "cell" | "index" | "isActive" | "totalCells" | "isGridCanvasMode">,
    CanvasPageManagementProps {
  activeCells: CellState[];
  activeCellId: string | null;
  gridConfig: PageGridConfig;
  isInteractingContainer?: boolean;
  onInteractionChange?: (isInteracting: boolean) => void;
}
