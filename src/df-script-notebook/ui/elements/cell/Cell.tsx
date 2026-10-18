import React from "react";
import { SouthEast } from "@mui/icons-material";
import { CellProps, CellLayoutTab } from "./types";
import { DEFAULT_CELL_KEYBINDINGS } from "../../../commands";
import { CellProvider } from "./context/CellContext";
import { useCellGridDrag } from "./hooks/useCellGridDrag";
import { calculateGridStyle } from "./utils/generalUtils";
import { CellToolbar } from "./components/cell-toolbar/CellToolbar";
import { ResponsiveCluster, ResponsiveClusterItem } from "../responsive-cluster";
import CodeCell from "./components/code-cell/CodeCell";
import MarkdownCell from "./components/markdown-cell/MarkdownCell";

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
  onToggleSplitOrientation,
  onChangeCellType,
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
  isFullscreen: externalIsFullscreen,
  onToggleFullscreen: externalOnToggleFullscreen,
  onInteractionChange,
  onOpenCommands,
  keybindings,
  toolbar: directToolbar,
  footer: directFooter,
  children: directChildren,
  slots,
  slotProps,
}: CellProps) {
  const cellRef = React.useRef<HTMLDivElement>(null);
  const positionTabRef = React.useRef<HTMLButtonElement>(null);
  const dimensionsTabRef = React.useRef<HTMLButtonElement>(null);
  const [activePanelTab, setActivePanelTab] = React.useState<CellLayoutTab | null>(null);
  const [customEditorHeight, setCustomEditorHeight] = React.useState<number | null>(null);
  const [customEditorWidth, setCustomEditorWidth] = React.useState<number | null>(null);
  const editorInstanceRef = React.useRef<any>(null);
  const [isEditorResizing, setIsEditorResizing] = React.useState(false);
  const editorBoxRef = React.useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === cellRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = React.useCallback(() => {
    if (externalOnToggleFullscreen) {
      externalOnToggleFullscreen(cell.id);
      return;
    }
    if (document.fullscreenElement === cellRef.current) {
      document.exitFullscreen?.().catch(() => { });
    } else if (cellRef.current) {
      cellRef.current.requestFullscreen?.().catch(() => { });
    }
  }, [cell.id, externalOnToggleFullscreen]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      editorInstanceRef.current?.layout?.();
    }, 60);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  const resolvedKeybindings = React.useMemo<Record<string, string>>(() => {
    const res: Record<string, string> = { ...DEFAULT_CELL_KEYBINDINGS };
    if (keybindings) {
      for (const [k, v] of Object.entries(keybindings)) {
        if (v !== undefined) {
          res[k] = v;
        }
      }
    }
    return res;
  }, [keybindings]);

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
  const isEffectiveFullHeight = isGridCanvasMode || isFullscreen;

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
    isFullscreen,
    onToggleFullscreen: handleToggleFullscreen,
    onRun,
    onDelete,
    onMoveUp,
    onMoveDown,
    onToggleCodeCollapse,
    onToggleSplitOrientation,
    onChangeCellType,
    onClearOutput,
    onUndo,
    onRedo,
    onUpdateLayout,
    handleMovePointerDown,
    keybindings: resolvedKeybindings,
  };

  const ToolbarComponent = slots?.toolbar;
  const toolbarNode =
    directToolbar !== undefined
      ? directToolbar
      : typeof ToolbarComponent === "function"
        ? <ToolbarComponent {...slotProps?.toolbar} />
        : (ToolbarComponent ?? <CellToolbar {...slotProps?.toolbar} />);

  // Footer shortcut items in natural left-to-right display order:
  // [0] Ctrl+Enter (run) stays longest
  // [1] Shift+Enter (run & next) collapses second
  // [2] Alt+Enter (run & insert) collapses first from the right
  const footerItems: ResponsiveClusterItem[] = (
    cell.type === "code"
      ? [
        {
          id: "run",
          element: (
            <span className="flex items-center gap-1 text-zinc-400 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-300 font-semibold text-[9px]">
                {resolvedKeybindings["notebook.cell.runAndStay"] || "Ctrl+Enter"}
              </kbd>
              <span>run</span>
            </span>
          ),
        },
        {
          id: "run-next",
          element: (
            <span className="flex items-center gap-1.5 text-zinc-400 shrink-0">
              <span className="text-zinc-600 shrink-0">•</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-300 font-semibold text-[9px]">
                {resolvedKeybindings["notebook.cell.runAndAdvance"] || "Shift+Enter"}
              </kbd>
              <span>run & next</span>
            </span>
          ),
        },
        {
          id: "run-insert",
          element: (
            <span className="flex items-center gap-1.5 text-zinc-400 shrink-0">
              <span className="text-zinc-600 shrink-0">•</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-300 font-semibold text-[9px]">
                {resolvedKeybindings["notebook.cell.runAndInsertBelow"] || "Alt+Enter"}
              </kbd>
              <span>run & insert</span>
            </span>
          ),
        },
      ]
      : [
        {
          id: "render",
          element: (
            <span className="flex items-center gap-1 text-zinc-400 shrink-0">
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-300 font-semibold text-[9px]">
                {resolvedKeybindings["notebook.cell.renderMarkdown"] || "Ctrl+Enter"}
              </kbd>
              <span>render</span>
            </span>
          ),
        },
        {
          id: "code-mode",
          element: (
            <span className="flex items-center gap-1.5 text-zinc-400 shrink-0">
              <span className="text-zinc-600 shrink-0">•</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-300 font-semibold text-[9px]">
                {resolvedKeybindings["notebook.cell.changeToCode"] || "Y"}
              </kbd>
              <span>code mode</span>
            </span>
          ),
        },
      ]
  );

  const defaultFooter = (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onOpenCommands?.();
      }}
      title="Click to view all notebook & Monaco commands"
      style={{ width: "calc(100% - 48px)" }}
      className="absolute bottom-1.5 left-4 z-20 flex items-center text-[9.5px] font-mono text-zinc-500 opacity-40 hover:opacity-95 transition-all select-none pointer-events-auto cursor-pointer overflow-hidden whitespace-nowrap"
      {...slotProps?.footer}
    >
      <ResponsiveCluster
        items={footerItems}
        showOverflowMenu={false}
        gap={4}
      />
    </div>
  );

  const FooterComponent = slots?.footer;
  const footerNode =
    directFooter !== undefined
      ? directFooter
      : typeof FooterComponent === "function"
        ? <FooterComponent {...slotProps?.footer} />
        : (FooterComponent ?? defaultFooter);

  const resizeHandleNode =
    !isFullscreen && isGridCanvasMode && onUpdateLayout ? (
      <div
        onPointerDown={handleResizePointerDown}
        className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 opacity-40 hover:opacity-100 group-hover:opacity-90 transition-opacity select-none touch-none z-30 text-[var(--nb-text-muted)] hover:text-[var(--nb-text-primary)]"
        title="Drag corner to resize cell dimensions"
      >
        <SouthEast sx={{ fontSize: 13 }} />
      </div>
    ) : null;

  const editorContentNode =
    directChildren !== undefined ? (
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
        customEditorWidth={customEditorWidth}
        setCustomEditorWidth={setCustomEditorWidth}
        isEditorResizing={isEditorResizing}
        setIsEditorResizing={setIsEditorResizing}
        isGridCanvasMode={isEffectiveFullHeight}
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
        isGridCanvasMode={isEffectiveFullHeight}
        onUpdateCode={onUpdateCode}
        onToggleCodeCollapse={onToggleCodeCollapse}
        onSelectCell={onSelectCell}
        onRun={onRun}
        onAddCell={onAddCell}
        onAdvanceCell={onAdvanceCell}
        onSplitCell={onSplitCell}
      />
    );

  return (
    <CellProvider value={contextValue}>
      <div
        ref={cellRef}
        data-cell-id={cell.id}
        style={{
          ...gridStyle,
          zIndex: isMoving ? 50 : gridStyle?.zIndex ?? 1,
        }}
        className={`relative flex flex-col w-full min-h-0 min-w-0 ${isEffectiveFullHeight ? "h-full" : "h-auto"
          }`}
        draggable={!isGridCanvasMode && !isFullscreen}
        onDragStart={(e) => !isGridCanvasMode && !isFullscreen && onDragStart?.(e, index)}
        onDragOver={(e) => !isGridCanvasMode && !isFullscreen && onDragOver?.(e, index)}
        onDragEnd={(e) => !isGridCanvasMode && !isFullscreen && onDragEnd?.(e)}
        onDrop={(e) => !isGridCanvasMode && !isFullscreen && onDrop?.(e, index)}
      >
        <div
          onClick={() => onSelectCell?.(cell.id)}
          className={`group/cell relative flex flex-col rounded-2xl px-4 pt-4 pb-8 min-h-0 min-w-0 transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out ${isEffectiveFullHeight ? "h-full overflow-hidden" : "h-auto"
            } ${isMoving
              ? "scale-[1.015] bg-[var(--cell-bg-active)] [--cell-current-bg:var(--cell-bg-active)] shadow-[var(--cell-shadow-lifted)] border border-[rgba(var(--rgb-blue),0.7)] backdrop-blur-md cursor-grabbing"
              : isActive
                ? "bg-[var(--cell-bg-active)] [--cell-current-bg:var(--cell-bg-active)] shadow-[var(--cell-shadow-active-aura)] border border-[rgba(var(--rgb-blue),0.45)]"
                : "bg-[var(--cell-bg-base)] [--cell-current-bg:var(--cell-bg-base)] hover:bg-[var(--cell-bg-hover)] hover:[--cell-current-bg:var(--cell-bg-hover)] border border-transparent"
            }`}
        >
          {toolbarNode}
          {editorContentNode}
          {footerNode}
        </div>

        {resizeHandleNode}
      </div>
    </CellProvider>
  );
}
