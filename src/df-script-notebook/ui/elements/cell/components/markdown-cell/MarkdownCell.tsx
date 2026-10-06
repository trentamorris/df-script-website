import React from "react";
import Editor from "@monaco-editor/react";
import { CellState, CellType } from "../../../../../types";
import { CELL_MUI_STYLES, defineMonacoTheme } from "../../utils";
import MarkdownRenderer from "../../../markdown-renderer/MarkdownRenderer";
import { registerCellKeyboardShortcuts } from "../../../../../keyboardShortcutsUtils";

export interface MarkdownCellProps {
  cell: CellState;
  index: number;
  totalCells: number;
  cellRef: React.RefObject<HTMLDivElement>;
  editorInstanceRef: React.MutableRefObject<any>;
  isGridCanvasMode?: boolean;
  onUpdateCode: (id: string, code: string) => void;
  onToggleCodeCollapse: (id: string) => void;
  onSelectCell?: (id: string) => void;
  onRun: (id: string) => void;
  onAddCell: (index: number, type: CellType) => void;
  onAdvanceCell?: (index: number) => void;
  onSplitCell?: (index: number, beforeCode: string, afterCode: string) => void;
}

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

  if (cell.isCodeCollapsed) {
    return (
      <div
        onDoubleClick={() => onToggleCodeCollapse(cell.id)}
        className={`bg-[var(--nb-bg-code)] hover:bg-[var(--cell-bg-code-hover)] p-3.5 rounded-xl select-text min-h-10 cursor-pointer transition-colors duration-150 shrink-0 grow ${
          isGridCanvasMode ? "overflow-y-auto" : ""
        }`}
        title="Double click to edit markdown cell"
      >
        <MarkdownRenderer text={cell.code} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: isGridCanvasMode ? "60px" : "120px",
        height: isGridCanvasMode ? "100%" : `${Math.max(120, cell.code.split("\n").length * 20 + 40)}px`,
      }}
      className="relative rounded-xl group/editor overflow-hidden shrink-0 grow flex flex-col border bg-[var(--nb-bg-code)] border-white/[0.04] focus-within:bg-[#0c0c0e] focus-within:border-white/[0.18]"
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
          }}
        />
      </div>

      <div className="h-6 shrink-0 flex items-center justify-between px-3 border-t border-white/[0.03] select-none pointer-events-none transition-colors duration-200">
        <span className="text-[9px] font-mono text-zinc-500/70">Markdown Editor</span>
        <span className="text-[9px] font-mono text-zinc-400">Ctrl+Enter to finish</span>
      </div>
    </div>
  );
}

export default MarkdownCell;
