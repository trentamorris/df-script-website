import { CellState } from "../../types";

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
  onAddCell: (index: number, type: "code" | "jsx" | "markdown") => void;
  onCopyCell: (id: string) => void;
  onCopyCellCode: (id: string) => void;
}
