import React from "react";
import { CellType, LayoutMode } from "../../../types";

export interface NotebookHeaderProps {
  notebookName: string;
  isEditingName: boolean;
  layoutMode: LayoutMode;
  onSetNotebookName: (name: string) => void;
  onSetIsEditingName: (editing: boolean) => void;
  onAddCell: (type: CellType) => void;
  onRunAll: () => void;
  onClearOutputs: () => void;
  onResetNotebook: () => void;
  onSaveNotebook: () => void;
  onTriggerLoadNotebook: () => void;
  onToggleLayoutMode: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  bindings?: Record<string, string>;
  onUpdateBinding?: (cmdId: string, binding: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isCommandsOpen?: boolean;
  onToggleCommands?: (anchorEl: HTMLElement | null) => void;
}

