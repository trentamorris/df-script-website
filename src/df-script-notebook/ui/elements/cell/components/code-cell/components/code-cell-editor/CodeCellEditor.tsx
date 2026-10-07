import React from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@mui/material";
import { CellType } from "../../../../../../../types";
import { CELL_MUI_STYLES, defineMonacoTheme } from "../../../../utils/generalUtils";
import { registerCellKeyboardShortcuts } from "../../../../../../../keyboardShortcutsUtils";
import { CodeCellEditorProps } from "./types";

export function CodeCellEditor({
  cell,
  index,
  totalCells,
  copiedCellCodeId,
  editorBoxRef,
  editorInstanceRef,
  cellRef,
  isEditorResizing,
  customEditorHeight,
  isGridCanvasMode,
  currentLayout,
  onUpdateCode,
  onCopyCellCode,
  onSelectCell,
  onRun,
  onAddCell,
  onAdvanceCell,
  onSplitCell,
}: CodeCellEditorProps) {
  const [cursorPosition, setCursorPosition] = React.useState<{ line: number; col: number }>({
    line: 1,
    col: 1,
  });

  const cellIdRef = React.useRef(cell.id);
  cellIdRef.current = cell.id;

  const onRunRef = React.useRef(onRun);
  onRunRef.current = onRun;

  const onAddCellRef = React.useRef(onAddCell);
  onAddCellRef.current = onAddCell;

  const onSplitCellRef = React.useRef(onSplitCell);
  onSplitCellRef.current = onSplitCell;

  const onAdvanceCellRef = React.useRef(onAdvanceCell);
  onAdvanceCellRef.current = onAdvanceCell;

  const indexRef = React.useRef(index);
  indexRef.current = index;

  const totalCellsRef = React.useRef(totalCells);
  totalCellsRef.current = totalCells;

  const hasRun = cell.execIndex !== null || cell.timeTaken !== null;

  return (
    <div
      ref={editorBoxRef}
      style={{
        height:
          customEditorHeight !== null
            ? isGridCanvasMode
              ? `min(${customEditorHeight}px, calc(100% - 16px))`
              : `${customEditorHeight}px`
            : isGridCanvasMode && currentLayout
              ? cell.output || cell.logs?.length || cell.error
                ? "45%"
                : "100%"
              : `${Math.max(75, Math.min(500, cell.code.split("\n").length * 19 + 24))}px`,
        minHeight: isGridCanvasMode ? "60px" : "75px",
        maxHeight: isGridCanvasMode ? "calc(100% - 16px)" : undefined,
      }}
      className={`relative rounded-xl group/editor overflow-hidden shrink-0 flex flex-col border bg-[var(--nb-bg-code)] border-white/[0.04] focus-within:bg-[#0c0c0e] focus-within:border-white/[0.18] focus-within:shadow-[0_2px_12px_rgba(0,0,0,0.5)] ${isEditorResizing ? "transition-none" : "transition-all duration-200"
        }`}
    >
      {/* Monaco Code Scroll Area */}
      <div className="w-full grow min-h-0 min-w-0 pt-2.5">
        <Editor
          height="100%"
          language="javascript"
          theme="dfnb-dark"
          beforeMount={defineMonacoTheme}
          onMount={(editor, monaco) => {
            editorInstanceRef.current = editor;
            if (cellRef.current) {
              (cellRef.current as any).__monacoEditor = editor;
            }
            editor.onDidFocusEditorText(() => {
              onSelectCell?.(cellIdRef.current);
            });
            editor.onDidChangeCursorPosition((e) => {
              setCursorPosition({
                line: e.position.lineNumber,
                col: e.position.column,
              });
            });
            registerCellKeyboardShortcuts({
              editor,
              monaco,
              getCellId: () => cellIdRef.current,
              getIndex: () => indexRef.current,
              getTotalCells: () => totalCellsRef.current,
              onRun: (id: string) => onRunRef.current(id),
              onAddCell: (idx: number, type: CellType) => onAddCellRef.current(idx, type),
              onAdvanceCell: (idx: number) => onAdvanceCellRef.current?.(idx),
              onSplitCell: (idx: number, b: string, a: string) => onSplitCellRef.current?.(idx, b, a),
              cellContainerRef: cellRef,
            });
          }}
          value={cell.code}
          onChange={(newVal) => onUpdateCode(cell.id, newVal || "")}
          options={{
            minimap: { enabled: false },
            folding: true,
            lineNumbers: "on",
            guides: { indentation: true },
            scrollBeyondLastLine: false,
            fontSize: 11.5,
            fontFamily: "var(--cell-font-mono)",
            automaticLayout: true,
            scrollbar: {
              vertical: "auto",
              horizontal: "auto",
              verticalScrollbarSize: 6,
              horizontalScrollbarSize: 6,
              verticalSliderSize: 6,
              horizontalSliderSize: 6,
              useShadows: false,
              handleMouseWheel: true,
              alwaysConsumeMouseWheel: false,
            },
            overviewRulerLanes: 0,
            renderLineHighlight: "line",
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
          }}
        />
      </div>

      <Button
        variant="contained"
        disableElevation
        size="small"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          navigator.clipboard.writeText(cell.code);
          onCopyCellCode(cell.id);
        }}
        sx={{
          ...CELL_MUI_STYLES.miniPillButton,
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 20,
          opacity: 0,
          transition: "all 0.15s ease",
          ":hover > &": { opacity: 1 },
          "&:focus": { opacity: 1 },
        }}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Copy Cell Content"
      >
        {copiedCellCodeId === cell.id ? "Copied" : "Copy"}
      </Button>

      {/* Dedicated Padded Editor Footer Bar */}
      <div className="h-6 shrink-0 flex items-center justify-between px-3 border-t border-white/[0.03] select-none pointer-events-none transition-colors duration-200 group-has-[:focus-within]/editor:border-white/[0.06]">
        {/* Left: Dynamic Cursor & Line Telemetry */}
        <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500/70 transition-colors group-has-[:focus-within]/editor:text-zinc-400">
          <span className="hidden group-has-[:focus-within]/editor:inline text-zinc-300 font-medium">
            Ln {cursorPosition.line}, Col {cursorPosition.col}
          </span>
          <span className="hidden group-has-[:focus-within]/editor:inline text-zinc-700">•</span>
          <span>
            {cell.code.split("\n").length} {cell.code.split("\n").length === 1 ? "line" : "lines"}
          </span>
        </div>

        {/* Right: Execution timestamp + duration + Status LED + Language Badge */}
        <div className="flex items-center gap-2">
          {cell.lastRunTime && cell.timeTaken !== "..." && (
            <>
              <span
                className="text-[9px] font-mono text-zinc-500/80 transition-colors"
                title={`Last executed at ${cell.lastRunTime}`}
              >
                {cell.lastRunTime}
              </span>
              {cell.timeTaken && (
                <span className="text-[9px] text-zinc-700 select-none"> • </span>
              )}
            </>
          )}

          {cell.timeTaken && cell.timeTaken !== "..." && (
            <span
              className={`text-[9px] font-mono transition-colors ${cell.error ? "text-rose-400/90 font-medium" : "text-emerald-400/80"
                }`}
            >
              {cell.timeTaken}
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 text-[9px] font-sans font-medium tracking-widest uppercase transition-all duration-200 text-[var(--cell-text-tag)] group-has-[:focus-within]/editor:text-white/80">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 opacity-40 group-has-[:focus-within]/editor:opacity-100 group-has-[:focus-within]/editor:animate-pulse ${cell.timeTaken === "..."
                  ? "bg-[var(--cell-accent-blue)] shadow-[var(--cell-glow-blue)] animate-pulse opacity-100"
                  : cell.error
                    ? "bg-[var(--cell-accent-rose)] group-has-[:focus-within]/editor:shadow-[var(--cell-glow-rose)]"
                    : hasRun
                      ? "bg-[var(--cell-accent-green)] group-has-[:focus-within]/editor:shadow-[var(--cell-glow-green)]"
                      : "bg-[var(--panel-nav-accent)] group-has-[:focus-within]/editor:shadow-[0_0_6px_rgba(var(--rgb-blue),0.9)]"
                }`}
            />
            JavaScript
          </span>
        </div>
      </div>
    </div>
  );
}

export default CodeCellEditor;
