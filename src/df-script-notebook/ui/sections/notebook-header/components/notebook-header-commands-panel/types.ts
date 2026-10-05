export interface NotebookHeaderCommandsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  bindings?: Record<string, string>;
  onUpdateBinding?: (cmdId: string, binding: string) => void;
}

