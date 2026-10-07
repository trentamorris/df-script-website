import React from "react";
import Editor from "@monaco-editor/react";
import { CellType } from "../../../../../types";
import { MarkdownCellProps } from "./types";
import { defineMonacoTheme } from "../../utils/generalUtils";
import MarkdownRenderer from "../../../markdown-renderer/MarkdownRenderer";
import { registerCellKeyboardShortcuts } from "../../../../../keyboardShortcutsUtils";

export function MarkdownCell({
  cell,
  index,
  totalCells,
  cellRef,
  editorInstanceRef,
  isGridCanvasMode,
  onUpdateCode,
  onToggleCodeCollapse,
  onSelectCell,
  onRun,
  onAddCell,
  onAdvanceCell,
  onSplitCell,
}: MarkdownCellProps) {
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

  const [cursorPosition, setCursorPosition] = React.useState<{ line: number; col: number }>({
    line: 1,
    col: 1,
  });

  const content = cell.isCodeCollapsed ? (
    <div
      onDoubleClick={() => onToggleCodeCollapse(cell.id)}
      className={`bg-[var(--nb-bg-code)] hover:bg-[var(--cell-bg-code-hover)] p-3.5 rounded-xl border border-white/[0.04] select-text min-h-10 cursor-pointer transition-colors duration-150 shrink-0 h-auto ${
        isGridCanvasMode ? "overflow-y-auto max-h-full" : ""
      }`}
      title="Double click to edit markdown cell"
    >
      <MarkdownRenderer text={cell.code} />
    </div>
  ) : (
    <div
      style={{
        minHeight: isGridCanvasMode ? "60px" : "120px",
        height: isGridCanvasMode
          ? "100%"
          : `${Math.max(120, cell.code.split("\n").length * 20 + 40)}px`,
      }}
      className="relative rounded-xl group/editor overflow-hidden shrink-0 grow min-h-0 flex flex-col border bg-[var(--nb-bg-code)] border-white/[0.04] focus-within:bg-[#0c0c0e] focus-within:border-white/[0.18]"
    >
      <div className="w-full grow min-h-0 min-w-0 pt-2.5">
        <Editor
          height="100%"
          language="markdown"
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
            lineNumbers: "off",
            guides: { indentation: false },
            scrollBeyondLastLine: false,
            fontSize: 12,
            fontFamily: "var(--cell-font-mono)",
            automaticLayout: true,
            wordWrap: "on",
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
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
          }}
        />
      </div>

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

        {/* Right: MARKDOWN Language Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-sans font-medium tracking-widest uppercase transition-all duration-200 text-[var(--cell-text-tag)] group-has-[:focus-within]/editor:text-white/80">
            Markdown
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`grow flex flex-col min-w-0 min-h-0 ${isGridCanvasMode ? "h-full overflow-hidden" : "h-auto"}`}>
      {content}
    </div>
  );
}

export default MarkdownCell;
