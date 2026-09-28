import { Button } from "@mui/material";
import { CELL_MUI_STYLES } from "../../utils";

const INSERT_BUTTONS = [
  { type: "code" as const, label: "+ Code" },
  { type: "jsx" as const, label: "+ Visual" },
  { type: "markdown" as const, label: "+ Text" },
];

export interface CellInsertZoneProps {
  index: number;
  onAdd: (type: "code" | "jsx" | "markdown") => void;
}

export default function CellInsertZone({ index, onAdd }: CellInsertZoneProps) {
  return (
    <div className="relative h-7 group flex items-center justify-center -my-3.5 z-30 select-none">
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[var(--cell-border-glass)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

      <div className="opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-200 flex items-center gap-1.5 bg-[var(--nb-bg-app)] backdrop-blur-md px-2 py-1 rounded-xl border border-[var(--cell-border-glass)] shadow-[var(--cell-shadow-insert)]">
        {INSERT_BUTTONS.map(({ type, label }) => (
          <Button
            key={type}
            variant="contained"
            disableElevation
            onClick={() => onAdd(type)}
            sx={CELL_MUI_STYLES.chipButton}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
