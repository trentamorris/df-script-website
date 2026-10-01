import React from "react";
import Editor from "@monaco-editor/react";
import { Button, IconButton, CircularProgress } from "@mui/material";
import {
  PlayArrow,
  Pause,
  Check,
  ContentCopy,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Close,
  Edit,
  Visibility,
  VisibilityOff,
  DragIndicator,
  Tune,
  SouthEast,
  Add,
  Remove,
} from "@mui/icons-material";
import { CellProps } from "./types";
import { useCellGridDrag } from "./useCellGridDrag";
import {
  CELL_MUI_STYLES,
  calculateGridStyle,
  getPlayButtonStyle,
  defineMonacoTheme,
} from "./utils";
import { registerCellKeyboardShortcuts } from "../../../keyboardShortcutsUtils";
import CellInsertZone from "./components/cell-insert-zone/CellInsertZone";
import CellOutput from "./components/cell-output/CellOutput";
import MarkdownRenderer from "../markdown-renderer/MarkdownRenderer";
import PanelNavigation from "../panel-navigation/PanelNavigation";
import { NavigationPanelItem } from "../panel-navigation/types";

interface NumericStepperProps {
  val: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}

function NumericStepper({ val, min, max, onChange }: NumericStepperProps) {
  const [text, setText] = React.useState(String(val));

  React.useEffect(() => {
    setText(String(val));
  }, [val]);

  const commit = (str: string) => {
    const parsed = parseInt(str, 10);
    if (isNaN(parsed)) {
      setText(String(val));
    } else {
      const clamped = Math.max(min, Math.min(max, parsed));
      setText(String(clamped));
      if (clamped !== val) {
        onChange(clamped);
      }
    }
  };

  return (
    <div className="flex items-center gap-1 bg-black/40 rounded-full px-1 py-0.5 border border-white/10">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, val - 1))}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/15 text-[var(--nb-text-muted)] hover:text-white transition-colors cursor-pointer"
      >
        <Remove sx={{ fontSize: 13 }} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed)) {
            const clamped = Math.max(min, Math.min(max, parsed));
            onChange(clamped);
          }
        }}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(text);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-8 text-center font-mono text-xs font-semibold text-white bg-transparent outline-none cursor-text focus:bg-white/10 rounded"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, val + 1))}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/15 text-[var(--nb-text-muted)] hover:text-white transition-colors cursor-pointer"
      >
        <Add sx={{ fontSize: 13 }} />
      </button>
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
  onCopyCell,
  onCopyCellCode,
  onSelectCell,
  onUpdateLayout,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isGridCanvasMode,
  gridConfig,
  onInteractionChange,
}: CellProps) {
  const cellRef = React.useRef<HTMLDivElement>(null);
  const positionTabRef = React.useRef<HTMLButtonElement>(null);
  const dimensionsTabRef = React.useRef<HTMLButtonElement>(null);
  const [activePanelTab, setActivePanelTab] = React.useState<"position" | "size" | null>(null);

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

  const hasRun = cell.execIndex !== null || cell.timeTaken !== null;
  const currentLayout = liveLayout || cell.layout;
  const gridStyle = calculateGridStyle(isGridCanvasMode, currentLayout);

  const cellIdRef = React.useRef(cell.id);
  cellIdRef.current = cell.id;

  const onRunRef = React.useRef(onRun);
  onRunRef.current = onRun;

  const onAddCellRef = React.useRef(onAddCell);
  onAddCellRef.current = onAddCell;

  const indexRef = React.useRef(index);
  indexRef.current = index;

  const totalCellsRef = React.useRef(totalCells);
  totalCellsRef.current = totalCells;

  const isRenderedMarkdown = !isGridCanvasMode && cell.type === "markdown" && cell.isCodeCollapsed;

  return (
    <div
      ref={cellRef}
      style={gridStyle}
      className={`relative flex flex-col w-full min-h-0 min-w-0 ${isGridCanvasMode ? "h-full" : "h-auto"}`}
      draggable={!isGridCanvasMode}
      onDragStart={(e) => !isGridCanvasMode && onDragStart?.(e, index)}
      onDragOver={(e) => !isGridCanvasMode && onDragOver?.(e, index)}
      onDragEnd={(e) => !isGridCanvasMode && onDragEnd?.(e)}
      onDrop={(e) => !isGridCanvasMode && onDrop?.(e, index)}
    >
      {!isGridCanvasMode && (
        <CellInsertZone index={index} onAdd={(type) => onAddCell(index, type)} />
      )}

      {isRenderedMarkdown ? (
        <div
          onClick={() => onToggleCodeCollapse(cell.id)}
          className="group relative flex flex-col rounded-2xl p-4 cursor-pointer transition-all duration-200 min-h-0 min-w-0 h-auto bg-transparent hover:bg-[var(--cell-border-subtle)]"
          title="Click to edit Markdown"
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 z-20 bg-[var(--cell-bg-floating-toolbar)] backdrop-blur-md p-1 rounded-full shadow-[var(--cell-shadow-float)]">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(cell.code);
                onCopyCellCode(cell.id);
              }}
              title="Copy Markdown"
              sx={CELL_MUI_STYLES.circularIconButton}
            >
              {copiedCellCodeId === cell.id ? (
                <span className="text-[8px] font-sans font-bold uppercase">Done</span>
              ) : (
                <ContentCopy sx={{ fontSize: 15 }} />
              )}
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCodeCollapse(cell.id);
              }}
              title="Edit Cell"
              sx={CELL_MUI_STYLES.circularIconButton}
            >
              <Edit sx={{ fontSize: 15 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(cell.id);
              }}
              title="Delete Cell"
              sx={{
                ...CELL_MUI_STYLES.circularIconButton,
                "&:hover": {
                  backgroundColor: "var(--cell-accent-red)",
                  color: "var(--nb-text-primary)",
                },
              }}
            >
              <Close sx={{ fontSize: 15 }} />
            </IconButton>
          </div>

          <div className={`flex gap-4 items-start grow min-h-0 ${isGridCanvasMode ? "overflow-y-auto" : ""}`}>
            <div className="grow min-w-0">
              <MarkdownRenderer text={cell.code} />
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={() => onSelectCell?.(cell.id)}
          className={`group/cell relative flex flex-col rounded-2xl px-4 pt-4 pb-8 transition-all duration-200 min-h-0 min-w-0 ${isGridCanvasMode ? "h-full overflow-hidden" : "h-auto"
            } ${isActive
              ? "bg-[var(--cell-bg-active)] shadow-[var(--cell-shadow-active-aura)] border border-[rgba(var(--rgb-blue),0.45)]"
              : "bg-[var(--cell-bg-base)] hover:bg-[var(--cell-bg-hover)] border border-transparent"
            }`}
        >
          {/* Top Meta Bar */}
          <div className="flex justify-between items-center mb-3 select-none pl-1">
            <div className="flex items-center gap-2">
              {isGridCanvasMode && (
                <span
                  onPointerDown={handleMovePointerDown}
                  className="cursor-grab active:cursor-grabbing text-[var(--nb-text-muted)] hover:text-[var(--nb-text-secondary)] transition-colors flex items-center touch-none select-none"
                  title="Drag to move cell on grid"
                >
                  <DragIndicator sx={{ fontSize: 16 }} />
                </span>
              )}
              <span className="text-[11px] font-mono font-medium text-[var(--nb-text-muted)] select-none">
                [{index + 1}]
              </span>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-sans font-medium tracking-wide bg-[var(--nb-bg-hover)] text-[var(--nb-text-heading)] select-none">
                {cell.type === "markdown" ? "Markdown" : cell.type === "jsx" ? "Visual" : "Code"}
              </span>

              {/* Separate Position and Dimensions Tabs (Matching Code tag style) */}
              {isGridCanvasMode && currentLayout && (
                <>
                  <button
                    ref={positionTabRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePanelTab(activePanelTab === "position" ? null : "position");
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-medium tracking-wide transition-colors cursor-pointer border-0 select-none flex items-center gap-1.5 ${isMoving
                        ? "bg-[var(--panel-nav-accent)] text-black shadow-[0_0_12px_rgba(var(--rgb-blue),0.5)] font-semibold"
                        : activePanelTab === "position"
                          ? "bg-[var(--panel-nav-accent)] text-black font-semibold"
                          : "bg-[var(--nb-bg-hover)] text-[var(--nb-text-heading)] hover:bg-[var(--cell-badge-hover)] hover:text-white"
                      }`}
                    title="Click to edit grid position (X, Y, Z)"
                  >
                    <span>x:{currentLayout.x}</span>
                    <span>y:{currentLayout.y}</span>
                    <span>z:{currentLayout.z ?? 1}</span>
                  </button>

                  <button
                    ref={dimensionsTabRef}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePanelTab(activePanelTab === "size" ? null : "size");
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-medium tracking-wide transition-colors cursor-pointer border-0 select-none flex items-center gap-1.5 ${isResizing
                        ? "bg-[var(--panel-nav-accent)] text-black shadow-[0_0_12px_rgba(var(--rgb-blue),0.5)] font-semibold"
                        : activePanelTab === "size"
                          ? "bg-[var(--panel-nav-accent)] text-black font-semibold"
                          : "bg-[var(--nb-bg-hover)] text-[var(--nb-text-heading)] hover:bg-[var(--cell-badge-hover)] hover:text-white"
                      }`}
                    title="Click to edit cell dimensions (Width, Height)"
                  >
                    <span>w:{currentLayout.w}</span>
                    <span>×</span>
                    <span>h:{currentLayout.h}</span>
                  </button>
                </>
              )}
            </div>

            {/* Ghost Actions */}
            <div className="flex items-center gap-1.5 opacity-70 group-hover/cell:opacity-100 transition-opacity">
              {cell.type === "markdown" && !cell.isCodeCollapsed && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCodeCollapse(cell.id);
                  }}
                  title="Render Markdown"
                  sx={CELL_MUI_STYLES.circularIconButton}
                >
                  <Check sx={{ fontSize: 16 }} />
                </IconButton>
              )}

              {isGridCanvasMode && onUpdateLayout && currentLayout && (
                <PanelNavigation
                  isOpen={activePanelTab !== null}
                  onClose={() => setActivePanelTab(null)}
                  anchorEl={activePanelTab === "size" ? dimensionsTabRef.current : positionTabRef.current}
                  placement="bottom-start"
                  initialItemId={activePanelTab}
                  title="Cell Layout Settings"
                  items={[
                    {
                      id: "position",
                      label: "Grid Position (X, Y, Z)",
                      value: `${currentLayout.x}, ${currentLayout.y}, ${currentLayout.z ?? 1}`,
                      subPanel: (
                        <div className="flex flex-col gap-2.5 p-1 select-none">
                          {[
                            {
                              label: "Column (X)",
                              val: currentLayout.x,
                              min: 0,
                              max: Math.max(0, (gridConfig?.columns ?? 12) - currentLayout.w),
                              onChange: (v: number) => onUpdateLayout(cell.id, { x: v }),
                            },
                            {
                              label: "Row (Y)",
                              val: currentLayout.y,
                              min: 0,
                              max: Math.max(0, (gridConfig?.rows ?? 24) - currentLayout.h),
                              onChange: (v: number) => onUpdateLayout(cell.id, { y: v }),
                            },
                            {
                              label: "Layer (Z)",
                              val: currentLayout.z ?? 1,
                              min: 0,
                              max: 100,
                              isAccent: true,
                              onChange: (v: number) => onUpdateLayout(cell.id, { z: v }),
                            },
                          ].map((field) => (
                            <div
                              key={field.label}
                              className="flex items-center justify-between py-1 px-2 rounded-lg bg-[var(--nb-bg-hover)] border border-[var(--nb-border-default)]"
                            >
                              <span className={`text-[12px] font-medium ${field.isAccent ? "text-amber-400" : "text-[var(--nb-text-secondary)]"}`}>
                                {field.label}
                              </span>
                              <NumericStepper
                                val={field.val}
                                min={field.min}
                                max={field.max}
                                onChange={field.onChange}
                              />
                            </div>
                          ))}
                        </div>
                      ),
                    },
                    {
                      id: "size",
                      label: "Dimensions (W, H)",
                      value: `${currentLayout.w} × ${currentLayout.h}`,
                      subPanel: (
                        <div className="flex flex-col gap-2.5 p-1 select-none">
                          {[
                            {
                              label: "Width (Cols)",
                              val: currentLayout.w,
                              min: 1,
                              max: Math.max(1, (gridConfig?.columns ?? 12) - currentLayout.x),
                              onChange: (v: number) => onUpdateLayout(cell.id, { w: v }),
                            },
                            {
                              label: "Height (Rows)",
                              val: currentLayout.h,
                              min: 1,
                              max: Math.max(1, (gridConfig?.rows ?? 24) - currentLayout.y),
                              onChange: (v: number) => onUpdateLayout(cell.id, { h: v }),
                            },
                          ].map((field) => (
                            <div
                              key={field.label}
                              className="flex items-center justify-between py-1 px-2 rounded-lg bg-[var(--nb-bg-hover)] border border-[var(--nb-border-default)]"
                            >
                              <span className="text-[12px] font-medium text-[var(--nb-text-secondary)]">
                                {field.label}
                              </span>
                              <NumericStepper
                                val={field.val}
                                min={field.min}
                                max={field.max}
                                onChange={field.onChange}
                              />
                            </div>
                          ))}
                        </div>
                      ),
                    },
                  ]}
                />
              )}

              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCodeCollapse(cell.id);
                }}
                title={cell.isCodeCollapsed ? "Expand Cell" : "Collapse Cell"}
                sx={CELL_MUI_STYLES.circularIconButton}
              >
                {cell.isCodeCollapsed ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
              </IconButton>
              {!isGridCanvasMode && (
                <>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveUp(index);
                    }}
                    disabled={index === 0}
                    title="Move Up"
                    sx={CELL_MUI_STYLES.circularIconButton}
                  >
                    <KeyboardArrowUp sx={{ fontSize: 17 }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveDown(index);
                    }}
                    disabled={index === totalCells - 1}
                    title="Move Down"
                    sx={CELL_MUI_STYLES.circularIconButton}
                  >
                    <KeyboardArrowDown sx={{ fontSize: 17 }} />
                  </IconButton>
                </>
              )}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(cell.id);
                }}
                title="Delete Cell"
                sx={{
                  ...CELL_MUI_STYLES.circularIconButton,
                  "&:hover": {
                    backgroundColor: "var(--cell-accent-red)",
                    color: "var(--nb-text-primary)",
                  },
                }}
              >
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </div>
          </div>

          {/* Cell Body & Execution Action */}
          <div className="flex gap-3.5 items-stretch pl-1 grow min-h-0 min-w-0 overflow-hidden">
            {(cell.type === "code" || cell.type === "jsx") && (
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
                  {/* YouTube Music Smooth Play/Pause Transition */}
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="overflow-visible"
                  >
                    {/* Left Bar / Left half of triangle */}
                    <path
                      d={
                        cell.timeTaken === "..."
                          ? "M6 5 L10 5 L10 19 L6 19 Z"
                          : "M8 5 L13 8.5 L13 15.5 L8 19 Z"
                      }
                      className="transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center"
                    />
                    {/* Right Bar / Right half of triangle */}
                    <path
                      d={
                        cell.timeTaken === "..."
                          ? "M14 5 L18 5 L18 19 L14 19 Z"
                          : "M13 8.5 L19 12 L19 12 L13 15.5 Z"
                      }
                      className="transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center"
                    />
                  </svg>
                </IconButton>
                {cell.timeTaken && cell.timeTaken !== "..." && (
                  <span
                    className={`text-[9px] font-mono font-medium tracking-tight text-center truncate max-w-full select-none ${cell.error ? "text-rose-400/80" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    title={cell.error ? `Failed in ${cell.timeTaken}` : `Executed in ${cell.timeTaken}`}
                  >
                    {cell.timeTaken}
                  </span>
                )}
              </div>
            )}

            <div className={`grow flex flex-col min-w-0 min-h-0 ${isGridCanvasMode ? "h-full overflow-hidden" : "h-auto"} pr-1`}>
              {!cell.isCodeCollapsed ? (
                <div
                  style={{
                    height:
                      isGridCanvasMode && currentLayout
                        ? cell.output || cell.logs?.length || cell.error
                          ? "45%"
                          : "100%"
                        : `${Math.max(75, Math.min(500, cell.code.split("\n").length * 19 + 24))}px`,
                    minHeight: isGridCanvasMode ? "60px" : "75px",
                    maxHeight: isGridCanvasMode ? "100%" : undefined,
                  }}
                  className="relative rounded-xl bg-[var(--nb-bg-code)] py-2.5 group/editor overflow-hidden shrink-0 flex flex-col"
                >
                  <div className="w-full h-full min-h-0 min-w-0 grow">
                    <Editor
                      height="100%"
                      language={cell.type === "markdown" ? "markdown" : "javascript"}
                      theme="dfnb-dark"
                      beforeMount={defineMonacoTheme}
                      onMount={(editor, monaco) => {
                        editor.onDidFocusEditorText(() => {
                          onSelectCell?.(cellIdRef.current);
                        });
                        registerCellKeyboardShortcuts({
                          editor,
                          monaco,
                          getCellId: () => cellIdRef.current,
                          getIndex: () => indexRef.current,
                          getTotalCells: () => totalCellsRef.current,
                          onRun: (id) => onRunRef.current(id),
                          onAddCell: (idx, type) => onAddCellRef.current(idx, type),
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
                          handleMouseWheel: true,
                        },
                        renderLineHighlight: "none",
                        overviewRulerBorder: false,
                        hideCursorInOverviewRuler: true,
                      }}
                    />
                  </div>

                  <Button
                    variant="contained"
                    disableElevation
                    size="small"
                    onClick={(e) => {
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

                  <span className="absolute bottom-2.5 right-3.5 z-20 text-[9px] font-sans text-[var(--cell-text-tag)] font-medium tracking-widest select-none pointer-events-none uppercase">
                    {cell.type === "markdown" ? "Markdown" : cell.type === "jsx" ? "Visual JSX" : "JavaScript"}
                  </span>
                </div>
              ) : (
                <div
                  onDoubleClick={() => onToggleCodeCollapse(cell.id)}
                  className="bg-[var(--nb-bg-code)] hover:bg-[var(--cell-bg-code-hover)] p-3.5 rounded-xl select-text min-h-10 cursor-pointer transition-colors duration-150 shrink-0"
                  title="Double click to edit cell"
                >
                  {cell.type === "markdown" ? (
                    <MarkdownRenderer text={cell.code} />
                  ) : (
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
                  )}
                </div>
              )}

              <div className="min-h-0 grow overflow-y-auto">
                <CellOutput
                  cell={cell}
                  onToggleOutputCollapse={onToggleOutputCollapse}
                  copiedCellId={copiedCellId}
                  onCopyCell={onCopyCell}
                />
              </div>
            </div>
          </div>

          {/* Cell Container Footer (Aligned with Resize Arrow) */}
          {(cell.type === "code" || cell.type === "jsx") && (
            <div className="absolute bottom-1.5 left-4 right-8 z-20 flex items-center gap-2.5 text-[9.5px] font-mono text-zinc-500 opacity-40 hover:opacity-90 transition-opacity select-none pointer-events-auto">
              <span className="flex items-center gap-1 text-zinc-400">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-300 font-semibold text-[9px]">Ctrl+Enter</kbd>
                <span>run</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-zinc-400">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-300 font-semibold text-[9px]">Shift+Enter</kbd>
                <span>run & next</span>
              </span>
              <span className="text-zinc-600">•</span>
              <span className="flex items-center gap-1 text-zinc-400">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-zinc-300 font-semibold text-[9px]">Alt+Enter</kbd>
                <span>run & insert</span>
              </span>
            </div>
          )}
        </div>
      )}

      {/* Resize Handle */}
      {isGridCanvasMode && onUpdateLayout && (
        <div
          onPointerDown={handleResizePointerDown}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 opacity-40 hover:opacity-100 group-hover:opacity-90 transition-opacity select-none touch-none z-30 text-[var(--nb-text-muted)] hover:text-[var(--nb-text-primary)]"
          title="Drag corner to resize cell dimensions"
        >
          <SouthEast sx={{ fontSize: 13 }} />
        </div>
      )}
    </div>
  );
}
