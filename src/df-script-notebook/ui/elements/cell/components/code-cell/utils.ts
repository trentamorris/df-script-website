import type { CSSProperties } from "react";
import { CellState } from "../../../../../types";

/** True when the cell has anything to show in its output pane (value, node, logs, error or a running state). */
export const hasCellOutput = (cell: CellState): boolean =>
  (cell.output !== null && cell.output !== undefined) ||
  (cell.outputNode !== null && cell.outputNode !== undefined) ||
  (!!cell.logs && cell.logs.length > 0) ||
  (cell.error !== null && cell.error !== undefined) ||
  (!!cell.variables && Object.keys(cell.variables).length > 0) ||
  cell.timeTaken === "...";

export interface EditorPaneLayoutOptions {
  isHorizontal: boolean;
  showOutputPane: boolean;
  isCodeCollapsed?: boolean;
  editorWidth?: number | null;
}

/** Style + classes for the pane wrapping the editor, for every orientation / collapse / output combination. */
export const getEditorPaneLayout = ({
  isHorizontal,
  showOutputPane,
  isCodeCollapsed,
  editorWidth,
}: EditorPaneLayoutOptions): { style: CSSProperties; className: string } => {
  const hasWidth = editorWidth !== null && editorWidth !== undefined;

  const width =
    !isHorizontal || !showOutputPane
      ? undefined
      : isCodeCollapsed
        ? "0px"
        : hasWidth
          ? `${editorWidth}px`
          : "50%";
  const style = { width, height: !isHorizontal && isCodeCollapsed ? "0px" : undefined };

  if (!showOutputPane) return { style, className: "grow flex flex-col min-w-0 min-h-0 overflow-hidden" };
  if (isCodeCollapsed) return { style, className: isHorizontal ? "shrink-0 overflow-hidden" : "overflow-hidden" };
  if (!isHorizontal) return { style, className: "flex flex-col min-w-0" };
  return {
    style,
    className: `${hasWidth ? "shrink-0" : "flex-1"} flex flex-col min-w-0 overflow-hidden`,
  };
};
