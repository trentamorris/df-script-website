import React from "react";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellTypeChip() {
  const { cell } = useCellContext();

  return (
    <Chip className="!h-7 !px-2.5 !rounded-md !text-[11px] !font-medium tracking-wide pointer-events-none select-none">
      {cell.type === "markdown" ? "Markdown" : "Code"}
    </Chip>
  );
}
