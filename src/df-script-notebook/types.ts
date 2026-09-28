export type CellWidth = "full" | "half";
export type CellType = "code" | "markdown" | "jsx";
export type LayoutMode = "document" | "canvas";

export interface CellLayout {
  x: number; // 0-indexed column
  y: number; // 0-indexed row
  w: number; // column span (e.g. 1 to cols)
  h: number; // row span (e.g. 1 to rows)
  z?: number; // z-index layer
}

export interface CellState {
  id: string;
  type: CellType;
  code: string;
  output: any;
  error: string | null;
  timeTaken: string | null;
  execIndex: number | null;
  width?: CellWidth;
  layout?: CellLayout;
  logs?: string[];
  metadata?: Record<string, any>;
  isCodeCollapsed?: boolean;
  isOutputCollapsed?: boolean;
}

export interface PageGridConfig {
  columns: number;
  rows: number;
  rowHeight: number; // in pixels, default 48px
  showGridLines: boolean;
}

export interface NotebookPage {
  id: string;
  title: string;
  cellIds: string[];
  layoutMode?: LayoutMode;
  gridConfig?: PageGridConfig;
}

export interface NotebookFile {
  name: string;
  cells: CellState[];
  pages?: NotebookPage[];
  activePageId?: string;
}
