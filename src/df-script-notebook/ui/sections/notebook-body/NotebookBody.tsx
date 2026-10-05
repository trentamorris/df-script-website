import React from "react";
import { DashboardCustomize } from "@mui/icons-material";
import { NotebookBodyProps } from "./types";
import CanvasBody from "./components/canvas-body/CanvasBody";
import DocumentBody from "./components/document-body/DocumentBody";

export default function NotebookBody({
  activeCells,
  isCanvas,
  gridConfig,
  activeCellId,
  onInteractionChange,
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
  ...cellHandlers
}: NotebookBodyProps) {
  if (activeCells.length === 0) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full flex flex-col items-center justify-center py-20 text-center gap-3 border border-dashed border-[var(--nb-border-subtle)] rounded-2xl bg-[var(--nb-bg-surface)] select-none">
          <DashboardCustomize sx={{ fontSize: 36, color: "var(--nb-text-subtle)" }} />
          <p className="text-xs text-[var(--nb-text-muted)]">This page is empty. Click "+ Code" above to add a cell.</p>
        </div>
      </div>
    );
  }

  if (isCanvas) {
    return (
      <CanvasBody
        activeCells={activeCells}
        activeCellId={activeCellId}
        gridConfig={gridConfig}
        onInteractionChange={onInteractionChange}
        pages={pages}
        activePageId={activePageId}
        editingPageId={editingPageId}
        showGridConfigModal={showGridConfigModal}
        onSelectPage={onSelectPage}
        onAddPage={onAddPage}
        onDeletePage={onDeletePage}
        onRenamePage={onRenamePage}
        onSetEditingPageId={onSetEditingPageId}
        onToggleGridModal={onToggleGridModal}
        onUpdateGridConfig={onUpdateGridConfig}
        {...cellHandlers}
      />
    );
  }

  return (
    <DocumentBody
      activeCells={activeCells}
      activeCellId={activeCellId}
      gridConfig={gridConfig}
      {...cellHandlers}
    />
  );
}
