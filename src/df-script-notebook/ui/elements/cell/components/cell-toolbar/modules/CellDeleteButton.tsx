import React from "react";
import { Close } from "@mui/icons-material";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellDeleteButton() {
  const { cell, onDelete, keybindings } = useCellContext();
  const deleteShortcut = keybindings?.["notebook.cell.delete"];
  const tooltip = deleteShortcut ? `Delete Cell (${deleteShortcut})` : "Delete Cell";

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(cell.id);
      }}
      title={tooltip}
      className="!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center hover:!bg-[var(--cell-accent-red)] hover:!text-white"
    >
      <Close sx={{ fontSize: 15 }} />
    </Chip>
  );
}
