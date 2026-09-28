import { NotebookPage, PageGridConfig } from "../../../types";

export interface CanvasPageBarProps {
  pages: NotebookPage[];
  activePageId: string;
  editingPageId: string | null;
  gridConfig: PageGridConfig;
  showGridConfigModal: boolean;
  onSelectPage: (id: string) => void;
  onAddPage: () => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, newTitle: string) => void;
  onSetEditingPageId: (id: string | null) => void;
  onToggleGridLines: () => void;
  onToggleGridModal: () => void;
  onUpdateGridConfig: (config: Partial<PageGridConfig>) => void;
}
