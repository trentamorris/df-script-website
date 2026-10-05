import React from "react";
import { GridCanvasProps, GridCanvasContextValue } from "./types";
import { GridCanvasContext } from "./context";
import GridCanvasOverlay from "./components/grid-canvas-overlay/GridCanvasOverlay";

export default function GridCanvas({
  gridConfig,
  isInteracting = false,
  gapPx = 12,
  paddingPx = 12,
  children,
  className = "",
  style,
  pages,
  activePageId,
  editingPageId,
  showGridConfigModal,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
  onSetEditingPageId,
  onToggleGridModal,
  onUpdateGridConfig,
  slotProps,
  slots,
}: GridCanvasProps) {
  const cols = gridConfig.columns;
  const rows = gridConfig.rows;
  const rowHeight = gridConfig.rowHeight;

  const ctxValue = React.useMemo<GridCanvasContextValue>(
    () => ({
      gridConfig,
      isInteracting,
      pages,
      activePageId,
      editingPageId,
      showGridConfigModal,
      onSelectPage,
      onAddPage,
      onDeletePage,
      onRenamePage,
      onSetEditingPageId,
      onToggleGridModal,
      onUpdateGridConfig,
    }),
    [
      gridConfig,
      isInteracting,
      pages,
      activePageId,
      editingPageId,
      showGridConfigModal,
      onSelectPage,
      onAddPage,
      onDeletePage,
      onRenamePage,
      onSetEditingPageId,
      onToggleGridModal,
      onUpdateGridConfig,
    ]
  );

  return (
    <GridCanvasContext.Provider value={ctxValue}>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden w-full">
        {/* Scrollable Canvas Grid View */}
        <div
          className={`flex-1 overflow-y-auto min-h-0 flex flex-col transition-colors duration-200 ${
            isInteracting ? "bg-[var(--nb-grid-interactive-bg)]" : "bg-transparent"
          }`}
        >
          <div className="w-full p-4 md:p-6 overflow-x-auto">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, ${rowHeight}px)`,
                gridAutoRows: `${rowHeight}px`,
                gap: `${gapPx}px`,
                position: "relative",
                minHeight: `${rows * rowHeight + (rows - 1) * gapPx + paddingPx * 2}px`,
                ...style,
              }}
              className={`p-3 min-w-[700px] ${className}`}
            >
              <GridCanvasOverlay
                cols={cols}
                rows={rows}
                rowHeight={rowHeight}
                gapPx={gapPx}
                isInteracting={isInteracting}
              />
              {children}
            </div>
          </div>
        </div>

        {(slots?.toolbar || slotProps?.toolbar) && (
          <div
            {...slotProps?.toolbar}
            className={`shrink-0 z-30 ${slotProps?.toolbar?.className ?? ""}`}
          >
            {slots?.toolbar}
          </div>
        )}
      </div>
    </GridCanvasContext.Provider>
  );
}
