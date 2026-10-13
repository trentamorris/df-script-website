import React from "react";
import { ViewColumnOutlined, ViewStreamOutlined } from "@mui/icons-material";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellSplitOrientationButton() {
  const { cell, onToggleSplitOrientation } = useCellContext();

  // Only relevant for code cells that have output
  if (cell.type !== "code") return null;

  const isHorizontal = cell.splitOrientation === "horizontal";

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleSplitOrientation?.(cell.id);
      }}
      title={
        isHorizontal
          ? "Switch to vertically stacked layout"
          : "Switch to side-by-side layout"
      }
      className="!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center"
    >
      {isHorizontal ? (
        <ViewStreamOutlined sx={{ fontSize: 16 }} />
      ) : (
        <ViewColumnOutlined sx={{ fontSize: 16 }} />
      )}
    </Chip>
  );
}
