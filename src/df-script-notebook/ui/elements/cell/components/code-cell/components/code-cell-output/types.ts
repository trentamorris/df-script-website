import { CellProps } from "../../../../types";

export interface VariableDisplayItem {
  id?: string;
  name: string;
  value: any;
  typeLabel?: string;
  isConsole?: boolean;
}

export interface CodeCellOutputProps
  extends Pick<CellProps, "cell" | "onToggleOutputCollapse" | "copiedCellId" | "onCopyCell"> {}
