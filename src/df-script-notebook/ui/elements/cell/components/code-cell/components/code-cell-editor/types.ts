import { CodeCellProps } from "../../types";

export interface CodeCellEditorProps
  extends Omit<
    CodeCellProps,
    | "copiedCellId"
    | "onCopyCell"
    | "onToggleCodeCollapse"
    | "onToggleOutputCollapse"
    | "setCustomEditorHeight"
    | "setIsEditorResizing"
  > {}
