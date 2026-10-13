import React from "react";
import { IconButton, Button } from "@mui/material";
import { CodeCellProps } from "./types";
import { CELL_MUI_STYLES, getPlayButtonStyle } from "../../utils/generalUtils";
import { PlayPauseIcon } from "../../../../../svgs";
import CodeCellEditor from "./components/code-cell-editor/CodeCellEditor";
import { hasCellOutput, getEditorPaneLayout } from "./utils";
import CodeCellOutput from "./components/code-cell-output/CodeCellOutput";

/** Divider footprint (w-3/h-3 plus 0.5 margins on both sides) that always stays visible. */
const DIVIDER_PX = 16;
const KEY_STEP_PX = 10;
const KEY_LARGE_STEP_PX = 50;
const DEFAULT_RATIO = 0.5;

export function CodeCell({
  cell,
  index,
  totalCells,
  copiedCellId,
  copiedCellCodeId,
  editorBoxRef,
  editorInstanceRef,
  cellRef,
  customEditorHeight,
  setCustomEditorHeight,
  customEditorWidth,
  setCustomEditorWidth,
  isEditorResizing,
  setIsEditorResizing,
  isGridCanvasMode,
  currentLayout,
  onRun,
  onUpdateCode,
  onCopyCell,
  onCopyCellCode,
  onSelectCell,
  onAddCell,
  onAdvanceCell,
  onSplitCell,
  onToggleCodeCollapse,
  onToggleOutputCollapse,
}: CodeCellProps) {
  const hasRun = cell.execIndex !== null || cell.timeTaken !== null;
  const isHorizontal = cell.splitOrientation === "horizontal";

  // With no output the editor fills the whole area (a collapsed output with content still keeps its bar + divider)
  const showOutputPane = hasCellOutput(cell);

  // Split is kept as a 0-1 ratio of the usable area so it survives cell resizes
  const splitAreaRef = React.useRef<HTMLDivElement>(null);
  const ratioRef = React.useRef(DEFAULT_RATIO);

  // Floored at 1 so dividing by it is always safe
  const _usablePx = () => {
    const area = splitAreaRef.current;
    return area ? Math.max(1, (isHorizontal ? area.clientWidth : area.clientHeight) - DIVIDER_PX) : 1;
  };

  const _setRatio = (ratio: number) => {
    ratioRef.current = Math.min(1, Math.max(0, ratio));
    const px = ratioRef.current * _usablePx();
    if (isHorizontal) setCustomEditorWidth?.(px);
    else setCustomEditorHeight(px);
  };

  // Effects need the latest closure without re-subscribing on every render
  const setRatioRef = React.useRef(_setRatio);
  setRatioRef.current = _setRatio;

  // Even split on mount and whenever the orientation flips (needs a definite area size)
  React.useLayoutEffect(() => {
    if (isGridCanvasMode) setRatioRef.current(DEFAULT_RATIO);
  }, [isHorizontal, isGridCanvasMode]);

  // Keep the same ratio when the cell itself is resized
  React.useEffect(() => {
    const area = splitAreaRef.current;
    if (!area || !isGridCanvasMode || !showOutputPane) return;
    const observer = new ResizeObserver(() => setRatioRef.current(ratioRef.current));
    observer.observe(area);
    return () => observer.disconnect();
  }, [isHorizontal, isGridCanvasMode, showOutputPane]);

  const _expandCode = () => {
    if (cell.isCodeCollapsed) onToggleCodeCollapse(cell.id);
  };

  const _onDividerKeyDown = (e: React.KeyboardEvent) => {
    const direction = e.key === (isHorizontal ? "ArrowRight" : "ArrowDown") ? 1 : e.key === (isHorizontal ? "ArrowLeft" : "ArrowUp") ? -1 : 0;
    if (!direction) return;
    e.preventDefault();
    _expandCode();
    const stepPx = direction * (e.shiftKey ? KEY_LARGE_STEP_PX : KEY_STEP_PX);
    _setRatio(ratioRef.current + stepPx / _usablePx());
  };

  const _onDividerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const area = splitAreaRef.current;
    if (!area || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    _expandCode();

    const handle = e.currentTarget;
    const rect = area.getBoundingClientRect();
    const origin = isHorizontal ? rect.left : rect.top;
    const controller = new AbortController();
    const { signal } = controller;

    handle.setPointerCapture(e.pointerId);
    setIsEditorResizing(true);

    const onEnd = () => {
      controller.abort();
      setIsEditorResizing(false);
    };
    const onMove = (ev: PointerEvent) =>
      _setRatio(((isHorizontal ? ev.clientX : ev.clientY) - origin - DIVIDER_PX / 2) / _usablePx());
    handle.addEventListener("pointermove", onMove, { signal });
    handle.addEventListener("pointerup", onEnd, { signal });
    handle.addEventListener("pointercancel", onEnd, { signal });
  };

  const editorPane = getEditorPaneLayout({
    isHorizontal,
    showOutputPane,
    isCodeCollapsed: cell.isCodeCollapsed,
    editorWidth: customEditorWidth,
  });

  return (
    <div className="flex gap-3.5 items-stretch pl-1 grow min-h-0 min-w-0 overflow-hidden">
      {/* Run Action Column */}
      <div className="flex flex-col items-center justify-start select-none w-12 shrink-0 self-stretch py-0.5 gap-1.5">
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            onRun(cell.id);
          }}
          disabled={cell.timeTaken === "..."}
          title={cell.timeTaken === "..." ? "Executing cell..." : "Run Cell (Ctrl + Enter)"}
          sx={{
            ...CELL_MUI_STYLES.playButton,
            ...getPlayButtonStyle(hasRun, cell.timeTaken, cell.error),
          }}
        >
          <PlayPauseIcon isPlaying={cell.timeTaken === "..."} size={24} />
        </IconButton>

        {cell.timeTaken && cell.timeTaken !== "..." && (
          <span
            className={`text-[9px] font-mono font-medium tracking-tight text-center truncate max-w-full select-none ${
              cell.error ? "text-rose-400/80" : "text-zinc-500 hover:text-zinc-300"
            }`}
            title={cell.error ? `Failed in ${cell.timeTaken}` : `Executed in ${cell.timeTaken}`}
          >
            {cell.timeTaken}
          </span>
        )}
      </div>

      {/* Editor + Output Area */}
      <div
        ref={splitAreaRef}
        className={`grow ${
          isHorizontal ? "flex flex-col md:flex-row gap-0 items-stretch" : "flex flex-col"
        } min-w-0 min-h-0 ${isGridCanvasMode ? "h-full overflow-hidden" : "h-auto"} pr-1`}
      >
        <div style={editorPane.style} className={editorPane.className}>
          <div
            style={{
              display: cell.isCodeCollapsed ? "none" : undefined,
              height: "100%",
            }}
            className="flex flex-col min-w-0 min-h-0 grow"
          >
            <CodeCellEditor
              cell={cell}
              index={index}
              totalCells={totalCells}
              copiedCellCodeId={copiedCellCodeId}
              editorBoxRef={editorBoxRef}
              editorInstanceRef={editorInstanceRef}
              cellRef={cellRef}
              isEditorResizing={isEditorResizing}
              customEditorHeight={showOutputPane ? customEditorHeight : null}
              isGridCanvasMode={isGridCanvasMode}
              currentLayout={currentLayout}
              onUpdateCode={onUpdateCode}
              onCopyCellCode={onCopyCellCode}
              onSelectCell={onSelectCell}
              onRun={onRun}
              onAddCell={onAddCell}
              onAdvanceCell={onAdvanceCell}
              onSplitCell={onSplitCell}
            />
          </div>
        </div>

        {showOutputPane && (
          <>
            {/* Draggable divider between editor and output */}
            <div
              role="separator"
              aria-orientation={isHorizontal ? "vertical" : "horizontal"}
              tabIndex={0}
              onPointerDown={_onDividerPointerDown}
              onKeyDown={_onDividerKeyDown}
              title="Drag to resize"
              className={`group/divider shrink-0 flex items-center justify-center touch-none select-none ${
                isHorizontal ? "w-3 mx-0.5 self-stretch cursor-col-resize" : "h-3 my-0.5 cursor-row-resize"
              }`}
            >
              <div
                className={`rounded-full bg-white/[0.12] group-hover/divider:bg-[rgba(var(--rgb-blue),0.8)] group-active/divider:bg-[rgba(var(--rgb-blue),0.8)] group-hover/divider:shadow-[0_0_8px_rgba(var(--rgb-blue),0.9)] transition-colors duration-150 ${
                  isHorizontal ? "w-[3px] h-full" : "h-[3px] w-full"
                }`}
              />
            </div>

            {/* Output Container */}
            <div className="grow flex flex-col min-w-0 min-h-0 overflow-y-auto">
              <CodeCellOutput
                cell={cell}
                onToggleOutputCollapse={onToggleOutputCollapse}
                copiedCellId={copiedCellId}
                onCopyCell={onCopyCell}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CodeCell;
