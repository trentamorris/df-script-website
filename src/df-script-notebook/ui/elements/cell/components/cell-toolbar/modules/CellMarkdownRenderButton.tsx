import React from "react";
import { Check } from "@mui/icons-material";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellMarkdownRenderButton() {
  const { cell, onToggleCodeCollapse } = useCellContext();

  if (cell.type !== "markdown" || cell.isCodeCollapsed) return null;

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleCodeCollapse(cell.id);
      }}
      title="Render Markdown"
      className="!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center"
    >
      <Check sx={{ fontSize: 16 }} />
    </Chip>
  );
}
