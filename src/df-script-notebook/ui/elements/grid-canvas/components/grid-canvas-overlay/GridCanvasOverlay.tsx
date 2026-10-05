import React from "react";
import { GridCanvasOverlayProps } from "./types";
import { CrosshairIcon } from "../../../../../svgs";

export default function GridCanvasOverlay({
  cols,
  rows,
  rowHeight,
  gapPx,
  isInteracting,
}: GridCanvasOverlayProps) {
  const halfGap = `${gapPx / 2}px`;

  return (
    <div
      className={`absolute inset-0 p-3 pointer-events-none select-none transition-opacity duration-200 ${
        isInteracting ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, ${rowHeight}px)`,
        gridAutoRows: `${rowHeight}px`,
        gap: `${gapPx}px`,
      }}
    >
      {Array.from({ length: rows * cols }).map((_, i) => {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const isRightEdge = c === cols - 1;
        const isBottomEdge = r === rows - 1;

        return (
          <div key={i} className="relative w-full h-full pointer-events-none">
            {/* Top-Left Crosshair */}
            <CrosshairIcon
              style={{
                left: `-${halfGap}`,
                top: `-${halfGap}`,
                transform: "translate(-50%, -50%)",
              }}
            />

            {/* Top-Right Crosshair for final column */}
            {isRightEdge && (
              <CrosshairIcon
                style={{
                  right: `-${halfGap}`,
                  top: `-${halfGap}`,
                  transform: "translate(50%, -50%)",
                }}
              />
            )}

            {/* Bottom-Left Crosshair for final row */}
            {isBottomEdge && (
              <CrosshairIcon
                style={{
                  left: `-${halfGap}`,
                  bottom: `-${halfGap}`,
                  transform: "translate(-50%, 50%)",
                }}
              />
            )}

            {/* Bottom-Right Crosshair for outer corner */}
            {isRightEdge && isBottomEdge && (
              <CrosshairIcon
                style={{
                  right: `-${halfGap}`,
                  bottom: `-${halfGap}`,
                  transform: "translate(50%, 50%)",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
