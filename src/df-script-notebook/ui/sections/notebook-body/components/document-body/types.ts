import React from "react";
import { CellState, PageGridConfig } from "../../../../../types";
import { CellProps } from "../../../../elements/cell/types";

export interface DocumentBodyProps
  extends Omit<CellProps, "cell" | "index" | "isActive" | "totalCells" | "isGridCanvasMode"> {
  activeCells: CellState[];
  activeCellId: string | null;
  gridConfig: PageGridConfig;
}
