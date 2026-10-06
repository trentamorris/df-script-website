import React from "react";
import { Undo, Redo } from "@mui/icons-material";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellUndoButton() {
  const { editorInstanceRef, onUndo } = useCellContext();

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        if (editorInstanceRef.current) {
          editorInstanceRef.current.trigger("toolbar", "undo", null);
          editorInstanceRef.current.focus();
        } else if (onUndo) {
          onUndo();
        }
      }}
      title="Undo inside cell"
      className="!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center"
    >
      <Undo sx={{ fontSize: 15 }} />
    </Chip>
  );
}

export function CellRedoButton() {
  const { editorInstanceRef, onRedo } = useCellContext();

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        if (editorInstanceRef.current) {
          editorInstanceRef.current.trigger("toolbar", "redo", null);
          editorInstanceRef.current.focus();
        } else if (onRedo) {
          onRedo();
        }
      }}
      title="Redo inside cell"
      className="!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center"
    >
      <Redo sx={{ fontSize: 15 }} />
    </Chip>
  );
}

export function CellHistoryButtons() {
  return (
    <>
      <CellUndoButton />
      <CellRedoButton />
    </>
  );
}
