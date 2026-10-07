import React from "react";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellTypeChip() {
  const { cell, onChangeCellType, keybindings } = useCellContext();

  const isMarkdown = cell.type === "markdown";
  const nextType = isMarkdown ? "code" : "markdown";
  const shortcut = isMarkdown
    ? keybindings?.["notebook.cell.changeToCode"]
    : keybindings?.["notebook.cell.changeToMarkdown"];
  const title = isMarkdown
    ? shortcut
      ? `Change Cell to Code (${shortcut})`
      : "Change Cell to Code"
    : shortcut
      ? `Change Cell to Markdown (${shortcut})`
      : "Change Cell to Markdown";

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onChangeCellType?.(cell.id, nextType);
      }}
      title={title}
      className="!h-7 !px-2.5 !rounded-md !text-[11px] !font-medium tracking-wide select-none cursor-pointer hover:!bg-[var(--cell-badge-hover)] hover:!text-[var(--nb-text-primary)]"
    >
      {isMarkdown ? "Markdown" : "Code"}
    </Chip>
  );
}
