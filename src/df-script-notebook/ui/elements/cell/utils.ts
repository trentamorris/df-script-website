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
    backgroundColor: "var(--nb-bg-raised)",
    color: "var(--nb-text-secondary)",
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

  // Primary Run Play Button
  playButton: {
    width: 36,
    height: 36,
    borderRadius: "9999px",
    backgroundColor: "var(--nb-bg-hover)",
    color: "var(--nb-text-primary)",
    boxShadow: "var(--cell-shadow-play)",
    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
    "&:hover": {
      backgroundColor: "var(--cell-bg-chip-hover)",
      color: "var(--cell-text-dark)",
      transform: "scale(1.06)",
    },
    "&:active": {
      transform: "scale(0.96)",
    },
    "&.Mui-disabled": {
      opacity: 0.35,
      color: "var(--nb-text-muted)",
    },
  },
};

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
 * Returns the status accent bar class for YouTube Music aesthetic indicator.
 */
export function getAccentBarClass(
  hasRun: boolean,
  isActive: boolean,
  timeTaken: string | null,
  error: string | null
): string {
  if (timeTaken === "...") {
    return "bg-[var(--cell-accent-red)] shadow-[var(--cell-glow-red)]";
  }
  if (error) {
    return "bg-[var(--cell-accent-rose)] shadow-[var(--cell-glow-rose)]";
  }
  if (hasRun) {
    return "bg-[var(--cell-accent-executed)]";
  }
  if (isActive) {
    return "bg-[var(--cell-accent-red)]";
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
    },
  });
}
