import React from "react";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellMoveUpButton() {
  const { index, isGridCanvasMode, onMoveUp, keybindings } = useCellContext();

  if (isGridCanvasMode) return null;

  const moveUpShortcut = keybindings?.["notebook.cell.moveUp"];
  const title = moveUpShortcut ? `Move Up (${moveUpShortcut})` : "Move Up";

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onMoveUp(index);
      }}
      disabled={index === 0}
      title={title}
      className={`!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center ${
        index === 0 ? "opacity-30 pointer-events-none" : ""
      }`}
    >
      <KeyboardArrowUp sx={{ fontSize: 16 }} />
    </Chip>
  );
}

export function CellMoveDownButton() {
  const { index, totalCells, isGridCanvasMode, onMoveDown, keybindings } = useCellContext();

  if (isGridCanvasMode) return null;

  const moveDownShortcut = keybindings?.["notebook.cell.moveDown"];
  const title = moveDownShortcut ? `Move Down (${moveDownShortcut})` : "Move Down";

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onMoveDown(index);
      }}
      disabled={index === totalCells - 1}
      title={title}
      className={`!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center ${
        index === totalCells - 1 ? "opacity-30 pointer-events-none" : ""
      }`}
    >
      <KeyboardArrowDown sx={{ fontSize: 16 }} />
    </Chip>
  );
}

export function CellReorderButtons() {
  const { isGridCanvasMode } = useCellContext();

  if (isGridCanvasMode) return null;

  return (
    <>
      <CellMoveUpButton />
      <CellMoveDownButton />
    </>
  );
}
