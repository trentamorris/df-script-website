import React from "react";
import { CellLayout, PageGridConfig } from "../../../types";
import { CellProps } from "./types";

export const CELL_MUI_STYLES = {
  // Category Pill Buttons (Insert zone, expand code, etc.)
  chipButton: {
    textTransform: "none" as const,
    fontWeight: 500,
    fontSize: "0.78rem",
    fontFamily: "inherit",
    borderRadius: "8px",
    padding: "3px 12px",
    minWidth: "auto",
    lineHeight: 1.5,
    backgroundColor: "var(--nb-bg-hover)",
    color: "var(--nb-text-heading)",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "var(--cell-bg-chip-hover)",
      color: "var(--cell-text-dark)",
      boxShadow: "none",
    },
  },

  // Tiny Action Pill (e.g., Copy Code / Copy Error)
  miniPillButton: {
    textTransform: "uppercase" as const,
    fontSize: "0.65rem",
    fontWeight: 600,
    borderRadius: "9999px",
    padding: "2px 10px",
    minWidth: "auto",
    backgroundColor: "var(--nb-bg-hover)",
    color: "var(--nb-text-secondary)",
    boxShadow: "none",
    "&:hover": {
      backgroundColor: "var(--cell-bg-chip-hover)",
      color: "var(--cell-text-dark)",
      boxShadow: "none",
    },
  },

  // Circular Ghost Icon Buttons (Up, Down, Visibility, Delete)
  circularIconButton: {
    width: 28,
    height: 28,
    borderRadius: "9999px",
    backgroundColor: "var(--nb-bg-hover)",
    color: "var(--nb-text-heading)",
    transition: "all 0.15s ease",
    "&:hover": {
      backgroundColor: "var(--cell-bg-chip-hover)",
      color: "var(--cell-text-dark)",
    },
    "&.Mui-disabled": {
      opacity: 0.25,
      color: "var(--nb-text-subtle)",
      backgroundColor: "var(--cell-border-subtle)",
    },
  },

  // Primary Run Play Button (Matching Tag Button Chip Style, Flat, Seamless)
  playButton: {
    width: 44,
    height: 44,
    borderRadius: "9999px",
    backgroundColor: "var(--cell-play-bg)",
    border: "none",
    color: "var(--cell-play-fg)",
    boxShadow: "none",
    transition: "all 0.18s ease",
    "&:hover": {
      backgroundColor: "var(--cell-play-hover)",
      color: "var(--nb-text-primary)",
      transform: "scale(1.04)",
    },
    "&:active": {
      transform: "scale(0.96)",
    },
    "&.Mui-disabled": {
      opacity: 0.5,
      color: "var(--nb-text-muted)",
    },
  },
};

/**
 * Returns dynamic MUI sx overrides for the flat play/pause button states.
 * No rings or borders around the button.
 */
export function getPlayButtonStyle(
  hasRun: boolean,
  timeTaken: string | null,
  error: string | null
): Record<string, any> {
  return {};
}

/**
 * Computes gridColumn and gridRow CSS strings for 2D canvas positioning.
 */
export function calculateGridStyle(
  isGridCanvasMode?: boolean,
  layout?: CellLayout | null
): React.CSSProperties | undefined {
  if (!isGridCanvasMode || !layout) return undefined;
  return {
    gridColumn: `${layout.x + 1} / span ${Math.max(1, layout.w)}`,
    gridRow: `${layout.y + 1} / span ${Math.max(1, layout.h)}`,
    zIndex: layout.z ?? 1,
  };
}

/**
 * Returns the status dot class for the subtle status LED next to the cell index.
 */
export function getStatusDotClass(
  hasRun: boolean,
  timeTaken: string | null,
  error: string | null
): string {
  if (timeTaken === "...") {
    return "bg-[var(--cell-accent-blue)] shadow-[var(--cell-glow-blue)] animate-pulse";
  }
  if (error) {
    return "bg-[var(--cell-accent-rose)] shadow-[var(--cell-glow-rose)]";
  }
  if (hasRun) {
    return "bg-[var(--cell-accent-green)] shadow-[var(--cell-glow-green)]";
  }
  return "bg-zinc-600/70";
}

/**
 * Returns the status accent bar class for YouTube Music aesthetic indicator.
 */
export function getAccentBarClass(
  hasRun: boolean,
  isActive: boolean,
  timeTaken: string | null,
  error: string | null
): string {
  if (timeTaken === "...") {
    return "bg-[var(--cell-accent-blue)] shadow-[var(--cell-glow-blue)] animate-pulse";
  }
  if (error) {
    return "bg-[var(--cell-accent-rose)] shadow-[var(--cell-glow-rose)]";
  }
  if (hasRun) {
    return "bg-[var(--cell-accent-green)] shadow-[var(--cell-glow-green)]";
  }
  if (isActive) {
    return "bg-[var(--panel-nav-accent)]";
  }
  return "bg-transparent";
}

/**
 * Registers the custom Dark Monaco theme for notebook code editing.
 */
export function defineMonacoTheme(monaco: any): void {
  monaco.editor.defineTheme("dfnb-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#050505",
      "editor.lineHighlightBackground": "#111111",
      "editorGutter.background": "#050505",
      "scrollbar.shadow": "#00000000",
      "scrollbarSlider.background": "#ffffff14",
      "scrollbarSlider.hoverBackground": "#ffffff26",
      "scrollbarSlider.activeBackground": "#ffffff38",
    },
  });
}

/**
 * Calculates column step and row step in pixels based on container width and grid config.
 */
export function calculateGridSteps(gridWidth: number, totalCols: number, rowHeight: number, gapPx: number) {
  const colStepPx = Math.max(15, (gridWidth - (totalCols - 1) * gapPx) / totalCols) + gapPx;
  const rowStepPx = rowHeight + gapPx;
  return { colStepPx, rowStepPx };
}

/**
 * Calculates bounded 2D cell grid position (x, y) from cursor coordinates and offsets.
 */
export function calculateCellMoveCoordinates(params: {
  clientX: number;
  clientY: number;
  gridRect: DOMRect;
  scrollLeft: number;
  scrollTop: number;
  grabOffsetX: number;
  grabOffsetY: number;
  colStepPx: number;
  rowStepPx: number;
  totalCols: number;
  totalRows: number;
  cellW: number;
  cellH: number;
}): { x: number; y: number } {
  const {
    clientX, clientY, gridRect, scrollLeft, scrollTop,
    grabOffsetX, grabOffsetY, colStepPx, rowStepPx,
    totalCols, totalRows, cellW, cellH,
  } = params;

  const relativeX = clientX - gridRect.left + scrollLeft - grabOffsetX;
  const relativeY = clientY - gridRect.top + scrollTop - grabOffsetY;

  const rawGridX = Math.round(relativeX / colStepPx);
  const rawGridY = Math.round(relativeY / rowStepPx);

  const maxX = Math.max(0, totalCols - cellW);
  const maxY = Math.max(0, totalRows - cellH);

  return {
    x: Math.min(maxX, Math.max(0, rawGridX)),
    y: Math.min(maxY, Math.max(0, rawGridY)),
  };
}

/**
 * Calculates bounded 2D cell grid size (w, h) from cursor coordinates and cell origin.
 */
export function calculateCellResizeDimensions(params: {
  clientX: number;
  clientY: number;
  gridRect: DOMRect;
  scrollLeft: number;
  scrollTop: number;
  originX: number;
  originY: number;
  colStepPx: number;
  rowStepPx: number;
  totalCols: number;
}): { w: number; h: number } {
  const {
    clientX, clientY, gridRect, scrollLeft, scrollTop,
    originX, originY, colStepPx, rowStepPx, totalCols,
  } = params;

  const cellLeft = gridRect.left - scrollLeft + originX * colStepPx;
  const cellTop = gridRect.top - scrollTop + originY * rowStepPx;

  const rawGridW = Math.round((clientX - cellLeft) / colStepPx);
  const rawGridH = Math.round((clientY - cellTop) / rowStepPx);

  const maxW = totalCols - originX;

  return {
    w: Math.min(maxW, Math.max(1, rawGridW)),
    h: Math.min(100, Math.max(1, rawGridH)),
  };
}

