import React from "react";

export interface ArticleNavSection {
  id: string;
  title: string;
  level: number;
}

export interface ArticleCanvasProps {
  /** Raw markdown content to render. When provided, automatically parses headings, code blocks, and sets up TOC */
  markdown?: string | null;
  /** Pre-extracted sections (if not using markdown or providing custom sections) */
  sections?: ArticleNavSection[];
  /** Whether to show the table of contents sidebar and mobile floating menu. Defaults to true when sections exist. */
  showToc?: boolean;
  /** React children rendered in place of or alongside markdown content */
  children?: React.ReactNode;
  /** Loading state displaying standard skeleton */
  isLoading?: boolean;
  /** Error message displaying standard error box */
  error?: string | null;
  /** Top header slot above the content */
  headerSlot?: React.ReactNode;
  /** Active documentation operation indicator for mobile navigation spacing */
  hasActiveDocOp?: boolean;
  /** Custom ref for container element */
  contentContainerRef?: React.RefObject<HTMLDivElement>;
  /** Optional class name */
  className?: string;
}
