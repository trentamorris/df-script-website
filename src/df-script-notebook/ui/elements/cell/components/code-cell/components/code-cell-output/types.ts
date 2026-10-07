import { CellProps } from "../../../../types";

export interface CodeCellOutputProps
  extends Pick<CellProps, "cell" | "onToggleOutputCollapse" | "copiedCellId" | "onCopyCell"> {}
