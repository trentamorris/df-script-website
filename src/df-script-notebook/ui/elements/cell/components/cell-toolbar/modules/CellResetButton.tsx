import React from "react";
import { RotateLeft } from "@mui/icons-material";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellResetButton() {
  const { cell, onClearOutput } = useCellContext();

  const isEnabled = Boolean(cell.output || cell.logs?.length || cell.error || cell.timeTaken);

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onClearOutput?.(cell.id);
      }}
      disabled={!isEnabled}
      title="Clear Cell Output"
      className={`!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center ${
        !isEnabled ? "opacity-30 pointer-events-none" : ""
      }`}
    >
      <RotateLeft sx={{ fontSize: 15 }} />
    </Chip>
  );
}
