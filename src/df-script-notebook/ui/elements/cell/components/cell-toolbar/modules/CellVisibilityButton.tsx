import React from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellVisibilityButton() {
  const { cell, onToggleCodeCollapse } = useCellContext();

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleCodeCollapse(cell.id);
      }}
      title={cell.isCodeCollapsed ? "Expand Cell" : "Collapse Cell"}
      className="!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center"
    >
      {cell.isCodeCollapsed ? <VisibilityOff sx={{ fontSize: 15 }} /> : <Visibility sx={{ fontSize: 15 }} />}
    </Chip>
  );
}
