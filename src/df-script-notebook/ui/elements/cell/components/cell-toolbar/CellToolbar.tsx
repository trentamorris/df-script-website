import React from "react";
import { useCellContext } from "../../hooks/useCellContext";
import { CellDragHandle } from "./modules/CellDragHandle";
import { CellIndexBadge } from "./modules/CellIndexBadge";
import { CellTypeChip } from "./modules/CellTypeChip";
import {
  CellCoordinatesChip,
  CellDimensionsChip,
  CellLayoutSettingsPanel,
} from "./modules/CellLayoutChips";
import { CellMarkdownRenderButton } from "./modules/CellMarkdownRenderButton";
import { CellVisibilityButton } from "./modules/CellVisibilityButton";
import { CellUndoButton, CellRedoButton } from "./modules/CellHistoryButtons";
import { CellResetButton } from "./modules/CellResetButton";
import { CellMoveUpButton, CellMoveDownButton } from "./modules/CellReorderButtons";
import { CellDeleteButton } from "./modules/CellDeleteButton";

export interface CellToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const CellToolbar = React.forwardRef<HTMLDivElement, CellToolbarProps>(
  ({ children, className = "", ...props }, ref) => {
    const { cell, isGridCanvasMode } = useCellContext();

    return (
      <div
        ref={ref}
        className={`flex items-center justify-between mb-3 select-none pl-1 w-full gap-2 ${className}`}
        {...props}
      >
        {children ?? (
          <>
            {/* Left side actions */}
            <div className="flex items-center gap-2">
              {isGridCanvasMode && <CellDragHandle />}
              <CellIndexBadge />
              <CellTypeChip />
              {isGridCanvasMode && (
                <>
                  <CellCoordinatesChip />
                  <CellDimensionsChip />
                </>
              )}
            </div>

            {/* Right side actions - Tailored to cell type */}
            <div className="flex items-center gap-2">
              {cell.type === "markdown" ? (
                <>
                  <CellMarkdownRenderButton />
                  <CellVisibilityButton />
                  <CellUndoButton />
                  <CellRedoButton />
                </>
              ) : (
                <>
                  <CellLayoutSettingsPanel />
                  <CellVisibilityButton />
                  <CellUndoButton />
                  <CellRedoButton />
                  <CellResetButton />
                </>
              )}
              {!isGridCanvasMode && (
                <>
                  <CellMoveUpButton />
                  <CellMoveDownButton />
                </>
              )}
              <CellDeleteButton />
            </div>
          </>
        )}
      </div>
    );
  }
);

CellToolbar.displayName = "CellToolbar";

export default CellToolbar;
