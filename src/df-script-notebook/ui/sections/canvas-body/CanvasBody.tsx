import React from "react";
import { DashboardCustomize } from "@mui/icons-material";
import { CanvasBodyProps } from "./types";
import Cell from "../../elements/cell/Cell";

export default function CanvasBody({
  activeCells,
  isCanvas,
  gridConfig,
  activeCellId,
  copiedCellId,
  copiedCellCodeId,
  onRunCell,
  onDeleteCell,
  onMoveCellUp,
  onMoveCellDown,
  onToggleCodeCollapse,
  onToggleOutputCollapse,
  onUpdateCellCode,
  onAddCellAtIndex,
  onCopyCell,
  onCopyCellCode,
  onUpdateCellLayout,
  onDragStart,
  onDragOver,
  onDrop,
}: CanvasBodyProps) {
  if (activeCells.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-4 pb-24">
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 border border-dashed border-white/10 rounded-2xl bg-[var(--nb-bg-surface)] select-none">
          <DashboardCustomize sx={{ fontSize: 36, color: "rgba(255,255,255,0.2)" }} />
          <p className="text-xs text-[var(--nb-text-muted)]">This page is empty. Click "+ Code" above to add a cell.</p>
        </div>
      </div>
    );
  }

  // Document Mode: Clean linear notebook flow with natural auto sizing
  if (!isCanvas) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-4 pb-24 overflow-x-auto">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          {activeCells.map((cell, idx) => (
            <Cell
              key={cell.id}
              cell={cell}
              index={idx}
              isActive={activeCellId === cell.id}
              totalCells={activeCells.length}
              copiedCellId={copiedCellId}
              copiedCellCodeId={copiedCellCodeId}
              onRun={onRunCell}
              onDelete={onDeleteCell}
              onMoveUp={onMoveCellUp}
              onMoveDown={onMoveCellDown}
              onToggleCodeCollapse={onToggleCodeCollapse}
              onToggleOutputCollapse={onToggleOutputCollapse}
              onUpdateCode={onUpdateCellCode}
              onAddCell={onAddCellAtIndex}
              onCopyCell={onCopyCell}
              onCopyCellCode={onCopyCellCode}
              onUpdateLayout={onUpdateCellLayout}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              isGridCanvasMode={false}
              gridConfig={gridConfig}
            />
          ))}
        </div>
      </div>
    );
  }

  const [isInteracting, setIsInteracting] = React.useState(false);

  // Canvas Mode: 2D Grid Layout
  const colWidthPercent = 100 / gridConfig.columns;
  const gridBackgroundStyle: React.CSSProperties = gridConfig.showGridLines || isInteracting
    ? {
        backgroundImage: isInteracting
          ? `
            linear-gradient(to right, rgba(62, 166, 255, 0.12) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(62, 166, 255, 0.12) 1px, transparent 1px)
          `
          : `
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)
          `,
        backgroundSize: `${colWidthPercent}% ${gridConfig.rowHeight}px`,
        backgroundPosition: "0 0",
      }
    : {};

  return (
    <div className="w-full p-4 md:p-6 overflow-x-auto">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${gridConfig.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridConfig.rows}, ${gridConfig.rowHeight}px)`,
          gridAutoRows: `${gridConfig.rowHeight}px`,
          gap: "12px",
          position: "relative",
          minHeight: `${gridConfig.rows * gridConfig.rowHeight}px`,
          ...gridBackgroundStyle,
        }}
        className={`rounded-none border p-3 min-w-[700px] transition-all duration-300 ${
          isInteracting
            ? "border-blue-500/20 bg-blue-500/[0.015]"
            : "border-white/[0.04] bg-transparent"
        }`}
      >
        {activeCells.map((cell, idx) => (
          <Cell
            key={cell.id}
            cell={cell}
            index={idx}
            isActive={activeCellId === cell.id}
            totalCells={activeCells.length}
            copiedCellId={copiedCellId}
            copiedCellCodeId={copiedCellCodeId}
            onRun={onRunCell}
            onDelete={onDeleteCell}
            onMoveUp={onMoveCellUp}
            onMoveDown={onMoveCellDown}
            onToggleCodeCollapse={onToggleCodeCollapse}
            onToggleOutputCollapse={onToggleOutputCollapse}
            onUpdateCode={onUpdateCellCode}
            onAddCell={onAddCellAtIndex}
            onCopyCell={onCopyCell}
            onCopyCellCode={onCopyCellCode}
            onUpdateLayout={onUpdateCellLayout}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            isGridCanvasMode={true}
            gridConfig={gridConfig}
            onInteractionChange={setIsInteracting}
          />
        ))}
      </div>
    </div>
  );
}
