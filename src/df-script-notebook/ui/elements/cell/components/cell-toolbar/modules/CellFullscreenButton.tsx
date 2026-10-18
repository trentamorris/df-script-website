import React from "react";
import { OpenInFull, CloseFullscreen } from "@mui/icons-material";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";

export function CellFullscreenButton() {
  const { isFullscreen, onToggleFullscreen, keybindings } = useCellContext();
  const fullscreenShortcut = keybindings?.["notebook.cell.toggleFullscreen"];
  const tooltip = isFullscreen
    ? "Exit Fullscreen (Esc)"
    : fullscreenShortcut
      ? `Fullscreen (${fullscreenShortcut})`
      : "Fullscreen";

  return (
    <Chip
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFullscreen?.();
      }}
      title={tooltip}
      className={`!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center ${
        isFullscreen
          ? "!bg-[rgba(var(--rgb-blue),0.2)] !text-[rgb(var(--rgb-blue))] !border-[rgba(var(--rgb-blue),0.4)]"
          : ""
      }`}
    >
      {isFullscreen ? (
        <CloseFullscreen sx={{ fontSize: 15 }} />
      ) : (
        <OpenInFull sx={{ fontSize: 15 }} />
      )}
    </Chip>
  );
}
