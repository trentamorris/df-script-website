import React from "react";
import { RotateLeft } from "@mui/icons-material";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellResetButton() {
  const { cell, onClearOutput, keybindings } = useCellContext();

  const isEnabled = Boolean(cell.output || cell.logs?.length || cell.error || cell.timeTaken);
  const clearShortcut = keybindings?.["notebook.cell.clearOutput"];
  const title = clearShortcut ? `Clear Cell Output (${clearShortcut})` : "Clear Cell Output";

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onClearOutput?.(cell.id);
      }}
      disabled={!isEnabled}
      title={title}
      className={`!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center ${
        !isEnabled ? "opacity-30 pointer-events-none" : ""
      }`}
    >
      <RotateLeft sx={{ fontSize: 15 }} />
    </Chip>
  );
}
