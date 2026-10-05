import React from "react";
import { CanvasBodyProps } from "./types";
import { Cell, GridCanvas, GridCanvasToolbar } from "../../../../elements";

export default function CanvasBody({
  activeCells,
  gridConfig,
  activeCellId,
  isInteractingContainer,
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
}: CanvasBodyProps) {
  const [isInteracting, setIsInteracting] = React.useState(false);

  const handleInteractionChange = (val: boolean) => {
    setIsInteracting(val);
    onInteractionChange?.(val);
  };

  return (
    <GridCanvas
      gridConfig={gridConfig}
      isInteracting={isInteracting}
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
      slots={{
        toolbar: <GridCanvasToolbar />,
      }}
    >
      {activeCells.map((cell, idx) => (
        <Cell
          key={cell.id}
          index={idx}
          cell={cell}
          isActive={activeCellId === cell.id}
          totalCells={activeCells.length}
          isGridCanvasMode={true}
          gridConfig={gridConfig}
          onInteractionChange={handleInteractionChange}
          {...cellHandlers}
        />
      ))}
    </GridCanvas>
  );
}

