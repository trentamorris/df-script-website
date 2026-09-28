import React from "react";
import Editor from "@monaco-editor/react";
import { Button, IconButton } from "@mui/material";
import {
  PlayArrow,
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
import {
  CELL_MUI_STYLES,
  calculateGridStyle,
  getAccentBarClass,
  defineMonacoTheme,
} from "./utils";
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
  onUpdateLayout,
  onDragStart,
  onDragOver,
  onDrop,
  isGridCanvasMode,
  gridConfig,
  onInteractionChange,
}: CellProps) {
  const [isResizing, setIsResizing] = React.useState(false);
  const [isMoving, setIsMoving] = React.useState(false);
  const [activePanelTab, setActivePanelTab] = React.useState<"position" | "size" | null>(null);
  const [liveLayout, setLiveLayout] = React.useState<import("../../../types").CellLayout | null>(null);
  const cellRef = React.useRef<HTMLDivElement>(null);
  const positionTabRef = React.useRef<HTMLButtonElement>(null);
  const dimensionsTabRef = React.useRef<HTMLButtonElement>(null);

  const hasRun = cell.execIndex !== null || cell.timeTaken !== null;
  const currentLayout = liveLayout || cell.layout;
  const gridStyle = calculateGridStyle(isGridCanvasMode, currentLayout);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    onInteractionChange?.(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const baseLayout = cell.layout ?? { x: 0, y: 0, w: 12, h: 6 };
    const initialW = baseLayout.w;
    const initialH = baseLayout.h;

    const parent = cellRef.current?.parentElement;
    const parentWidth = parent ? parent.clientWidth : 1000;
    const totalCols = gridConfig?.columns ?? 12;
    const gapPx = 12;
    const colWidthPx = Math.max(15, (parentWidth - (totalCols - 1) * gapPx) / totalCols);
    const rowStepPx = (gridConfig?.rowHeight ?? 48) + gapPx;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Auto-scroll when near boundaries
      const scrollableParent = cellRef.current?.closest(".overflow-x-auto") || cellRef.current?.closest("#df-script-notebook");
      if (scrollableParent) {
        const bounds = scrollableParent.getBoundingClientRect();
        const edgeThreshold = 40;
        const scrollSpeed = 12;
        if (moveEvent.clientX > bounds.right - edgeThreshold) {
          scrollableParent.scrollLeft += scrollSpeed;
        } else if (moveEvent.clientX < bounds.left + edgeThreshold) {
          scrollableParent.scrollLeft -= scrollSpeed;
        }
        if (moveEvent.clientY > bounds.bottom - edgeThreshold) {
          scrollableParent.scrollTop += scrollSpeed;
        } else if (moveEvent.clientY < bounds.top + edgeThreshold) {
          scrollableParent.scrollTop -= scrollSpeed;
        }
      }

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const unitWDelta = Math.round(deltaX / (colWidthPx + gapPx));
      const unitHDelta = Math.round(deltaY / rowStepPx);

      const maxColsForCell = totalCols - baseLayout.x;
      const newW = Math.max(1, Math.min(maxColsForCell, initialW + unitWDelta));
      const newH = Math.max(1, Math.min(100, initialH + unitHDelta));

      const updated = { ...baseLayout, w: newW, h: newH };
      setLiveLayout(updated);
      onUpdateLayout?.(cell.id, { w: newW, h: newH });
    };

    const onMouseUp = () => {
      setIsResizing(false);
      setLiveLayout(null);
      onInteractionChange?.(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleMoveStart = (e: React.MouseEvent) => {
    if (!isGridCanvasMode || !onUpdateLayout) return;
    e.preventDefault();
    e.stopPropagation();
    setIsMoving(true);
    onInteractionChange?.(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const baseLayout = cell.layout ?? { x: 0, y: 0, w: 12, h: 6 };
    const initialX = baseLayout.x;
    const initialY = baseLayout.y;

    const parent = cellRef.current?.parentElement;
    const parentWidth = parent ? parent.clientWidth : 1000;
    const totalCols = gridConfig?.columns ?? 12;
    const totalRows = gridConfig?.rows ?? 24;
    const gapPx = 12;
    const colStepPx = Math.max(15, (parentWidth - (totalCols - 1) * gapPx) / totalCols) + gapPx;
    const rowStepPx = (gridConfig?.rowHeight ?? 48) + gapPx;

    const onMouseMove = (moveEvent: MouseEvent) => {
      // Auto-scroll when dragging near edges of the canvas scroll container
      const scrollableParent = cellRef.current?.closest(".overflow-x-auto") || cellRef.current?.closest("#df-script-notebook");
      if (scrollableParent) {
        const bounds = scrollableParent.getBoundingClientRect();
        const edgeThreshold = 40;
        const scrollSpeed = 12;
        if (moveEvent.clientX > bounds.right - edgeThreshold) {
          scrollableParent.scrollLeft += scrollSpeed;
        } else if (moveEvent.clientX < bounds.left + edgeThreshold) {
          scrollableParent.scrollLeft -= scrollSpeed;
        }
        if (moveEvent.clientY > bounds.bottom - edgeThreshold) {
          scrollableParent.scrollTop += scrollSpeed;
        } else if (moveEvent.clientY < bounds.top + edgeThreshold) {
          scrollableParent.scrollTop -= scrollSpeed;
        }
      }

      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const unitXDelta = Math.round(deltaX / colStepPx);
      const unitYDelta = Math.round(deltaY / rowStepPx);

      const maxX = Math.max(0, totalCols - baseLayout.w);
      const maxY = Math.max(0, totalRows - baseLayout.h);
      const newX = Math.max(0, Math.min(maxX, initialX + unitXDelta));
      const newY = Math.max(0, Math.min(maxY, initialY + unitYDelta));

      const updated = { ...baseLayout, x: newX, y: newY };
      setLiveLayout(updated);
      onUpdateLayout?.(cell.id, { x: newX, y: newY });
    };

    const onMouseUp = () => {
      setIsMoving(false);
      setLiveLayout(null);
      onInteractionChange?.(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const isRenderedMarkdown = !isGridCanvasMode && cell.type === "markdown" && cell.isCodeCollapsed;
  const accentBarClass = getAccentBarClass(hasRun, isActive, cell.timeTaken, cell.error);

  return (
    <div
      ref={cellRef}
      style={gridStyle}
      className={`relative flex flex-col w-full min-h-0 min-w-0 ${isGridCanvasMode ? "h-full" : "h-auto"}`}
      draggable={!isGridCanvasMode}
      onDragStart={(e) => !isGridCanvasMode && onDragStart?.(e, index)}
      onDragOver={(e) => !isGridCanvasMode && onDragOver?.(e, index)}
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
          className={`group/cell relative flex flex-col rounded-2xl p-4 transition-all duration-200 min-h-0 min-w-0 ${
            isGridCanvasMode ? "h-full overflow-hidden" : "h-auto"
          } ${
            isActive
              ? "bg-[var(--cell-bg-active)] shadow-[var(--cell-shadow-active)]"
              : "bg-[var(--cell-bg-base)] hover:bg-[var(--cell-bg-hover)]"
          }`}
        >
          {/* Edge Indicator */}
          <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-200 ${accentBarClass}`} />

          {/* Top Meta Bar */}
          <div className="flex justify-between items-center mb-3 select-none pl-2">
            <div className="flex items-center gap-2">
              {isGridCanvasMode && (
                <span
                  onMouseDown={handleMoveStart}
                  className="cursor-grab active:cursor-grabbing text-[var(--nb-text-muted)] hover:text-[var(--nb-text-secondary)] transition-colors flex items-center"
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
                    className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-medium tracking-wide transition-colors cursor-pointer border-0 select-none flex items-center gap-1.5 ${
                      isMoving
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
                    className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-medium tracking-wide transition-colors cursor-pointer border-0 select-none flex items-center gap-1.5 ${
                      isResizing
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
              {cell.timeTaken && cell.timeTaken !== "..." && (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-medium ${
                    cell.error
                      ? "bg-[var(--cell-bg-error-chip)] text-[var(--cell-text-error)]"
                      : "bg-[var(--cell-border-subtle)] text-[var(--nb-text-muted)]"
                  }`}
                >
                  {cell.timeTaken}
                </span>
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
              <div className="flex flex-col items-center justify-start select-none w-10 shrink-0 self-stretch py-1">
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onRun(cell.id);
                  }}
                  disabled={cell.timeTaken === "..."}
                  title="Run Cell (Ctrl + Enter)"
                  sx={CELL_MUI_STYLES.playButton}
                >
                  <PlayArrow sx={{ fontSize: 22, ml: "2px" }} />
                </IconButton>
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
        </div>
      )}

      {/* Resize Handle */}
      {isGridCanvasMode && onUpdateLayout && (
        <div
          onMouseDown={handleResizeStart}
          className="absolute bottom-1 right-1 w-4 h-4 cursor-se-resize flex items-end justify-end p-0.5 opacity-40 hover:opacity-100 group-hover:opacity-90 transition-opacity select-none z-30 text-[var(--nb-text-muted)] hover:text-[var(--nb-text-primary)]"
          title="Drag corner to resize cell dimensions"
        >
          <SouthEast sx={{ fontSize: 13 }} />
        </div>
      )}
    </div>
  );
}
