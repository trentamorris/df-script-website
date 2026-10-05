import React from "react";
import { NotebookPage, PageGridConfig } from "../../../types";

export interface GridCanvasProps {
  gridConfig: PageGridConfig;
  isInteracting?: boolean;
  onInteractionChange?: (isInteracting: boolean) => void;
  gapPx?: number;
  paddingPx?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  // Canvas State & Handlers
  pages?: NotebookPage[];
  activePageId?: string;
  editingPageId?: string | null;
  showGridConfigModal?: boolean;
  onSelectPage?: (id: string) => void;
  onAddPage?: () => void;
  onDeletePage?: (id: string) => void;
  onRenamePage?: (id: string, newTitle: string) => void;
  onSetEditingPageId?: (id: string | null) => void;
  onToggleGridModal?: () => void;
  onUpdateGridConfig?: (config: Partial<PageGridConfig>) => void;
  slotProps?: {
    toolbar?: React.ComponentProps<"div">;
  };
  slots?: {
    toolbar?: React.ReactNode;
  };
}

export interface GridCanvasContextValue {
  gridConfig: PageGridConfig;
  isInteracting?: boolean;
  pages?: NotebookPage[];
  activePageId?: string;
  editingPageId?: string | null;
  showGridConfigModal?: boolean;
  onSelectPage?: (id: string) => void;
  onAddPage?: () => void;
  onDeletePage?: (id: string) => void;
  onRenamePage?: (id: string, newTitle: string) => void;
  onSetEditingPageId?: (id: string | null) => void;
  onToggleGridModal?: () => void;
  onUpdateGridConfig?: (config: Partial<PageGridConfig>) => void;
}
