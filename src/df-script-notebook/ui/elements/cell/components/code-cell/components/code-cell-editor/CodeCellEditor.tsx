import React from "react";
import Editor from "@monaco-editor/react";
import {
  MapOutlined,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import { CellType } from "../../../../../../../types";
import { CELL_MUI_STYLES, defineMonacoTheme } from "../../../../utils/generalUtils";
import { registerCellKeyboardShortcuts } from "../../../../../../../keyboardShortcutsUtils";
import { ResponsiveCluster, ResponsiveClusterItem } from "../../../../../responsive-cluster";
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
  const [showMinimap, setShowMinimap] = React.useState(false);
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
  const lineCount = cell.code.split("\n").length;

  const footerItems: ResponsiveClusterItem[] = React.useMemo(() => {
    const list: ResponsiveClusterItem[] = [
      {
        id: "line-telemetry",
        align: "start",
        priority: 10,
        element: (
          <div className="flex items-center gap-2 text-[9px] font-mono text-[var(--nb-text-subtle)] transition-colors group-has-[:focus-within]/editor:text-[var(--nb-text-muted)] whitespace-nowrap">
            <span className="hidden group-has-[:focus-within]/editor:inline text-[var(--nb-text-secondary)] font-medium whitespace-nowrap">
              Ln {cursorPosition.line}, Col {cursorPosition.col}
            </span>
            <span className="hidden group-has-[:focus-within]/editor:inline text-[var(--cell-text-tag)]">•</span>
            <span className="whitespace-nowrap">
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
          </div>
        ),
      },
    ];

    if (cell.lastRunTime && cell.timeTaken !== "...") {
      list.push({
        id: "last-run-time",
        align: "end",
        priority: 1,
        element: (
          <span
            className="text-[9px] font-mono text-[var(--nb-text-subtle)] transition-colors whitespace-nowrap"
            title={`Last executed at ${cell.lastRunTime}`}
          >
            {cell.lastRunTime}
          </span>
        ),
      });
    }

    if (cell.timeTaken && cell.timeTaken !== "...") {
      list.push({
        id: "time-taken",
        align: "end",
        priority: 2,
        element: (
          <span
            className={`text-[9px] font-mono transition-colors whitespace-nowrap ${cell.error ? "text-[var(--cell-accent-rose)] font-medium" : "text-[var(--cell-accent-green)]"
              }`}
          >
            {cell.timeTaken}
          </span>
        ),
      });
    }

    return list;
  }, [cursorPosition.line, cursorPosition.col, lineCount, cell.lastRunTime, cell.timeTaken, cell.error]);

  const editorOptions = React.useMemo<any>(
    () => ({
      minimap: {
        enabled: showMinimap,
        side: "right",
        showSlider: "mouseover",
        renderCharacters: true,
        maxColumn: 120,
      },
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
    }),
    [showMinimap]
  );

  return (
    <div
      ref={editorBoxRef}
      style={{
        height:
          cell.splitOrientation === "horizontal"
            ? "100%"
            : customEditorHeight !== null
              ? `${customEditorHeight}px`
              : isGridCanvasMode && currentLayout
                ? cell.output || cell.logs?.length || cell.error || (cell.variables && Object.keys(cell.variables).length > 0)
                  ? "45%"
                  : "100%"
                : `${Math.max(75, Math.min(500, cell.code.split("\n").length * 19 + 24))}px`,
        minHeight: 0,
        ...(cell.splitOrientation !== "horizontal" && customEditorHeight !== null && customEditorHeight < 4
          ? { borderWidth: 0, boxShadow: "none" }
          : null),
        maxHeight: isGridCanvasMode ? "100%" : undefined,
      }}
      className={`relative rounded-xl group/editor overflow-hidden shrink-0 flex flex-col border bg-[var(--nb-bg-code)] border-[var(--cell-border-subtle)] focus-within:border-transparent ${isEditorResizing ? "transition-none" : "transition-all duration-200"
        }`}
    >
      {/* Editor Top Bar - seamless background with VS Code style downward elevation shadow */}
      <div className="h-7 shrink-0 flex items-center justify-between px-3 bg-[var(--nb-bg-code)] select-none overflow-hidden relative z-10 shadow-[0_4px_12px_-2px_rgba(var(--rgb-black),0.65)]">
        {/* Left: Prominent Language Badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[9.5px] font-sans font-medium tracking-widest uppercase transition-all duration-200 text-[var(--nb-text-muted)] group-has-[:focus-within]/editor:text-[var(--nb-text-heading)]">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${cell.timeTaken === "..."
                ? "bg-[var(--cell-accent-blue)] shadow-[var(--cell-glow-blue)] animate-pulse"
                : cell.error
                  ? "bg-[var(--cell-accent-rose)] shadow-[var(--cell-glow-rose)]"
                  : hasRun
                    ? "bg-[var(--cell-accent-green)] shadow-[var(--cell-glow-green)]"
                    : "bg-[var(--panel-nav-accent)] shadow-[0_0_6px_rgba(var(--rgb-blue),0.9)]"
                }`}
            />
            JavaScript
          </span>
        </div>

        {/* Right: Controls (Minimap toggle + Copy button) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMinimap((prev) => !prev);
            }}
            title={showMinimap ? "Hide Minimap" : "Show Minimap"}
            className={`p-1 rounded flex items-center justify-center transition-all duration-150 hover:bg-[var(--nb-bg-hover)] ${showMinimap
                ? "opacity-100 text-[var(--nb-text-primary)] bg-[rgba(var(--rgb-white),0.08)]"
                : "opacity-50 hover:opacity-100 text-[var(--nb-text-muted)] hover:text-[var(--nb-text-primary)]"
              }`}
          >
            <MapOutlined sx={{ fontSize: 13 }} />
          </button>

          <button
            type="button"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              navigator.clipboard.writeText(cell.code);
              onCopyCellCode(cell.id);
            }}
            title={copiedCellCodeId === cell.id ? "Copied!" : "Copy code"}
            className={`p-1 rounded flex items-center justify-center transition-all duration-150 hover:bg-[var(--nb-bg-hover)] ${copiedCellCodeId === cell.id
              ? "opacity-100 text-[var(--cell-accent-green)]"
              : "opacity-50 hover:opacity-100 text-[var(--nb-text-muted)] hover:text-[var(--nb-text-primary)]"
              }`}
          >
            {copiedCellCodeId === cell.id ? (
              <CheckIcon sx={{ fontSize: 13 }} />
            ) : (
              <ContentCopyIcon sx={{ fontSize: 13 }} />
            )}
          </button>
        </div>
      </div>

      {/* Monaco Code Scroll Area */}
      <div className="w-full grow min-h-0 min-w-0 pt-1">
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
          options={editorOptions}
        />
      </div>

      {/* Dedicated Padded Editor Footer Bar - completely seamless with cell code background, zero dividing borders */}
      <div className="h-6 shrink-0 flex items-center px-3 bg-transparent select-none pointer-events-none overflow-hidden whitespace-nowrap">
        <ResponsiveCluster
          items={footerItems}
          showOverflowMenu={false}
          gap={8}
          className="w-full text-[9px] font-mono text-[var(--nb-text-subtle)]"
        />
      </div>
    </div>
  );
}

export default CodeCellEditor;
