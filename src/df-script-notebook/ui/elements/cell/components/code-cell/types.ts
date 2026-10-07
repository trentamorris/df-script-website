import React from "react";
import { CellLayout, StateSetter } from "../../../../../types";
import { CellProps } from "../../types";

export interface CodeCellProps
  extends Pick<
    CellProps,
    | "cell"
    | "index"
    | "totalCells"
    | "copiedCellId"
    | "copiedCellCodeId"
    | "isGridCanvasMode"
    | "onRun"
    | "onUpdateCode"
    | "onCopyCell"
    | "onCopyCellCode"
    | "onSelectCell"
    | "onAddCell"
    | "onAdvanceCell"
    | "onSplitCell"
    | "onToggleCodeCollapse"
    | "onToggleOutputCollapse"
  > {
  editorBoxRef: React.RefObject<HTMLDivElement>;
  editorInstanceRef: React.MutableRefObject<any>;
  cellRef: React.RefObject<HTMLDivElement>;
  customEditorHeight: number | null;
  setCustomEditorHeight: StateSetter<number | null>;
  isEditorResizing: boolean;
  setIsEditorResizing: StateSetter<boolean>;
  currentLayout?: CellLayout;
}
