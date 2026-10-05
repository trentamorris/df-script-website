import React from "react";
import { NotebookPage, PageGridConfig } from "../../../../../types";

export interface GridCanvasToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export interface GridCanvasDimensionsFlyoutProps extends React.HTMLAttributes<HTMLDivElement> {
  gridConfig?: PageGridConfig;
  onUpdateGridConfig?: (config: Partial<PageGridConfig>) => void;
  show?: boolean;
}

export interface GridCanvasDimensionsButtonProps extends Omit<React.ComponentProps<"button">, "children"> {
  gridConfig?: PageGridConfig;
  active?: boolean;
  onToggle?: () => void;
  render?: (cols: number, rows: number) => React.ReactNode;
}

export interface GridCanvasPageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  pages?: NotebookPage[];
  activePageId?: string;
  editingPageId?: string | null;
  onSelectPage?: (id: string) => void;
  onRenamePage?: (id: string, newTitle: string) => void;
  onDeletePage?: (id: string) => void;
  onSetEditingPageId?: (id: string | null) => void;
  onAddPage?: () => void;
  showAddButton?: boolean;
  showNavigator?: boolean;
}
