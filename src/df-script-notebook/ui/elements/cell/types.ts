import { CellLayout, CellState, CellType, PageGridConfig } from "../../../types";

export interface CellProps {
  cell: CellState;
  index: number;
  isActive: boolean;
  totalCells: number;
  copiedCellId: string | null;
  copiedCellCodeId: string | null;
  onRun: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onToggleCodeCollapse: (id: string) => void;
  onToggleOutputCollapse: (id: string) => void;
  onUpdateCode: (id: string, code: string) => void;
  onAddCell: (index: number, type: CellType) => void;
  onSplitCell?: (index: number, beforeCode: string, afterCode: string) => void;
  onCopyCell: (id: string) => void;
  onCopyCellCode: (id: string) => void;
  onSelectCell?: (id: string) => void;
  onAdvanceCell?: (index: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUpdateLayout?: (id: string, layout: Partial<CellLayout>) => void;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  isGridCanvasMode?: boolean;
  gridConfig?: PageGridConfig;
  onInteractionChange?: (isInteracting: boolean) => void;
  onOpenCommands?: () => void;
}
