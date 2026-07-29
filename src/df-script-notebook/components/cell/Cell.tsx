import React from "react";
import { $df, DataFrame } from "df-script";
import Editor from "@monaco-editor/react";
import {
  PlayArrow,
  Check,
  ContentCopy,
  Add,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Close,
  Edit,
  ExpandMore,
  ChevronRight,
  Visibility,
  VisibilityOff
} from "@mui/icons-material"
import { CellState } from "../../types";
import { CellProps } from "./types";
import DataFrameGrid from "../dataframe-grid/DataFrameGrid";
import MarkdownRenderer from "../markdown-renderer/MarkdownRenderer";

/* ------------------------------------------------------------------ */
/*  DOMNodeRenderer                                                    */
/* ------------------------------------------------------------------ */
const DOMNodeRenderer = ({ node }: { node: HTMLElement | SVGElement }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      ref.current.appendChild(node);
    }
  }, [node]);
  return <div ref={ref} className="w-full h-full overflow-auto" />;
};

/* ------------------------------------------------------------------ */
/*  DOMNodeRenderer                                                    */

/* ------------------------------------------------------------------ */
/*  CellInsertZone                                                     */
/* ------------------------------------------------------------------ */
function CellInsertZone({ index, onAdd }: { index: number; onAdd: (type: "code" | "jsx" | "markdown") => void }) {
  return (
    <div className="relative h-6 group flex items-center justify-center -my-3 z-30 select-none">
      <div className="absolute inset-x-0 h-px border-t border-dashed border-[(--nb-bg-raised-alt-rgb)/80] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

      <div className="opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 flex items-center gap-1.5 bg-[(--nb-bg-app)] px-3 py-1 rounded-full border border-[(--nb-border-default)] shadow-lg">
        <button
          onClick={() => onAdd("code")}
          className="px-2 py-0.5 text-[9px] font-mono tracking-wider font-semibold bg-[(--nb-bg-raised)] hover:bg-[(--nb-bg-raised-alt)] text-[(--nb-text-secondary)] hover:text-white rounded border border-[(--nb-border-light)] cursor-pointer transition-colors"
        >
          + Code
        </button>
        <button
          onClick={() => onAdd("jsx")}
          className="px-2 py-0.5 text-[9px] font-mono tracking-wider font-semibold bg-[(--nb-bg-raised)] hover:bg-[(--nb-bg-raised-alt)] text-[(--nb-text-secondary)] hover:text-white rounded border border-[(--nb-border-light)] cursor-pointer transition-colors"
        >
          + JSX
        </button>
        <button
          onClick={() => onAdd("markdown")}
          className="px-2 py-0.5 text-[9px] font-mono tracking-wider font-semibold bg-[(--nb-bg-raised)] hover:bg-[(--nb-bg-raised-alt)] text-[(--nb-text-secondary)] hover:text-white rounded border border-[(--nb-border-light)] cursor-pointer transition-colors"
        >
          + Markdown
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  handleEditorWillMount                                              */
/* ------------------------------------------------------------------ */
const handleEditorWillMount = (monaco: any) => {
  monaco.editor.defineTheme("dfnb-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#070707",
      "editor.lineHighlightBackground": "#0c0c0c",
      "editorGutter.background": "#070707"
    }
  });
};

/* ------------------------------------------------------------------ */
/*  CellOutput (internal helper)                                       */
/* ------------------------------------------------------------------ */
function CellOutput({
  cell,
  onToggleOutputCollapse,
  copiedCellId,
  onCopyCell
}: {
  cell: CellState;
  onToggleOutputCollapse: (id: string) => void;
  copiedCellId: string | null;
  onCopyCell: (id: string) => void;
}) {
  if (cell.type === "markdown") return null;

  if (cell.isOutputCollapsed) {
    return (
      <div className="mt-3 flex items-center justify-between border border-[(--nb-border-default-rgb)/40] bg-[(--nb-bg-surface-rgb)/30] px-3 py-2 rounded text-[10px] font-mono text-[(--nb-text-muted)] select-none">
        <span>Output collapsed ({cell.error ? "Execution Error" : (cell.output instanceof DataFrame ? "DataFrame Object" : "Raw Value")})</span>
        <button
          onClick={() => onToggleOutputCollapse(cell.id)}
          className="text-[(--nb-text-secondary)] hover:text-[(--nb-text-primary)] cursor-pointer"
        >
          <ExpandMore className="w-3 h-3" />
        </button>
      </div>
    );
  }

  if (cell.timeTaken === "...") {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs font-mono text-[(--nb-text-muted)]">
        <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        evaluating...
      </div>
    );
  }

  const hasLogs = cell.logs && cell.logs.length > 0;
  const hasError = !!cell.error;
  const hasValue = cell.output !== undefined && cell.output !== null;

  if (!hasLogs && !hasError && !hasValue) return null;

  return (
    <div className="flex flex-col gap-3 relative animate-fade-in">
      <button
        onClick={() => onToggleOutputCollapse(cell.id)}
        className="absolute top-0 right-1 text-[(--nb-text-muted)] hover:text-[(--nb-text-primary)] cursor-pointer select-none z-20"
        title="Collapse Output"
      >
        <ChevronRight className="w-3 h-3" />
      </button>

      {hasLogs && (
        <div className="mt-3 border border-[(--nb-border-default-rgb)/40] bg-[(--nb-bg-code)] text-[(--nb-text-console)] p-3 rounded font-mono text-[10px] select-text whitespace-pre overflow-x-auto leading-relaxed border-l-[3px] border-l-[(--nb-border-accent)]">
          <div className="text-[8px] text-[(--nb-text-muted)] font-bold uppercase tracking-wider mb-1 select-none">Console Output</div>
          {cell.logs!.join("\n")}
        </div>
      )}

      {hasError && (
        <div className={`border border-rose-950/40 bg-rose-950/10 text-rose-400 p-3 rounded font-mono text-xs select-text leading-relaxed relative ${hasLogs ? "" : "mt-3"}`}>
          <div className="flex justify-between items-start mb-1 select-none">
            <span className="font-bold uppercase tracking-wider text-[10px] text-rose-500 block">Execution Error</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(cell.error || "");
                onCopyCell(cell.id);
              }}
              className="text-[9px] font-mono tracking-widest bg-transparent hover:bg-rose-900/30 text-rose-400/70 hover:text-rose-300 border border-rose-900/30 px-1.5 py-0.5 rounded cursor-pointer transition-all uppercase font-semibold"
              title="Copy Error Message"
            >
              {copiedCellId === cell.id ? "Copied!" : "Copy"}
            </button>
          </div>
          {cell.error}
        </div>
      )}

      {!hasError && hasValue && (() => {
        const val = cell.output;
        if (val instanceof DataFrame) {
          const shapeStr = `${val.height} Rows × ${val.columns.length} Cols`;
          return (
            <div className={`flex flex-col gap-2 ${hasLogs ? "" : "mt-3"}`}>
              <div className="flex justify-between items-center text-[10px] font-mono text-[(--nb-text-muted)] select-none pr-8">
                <span>DATAFRAME OBJECT</span>
                <span>{shapeStr}</span>
              </div>
              <div className="border border-[(--nb-border-default)] rounded bg-[(--nb-bg-surface)] overflow-hidden select-text">
                <DataFrameGrid df={val} />
              </div>
            </div>
          );
        }

        if (val instanceof HTMLElement || val instanceof SVGElement) {
          return (
            <div className={`p-3 border border-[(--nb-border-default)] bg-[(--nb-bg-code)] rounded ${hasLogs ? "" : "mt-3"}`}>
              <DOMNodeRenderer node={val} />
            </div>
          );
        }

        if (val && typeof val.toHTML === "function") {
          try {
            const htmlStr = val.toHTML();
            return (
              <div
                className={`p-3 border border-[(--nb-border-default)] bg-[(--nb-bg-code)] rounded ${hasLogs ? "" : "mt-3"}`}
                dangerouslySetInnerHTML={{ __html: htmlStr }}
              />
            );
          } catch (e) {
            console.error("toHTML failed:", e);
          }
        }

        if (React.isValidElement(val)) {
          return (
            <div className={`p-3 border border-[(--nb-border-default)] bg-[(--nb-bg-code)] rounded ${hasLogs ? "" : "mt-3"}`}>
              {val}
            </div>
          );
        }

        let displayStr = "";
        if (typeof val === "object") {
          try {
            displayStr = JSON.stringify(val, null, 2);
          } catch (e) {
            displayStr = String(val);
          }
        } else {
          displayStr = String(val);
        }

        return (
          <div className={`border border-[(--nb-border-default)] bg-[(--nb-bg-code)] text-[(--nb-text-heading)] p-3 rounded font-mono text-xs select-text whitespace-pre overflow-x-auto leading-relaxed max-h-75 ${hasLogs ? "" : "mt-3"}`}>
            {displayStr}
          </div>
        );
      })()}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cell Component                                                     */
/* ------------------------------------------------------------------ */
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
  onCopyCell,
  onCopyCellCode
}: CellProps) {
  const hasRun = cell.execIndex !== null || cell.timeTaken !== null;

  let statusBorderColor = "border-l-[3px] border-l-[(--nb-border-cell)]";
  if (cell.timeTaken === "...") {
    statusBorderColor = "border-l-[3px] border-l-sky-500 animate-pulse";
  } else if (cell.error) {
    statusBorderColor = "border-l-[3px] border-l-rose-500";
  } else if (hasRun) {
    statusBorderColor = "border-l-[3px] border-l-emerald-500";
  } else if (isActive) {
    statusBorderColor = "border-l-[3px] border-l-[(--nb-border-accent)]";
  }

  const isRenderedMarkdown = cell.type === "markdown" && cell.isCodeCollapsed;

  if (isRenderedMarkdown) {
    return (
      <>
        <CellInsertZone index={index} onAdd={(type) => onAddCell(index, type)} />

        <div
          onClick={() => {
            onToggleCodeCollapse(cell.id);
          }}
          className="group flex flex-col bg-transparent border-0 rounded hover:bg-[(--nb-bg-hover-rgb)/30] transition-all p-3 relative cursor-pointer"
          title="Click to edit Markdown"
        >
          <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(cell.code);
                onCopyCellCode(cell.id);
              }}
              title="Copy Markdown"
              className="w-5 h-5 flex items-center justify-center bg-[(--nb-bg-surface)] hover:bg-[(--nb-bg-raised)] text-[(--nb-text-secondary)] hover:text-white border border-[(--nb-border-default)] rounded cursor-pointer transition-all"
            >
              {copiedCellCodeId === cell.id ? (
                <span className="text-[7.5px] font-mono text-emerald-400 font-bold uppercase px-0.5">Done</span>
              ) : (
                <ContentCopy className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleCodeCollapse(cell.id); }}
              title="Edit Cell"
              className="w-5 h-5 flex items-center justify-center bg-[(--nb-bg-surface)] hover:bg-[(--nb-bg-raised)] text-[(--nb-text-secondary)] hover:text-white border border-[(--nb-border-default)] rounded cursor-pointer transition-colors"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(cell.id); }}
              title="Delete Cell"
              className="w-5 h-5 flex items-center justify-center bg-[(--nb-bg-surface)] hover:bg-[(--nb-bg-raised)] text-[(--nb-text-secondary)] hover:text-rose-400 border border-[(--nb-border-default)] rounded cursor-pointer transition-colors"
            >
              <Close className="w-3 h-3" />
            </button>
          </div>

          <div className="flex gap-4 items-start">
            <div className="grow min-w-0">
              <MarkdownRenderer text={cell.code} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <CellInsertZone index={index} onAdd={(type) => onAddCell(index, type)} />

      <div
        onClick={() => {/* setActiveCellId handled by parent via isActive */}}
        className={`flex flex-col border border-[(--nb-border-cell)] rounded bg-[(--nb-bg-surface-rgb)/60] p-4 transition-all duration-150 ${statusBorderColor} ${isActive ? "shadow-lg bg-[(--nb-bg-surface)] border-[(--nb-border-active)]" : ""}`}
      >
        <div className="flex justify-between items-center mb-2 select-none">
          <div className="flex items-center gap-2">
            {cell.type === "markdown" && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider bg-sky-950/20 text-sky-400 border border-sky-900/20 uppercase">
                Markdown
              </span>
            )}
            {cell.type === "jsx" && (
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-mono tracking-wider bg-emerald-950/20 text-emerald-400 border border-emerald-900/20 uppercase">
                JSX / Visual
              </span>
            )}
            {cell.timeTaken && cell.timeTaken !== "..." && (
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${cell.error ? "bg-rose-950/20 text-rose-400 border border-rose-900/20" : "bg-emerald-950/20 text-emerald-400 border border-emerald-900/20"}`}>
                {cell.timeTaken}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {cell.type === "markdown" && !cell.isCodeCollapsed && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleCodeCollapse(cell.id); }}
                title="Render Markdown"
                className="w-6 h-6 flex items-center justify-center bg-[(--nb-bg-app)] hover:bg-[(--nb-bg-hover)] text-emerald-400 hover:text-emerald-300 border border-[(--nb-border-default)] rounded cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onToggleCodeCollapse(cell.id); }}
              title={cell.isCodeCollapsed ? "Expand Cell" : "Collapse Cell"}
              className="w-6 h-6 flex items-center justify-center bg-[(--nb-bg-app)] hover:bg-[(--nb-bg-hover)] text-[(--nb-text-secondary)] hover:text-[(--nb-text-primary)] border border-[(--nb-border-default)] rounded cursor-pointer transition-colors"
            >
              {cell.isCodeCollapsed ? <VisibilityOff className="w-3.5 h-3.5" /> : <Visibility className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(index); }}
              disabled={index === 0}
              title="Move Up"
              className="w-6 h-6 flex items-center justify-center bg-[(--nb-bg-app)] hover:bg-[(--nb-bg-hover)] text-[(--nb-text-secondary)] hover:text-[(--nb-text-primary)] border border-[(--nb-border-default)] rounded cursor-pointer disabled:opacity-30 transition-colors"
            >
              <KeyboardArrowUp className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(index); }}
              disabled={index === totalCells - 1}
              title="Move Down"
              className="w-6 h-6 flex items-center justify-center bg-[(--nb-bg-app)] hover:bg-[(--nb-bg-hover)] text-[(--nb-text-secondary)] hover:text-[(--nb-text-primary)] border border-[(--nb-border-default)] rounded cursor-pointer disabled:opacity-30 transition-colors"
            >
              <KeyboardArrowDown className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(cell.id); }}
              title="Delete Cell"
              className="w-6 h-6 flex items-center justify-center bg-[(--nb-bg-app)] hover:bg-[(--nb-bg-hover)] text-[(--nb-text-secondary)] hover:text-rose-400 border border-[(--nb-border-default)] rounded cursor-pointer transition-colors"
            >
              <Close className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex gap-4 items-stretch">

          <div className="flex flex-col items-center justify-between select-none w-10 shrink-0 self-stretch py-1">
            {(cell.type === "code" || cell.type === "jsx") ? (
              <button
                onClick={(e) => { e.stopPropagation(); onRun(cell.id); }}
                disabled={cell.timeTaken === "..."}
                title="Run Cell"
                className="w-10 h-10 flex items-center justify-center bg-transparent border-0 cursor-pointer disabled:opacity-50 transition-all select-none"
              >
                <PlayArrow className="w-5.5 h-5.5 transition-colors text-white hover:text-emerald-400" />
              </button>
            ) : (
              <div className="w-10 h-10" />
            )}

            <span className="text-[10px] font-mono text-[(--nb-text-muted)] text-center font-bold mt-auto select-none">
              {(cell.type === "code" || cell.type === "jsx") ? (
                `[${cell.execIndex === null ? (cell.timeTaken === "..." ? "*" : " ") : cell.execIndex}]`
              ) : (
                `[MD]`
              )}
            </span>
          </div>

          <div className="grow flex flex-col min-w-0">
            {!cell.isCodeCollapsed ? (
              <div className="relative border border-[(--nb-border-default-rgb)/60] rounded bg-[(--nb-bg-code)] py-2 group">
                <Editor
                  height={Math.max(80, cell.code.split("\n").length * 18 + 20)}
                  language={cell.type === "markdown" ? "markdown" : "javascript"}
                  theme="dfnb-dark"
                  beforeMount={handleEditorWillMount}
                  onMount={(editor, monaco) => {
                    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                      onRun(cell.id);
                    });
                  }}
                  value={cell.code}
                  onChange={(newVal) => onUpdateCode(cell.id, newVal || "")}
                  options={{
                    minimap: { enabled: false },
                    folding: true,
                    lineNumbers: "on",
                    guides: {
                      indentation: true
                    },
                    scrollBeyondLastLine: false,
                    fontSize: 11,
                    fontFamily: "monospace",
                    automaticLayout: true,
                    scrollbar: {
                      vertical: "hidden",
                      horizontal: "auto",
                      handleMouseWheel: false
                    },
                    renderLineHighlight: "none",
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true
                  }}
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(cell.code);
                    onCopyCellCode(cell.id);
                  }}
                  className="absolute top-2.5 right-2.5 z-20 px-2 py-0.5 text-[8.5px] font-mono tracking-wider bg-[(--nb-bg-surface-rgb)/80] hover:bg-[(--nb-bg-hover)] text-[(--nb-text-secondary)] hover:text-white border border-[(--nb-border-default)] rounded cursor-pointer transition-all uppercase select-none opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Copy Cell Content"
                >
                  {copiedCellCodeId === cell.id ? "Copied!" : "Copy"}
                </button>

                <span className="absolute bottom-2.5 right-4 z-20 text-[9px] font-mono text-white/80 font-bold tracking-wider select-none pointer-events-none uppercase">
                  {cell.type === "markdown" ? "Markdown" : (cell.type === "jsx" ? "JSX / React" : "JavaScript")}
                </span>
              </div>
            ) : (
              <div
                onDoubleClick={() => onToggleCodeCollapse(cell.id)}
                className="border border-[(--nb-border-default-rgb)/40] hover:border-[(--nb-border-hover)] bg-[(--nb-bg-surface-rgb)/40] p-3 rounded select-text min-h-10 cursor-pointer transition-colors duration-150"
                title="Double click to edit cell"
              >
                {cell.type === "markdown" ? (
                  <MarkdownRenderer text={cell.code} />
                ) : (
                  <div className="flex items-center justify-between font-mono text-[10.5px] text-[(--nb-text-muted)]">
                    <span className="truncate italic max-w-lg">{cell.code.split('\n')[0] || "Empty cell"}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleCodeCollapse(cell.id); }}
                      className="text-[(--nb-text-secondary)] hover:text-[(--nb-text-primary)] cursor-pointer text-[10px]"
                    >
                      expand code ({cell.code.split('\n').length} lines)
                    </button>
                  </div>
                )}
              </div>
            )}

            <CellOutput
              cell={cell}
              onToggleOutputCollapse={onToggleOutputCollapse}
              copiedCellId={copiedCellId}
              onCopyCell={onCopyCell}
            />
          </div>

        </div>
      </div>
    </>
  );
}
