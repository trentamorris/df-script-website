import React from "react";
import { IconButton, Button } from "@mui/material";
import { CodeCellProps } from "./types";
import { CELL_MUI_STYLES, getPlayButtonStyle } from "../../utils/generalUtils";
import { PlayPauseIcon } from "../../../../../svgs";
import DraggableDivider from "../../../draggable-divider/DraggableDivider";
import CodeCellEditor from "./components/code-cell-editor/CodeCellEditor";
import CodeCellOutput from "./components/code-cell-output/CodeCellOutput";

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
      <div className={`grow flex flex-col min-w-0 min-h-0 ${isGridCanvasMode ? "h-full overflow-hidden" : "h-auto"} pr-1`}>
        {!cell.isCodeCollapsed ? (
          <CodeCellEditor
            cell={cell}
            index={index}
            totalCells={totalCells}
            copiedCellCodeId={copiedCellCodeId}
            editorBoxRef={editorBoxRef}
            editorInstanceRef={editorInstanceRef}
            cellRef={cellRef}
            isEditorResizing={isEditorResizing}
            customEditorHeight={customEditorHeight}
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
        ) : (
          <div
            onDoubleClick={() => onToggleCodeCollapse(cell.id)}
            className="bg-[var(--nb-bg-code)] hover:bg-[var(--cell-bg-code-hover)] p-3.5 rounded-xl select-text min-h-10 cursor-pointer transition-colors duration-150 shrink-0"
            title="Double click to edit cell"
          >
            <div className="flex justify-between items-center font-mono text-[11px] text-[var(--nb-text-muted)]">
              <span className="truncate italic max-w-lg text-[var(--nb-text-subtle)]">
                {cell.code.split("\n")[0] || "Empty cell"}
              </span>
              <Button
                variant="contained"
                disableElevation
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCodeCollapse(cell.id);
                }}
                sx={CELL_MUI_STYLES.chipButton}
              >
                Expand ({cell.code.split("\n").length} lines)
              </Button>
            </div>
          </div>
        )}

        {/* Dedicated Gap with Centered DraggableDivider */}
        {!cell.isCodeCollapsed && (
          <div className="relative h-3 my-0.5 shrink-0 flex items-center justify-center">
            <DraggableDivider
              containerRef={editorBoxRef}
              orientation="vertical"
              anchor="bottom"
              dragDirection="down"
              thicknessPx={6}
              clampMin={65}
              clampMax={800}
              onPointerDown={() => setIsEditorResizing(true)}
              onPointerMove={({ payload }: { payload: { px: number } }) => {
                setCustomEditorHeight(payload.px);
              }}
              onPointerUp={() => {
                setIsEditorResizing(false);
              }}
              className="hover:shadow-[0_0_8px_rgba(var(--rgb-blue),0.9)] transition-colors duration-150"
            />
          </div>
        )}

        <div
          className={`min-h-0 grow overflow-y-auto ${
            isGridCanvasMode &&
            editorBoxRef.current &&
            editorBoxRef.current.parentElement &&
            editorBoxRef.current.offsetHeight >=
              editorBoxRef.current.parentElement.clientHeight - 24
              ? "hidden"
              : ""
          }`}
        >
          <CodeCellOutput
            cell={cell}
            onToggleOutputCollapse={onToggleOutputCollapse}
            copiedCellId={copiedCellId}
            onCopyCell={onCopyCell}
          />
        </div>
      </div>
    </div>
  );
}

export default CodeCell;
