import React from "react";
import { CellProps } from "../../types";

export interface MarkdownCellProps
  extends Pick<
    CellProps,
    | "cell"
    | "index"
    | "totalCells"
    | "isGridCanvasMode"
    | "onUpdateCode"
    | "onToggleCodeCollapse"
    | "onSelectCell"
    | "onRun"
    | "onAddCell"
    | "onAdvanceCell"
    | "onSplitCell"
  > {
  cellRef: React.RefObject<HTMLDivElement>;
  editorInstanceRef: React.MutableRefObject<any>;
}
