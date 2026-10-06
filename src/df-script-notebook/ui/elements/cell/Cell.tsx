import React from "react";
import { SouthEast } from "@mui/icons-material";
import { CellProps, CellContainerProps } from "./types";
import { CellProvider } from "./context/CellContext";
import { useCellGridDrag } from "./hooks/useCellGridDrag";
import { calculateGridStyle } from "./utils";
import { CellToolbar } from "./components/cell-toolbar/CellToolbar";
import { CellDragHandle } from "./components/cell-toolbar/modules/CellDragHandle";
import { CellIndexBadge } from "./components/cell-toolbar/modules/CellIndexBadge";
import { CellTypeChip } from "./components/cell-toolbar/modules/CellTypeChip";
import {
  CellCoordinatesChip,
  CellDimensionsChip,
  CellLayoutSettingsPanel,
} from "./components/cell-toolbar/modules/CellLayoutChips";
import { CellMarkdownRenderButton } from "./components/cell-toolbar/modules/CellMarkdownRenderButton";
import { CellVisibilityButton } from "./components/cell-toolbar/modules/CellVisibilityButton";
import { CellUndoButton, CellRedoButton } from "./components/cell-toolbar/modules/CellHistoryButtons";
import { CellResetButton } from "./components/cell-toolbar/modules/CellResetButton";
import { CellMoveUpButton, CellMoveDownButton } from "./components/cell-toolbar/modules/CellReorderButtons";
import { CellDeleteButton } from "./components/cell-toolbar/modules/CellDeleteButton";
import CodeCell from "./components/code-cell/CodeCell";
import MarkdownCell from "./components/markdown-cell/MarkdownCell";

export function CellContainer({
  cell,
  isSelected = false,
  isMoving = false,
  isGridCanvasMode = false,
  toolbar,
  children,
  footer,
  resizeHandle,
  insertZone,
  onSelect,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  containerRef,
  gridStyle,
  className = "",
  ...restProps
}: CellContainerProps) {
  return (
    <div
      ref={containerRef}
      data-cell-id={cell.id}
      style={{
        ...gridStyle,
        zIndex: isMoving ? 50 : gridStyle?.zIndex ?? 1,
      }}
      className={`relative flex flex-col w-full min-h-0 min-w-0 ${
        isGridCanvasMode ? "h-full" : "h-auto"
      } ${className}`}
      draggable={!isGridCanvasMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      {...restProps}
    >
      {insertZone}

      <div
        onClick={onSelect}
        className={`group/cell relative flex flex-col rounded-2xl px-4 pt-4 pb-8 min-h-0 min-w-0 transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out ${
          isGridCanvasMode ? "h-full overflow-hidden" : "h-auto"
        } ${
          isMoving
            ? "scale-[1.015] bg-[var(--cell-bg-active)] shadow-[var(--cell-shadow-lifted)] border border-[rgba(var(--rgb-blue),0.7)] backdrop-blur-md cursor-grabbing"
            : isSelected
              ? "bg-[var(--cell-bg-active)] shadow-[var(--cell-shadow-active-aura)] border border-[rgba(var(--rgb-blue),0.45)]"
              : "bg-[var(--cell-bg-base)] hover:bg-[var(--cell-bg-hover)] border border-transparent"
        }`}
      >
        {toolbar}

        {children}

        {footer}
      </div>

      {resizeHandle}
    </div>
  );
}

export default function Cell({
  cell,
  index,
  isActive,
  totalCells,
  copiedCellId,
  copiedCellCodeId,
  onRun,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleCodeCollapse,
  onToggleOutputCollapse,
  onUpdateCode,
  onAddCell,
  onSplitCell,
  onCopyCell,
  onCopyCellCode,
  onSelectCell,
  onAdvanceCell,
  onClearOutput,
  onUndo,
  onRedo,
  onUpdateLayout,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isGridCanvasMode,
  gridConfig,
  onInteractionChange,
  onOpenCommands,
  toolbar: directToolbar,
  footer: directFooter,
  children: directChildren,
  slots,
  slotProps,
}: CellProps) {
  const cellRef = React.useRef<HTMLDivElement>(null);
  const positionTabRef = React.useRef<HTMLButtonElement>(null);
  const dimensionsTabRef = React.useRef<HTMLButtonElement>(null);
  const [activePanelTab, setActivePanelTab] = React.useState<"position" | "size" | null>(null);
  const [customEditorHeight, setCustomEditorHeight] = React.useState<number | null>(null);
  const editorInstanceRef = React.useRef<any>(null);
  const [isEditorResizing, setIsEditorResizing] = React.useState(false);
  const editorBoxRef = React.useRef<HTMLDivElement>(null);

  const {
    isMoving,
    isResizing,
    liveLayout,
    handleMovePointerDown,
    handleResizePointerDown,
  } = useCellGridDrag({
    cellId: cell.id,
    layout: cell.layout,
    isGridCanvasMode,
    gridConfig,
    cellElementRef: cellRef,
    onUpdateLayout,
    onInteractionChange,
  });

  const currentLayout = liveLayout || cell.layout;
  const gridStyle = calculateGridStyle(isGridCanvasMode, currentLayout);

  const contextValue = {
    cell,
    index,
    totalCells,
    isActive,
    isMoving,
    isResizing,
    isGridCanvasMode,
    gridConfig,
    currentLayout,
    editorInstanceRef,
    cellRef,
    activePanelTab,
    setActivePanelTab,
    positionTabRef,
    dimensionsTabRef,
    onRun,
    onDelete,
    onMoveUp,
    onMoveDown,
    onToggleCodeCollapse,
    onClearOutput,
    onUndo,
    onRedo,
    onUpdateLayout,
    handleMovePointerDown,
  };

  // Default Toolbar or custom slot override
  const defaultToolbar = (
    <CellToolbar {...slotProps?.toolbar}>
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
      <div className="flex items-center gap-1.5 opacity-70 group-hover/cell:opacity-100 transition-opacity">
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
    </CellToolbar>
  );

  const ToolbarComponent = slots?.toolbar;
  const toolbarNode =
    directToolbar !== undefined
      ? directToolbar
      : typeof ToolbarComponent === "function"
        ? <ToolbarComponent {...slotProps?.toolbar} />
        : (ToolbarComponent ?? defaultToolbar);

  const defaultFooter =
    cell.type === "code" ? (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onOpenCommands?.();
        }}
        title="Click to view all notebook & Monaco commands"
        style={{ maxWidth: "calc(100% - 64px)" }}
        className="absolute bottom-1.5 left-4 z-20 flex items-center gap-2 text-[9.5px] font-mono text-zinc-500 opacity-40 hover:opacity-95 transition-all select-none pointer-events-auto cursor-pointer overflow-hidden whitespace-nowrap"
        {...slotProps?.footer}
      >
        <span className="flex items-center gap-1 text-zinc-400 shrink-0">
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-300 font-semibold text-[9px]">
            Ctrl+Enter
          </kbd>
          <span>run</span>
        </span>
        <span className="text-zinc-600 shrink-0">•</span>
        <span className="flex items-center gap-1 text-zinc-400 shrink-0">
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-300 font-semibold text-[9px]">
            Shift+Enter
          </kbd>
          <span>run & next</span>
        </span>
        <span className="text-zinc-600 shrink-0">•</span>
        <span className="flex items-center gap-1 text-zinc-400 shrink-0">
          <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-300 font-semibold text-[9px]">
            Alt+Enter
          </kbd>
          <span>run & insert</span>
        </span>
      </div>
    ) : null;

  const FooterComponent = slots?.footer;
  const footerNode =
    directFooter !== undefined
      ? directFooter
      : typeof FooterComponent === "function"
        ? <FooterComponent {...slotProps?.footer} />
        : (FooterComponent ?? defaultFooter);

  const resizeHandleNode =
    isGridCanvasMode && onUpdateLayout ? (
      <div
        onPointerDown={handleResizePointerDown}
        className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 opacity-40 hover:opacity-100 group-hover:opacity-90 transition-opacity select-none touch-none z-30 text-[var(--nb-text-muted)] hover:text-[var(--nb-text-primary)]"
        title="Drag corner to resize cell dimensions"
      >
        <SouthEast sx={{ fontSize: 13 }} />
      </div>
    ) : null;

  return (
    <CellProvider value={contextValue}>
      <CellContainer
        cell={cell}
        isSelected={isActive}
        isMoving={isMoving}
        isGridCanvasMode={isGridCanvasMode}
        toolbar={toolbarNode}
        footer={footerNode}
        resizeHandle={resizeHandleNode}
        onSelect={() => onSelectCell?.(cell.id)}
        onDragStart={(e) => !isGridCanvasMode && onDragStart?.(e, index)}
        onDragOver={(e) => !isGridCanvasMode && onDragOver?.(e, index)}
        onDragEnd={(e) => !isGridCanvasMode && onDragEnd?.(e)}
        onDrop={(e) => !isGridCanvasMode && onDrop?.(e, index)}
        containerRef={cellRef}
        gridStyle={gridStyle}
      >
        {directChildren !== undefined ? (
          directChildren
        ) : slots?.editor ? (
          typeof slots.editor === "function" ? (
            <slots.editor {...slotProps?.editor} />
          ) : (
            slots.editor
          )
        ) : cell.type === "code" ? (
          <CodeCell
            cell={cell}
            index={index}
            totalCells={totalCells}
            copiedCellId={copiedCellId}
            copiedCellCodeId={copiedCellCodeId}
            editorBoxRef={editorBoxRef}
            editorInstanceRef={editorInstanceRef}
            cellRef={cellRef}
            customEditorHeight={customEditorHeight}
            setCustomEditorHeight={setCustomEditorHeight}
            isEditorResizing={isEditorResizing}
            setIsEditorResizing={setIsEditorResizing}
            isGridCanvasMode={isGridCanvasMode}
            currentLayout={currentLayout}
            onRun={onRun}
            onUpdateCode={onUpdateCode}
            onCopyCell={onCopyCell}
            onCopyCellCode={onCopyCellCode}
            onSelectCell={onSelectCell}
            onAddCell={onAddCell}
            onAdvanceCell={onAdvanceCell}
            onSplitCell={onSplitCell}
            onToggleCodeCollapse={onToggleCodeCollapse}
            onToggleOutputCollapse={onToggleOutputCollapse}
          />
        ) : (
          <MarkdownCell
            cell={cell}
            index={index}
            totalCells={totalCells}
            cellRef={cellRef}
            editorInstanceRef={editorInstanceRef}
            isGridCanvasMode={isGridCanvasMode}
            onUpdateCode={onUpdateCode}
            onToggleCodeCollapse={onToggleCodeCollapse}
            onSelectCell={onSelectCell}
            onRun={onRun}
            onAddCell={onAddCell}
            onAdvanceCell={onAdvanceCell}
            onSplitCell={onSplitCell}
          />
        )}
      </CellContainer>
    </CellProvider>
  );
}
