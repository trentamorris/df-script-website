import React from "react";
import { CarouselDotsProps } from "./types";

const DEFAULT_MAX_VISIBLE = 5;

/**
 * Standalone CarouselDots element.
 * Renders a fixed window of dots (default 5) that scale progressively smaller
 * as distance from the active dot increases, with shrinking edge indicators.
 * Monochrome theme: active dot is pure white, inactive dots are neutral grays.
 */
export const CarouselDots: React.FC<CarouselDotsProps> = ({
  total,
  activeIndex,
  onSelect,
  maxVisible = DEFAULT_MAX_VISIBLE,
  className = "",
}) => {
  if (total <= 1) return null;

  const isSliding = total > maxVisible;

  // Compute sliding window start
  let windowStart = 0;
  if (isSliding) {
    if (activeIndex <= Math.floor(maxVisible / 2)) {
      windowStart = 0;
    } else if (activeIndex >= total - Math.ceil(maxVisible / 2)) {
      windowStart = total - maxVisible;
    } else {
      windowStart = activeIndex - Math.floor(maxVisible / 2);
    }
  }

  const visibleCount = isSliding ? maxVisible : total;
  const visibleIndices = Array.from({ length: visibleCount }, (_, i) => windowStart + i);

  return (
    <div
      className={`inline-flex items-center gap-[6px] h-3 select-none ${className}`}
      role="tablist"
      aria-label="Carousel pagination"
    >
      {visibleIndices.map((dotIndex, pos) => {
        const isActive = dotIndex === activeIndex;
        const distance = Math.abs(dotIndex - activeIndex);

        // Progressively smaller size calculation based on distance from active
        // active: 7.5px -> dist 1: 5.5px -> dist 2: 4px -> dist >= 3: 3px
        let sizePx = 7.5;
        let opacity = 1.0;
        let backgroundColor = "#ffffff";

        if (!isActive) {
          if (distance === 1) {
            sizePx = 5.5;
            opacity = 0.55;
            backgroundColor = "rgba(255, 255, 255, 0.7)";
          } else if (distance === 2) {
            sizePx = 4;
            opacity = 0.35;
            backgroundColor = "rgba(255, 255, 255, 0.5)";
          } else {
            sizePx = 3;
            opacity = 0.22;
            backgroundColor = "rgba(255, 255, 255, 0.35)";
          }
        }

        // Shrink outer edge dots if there are hidden items in that direction
        if (isSliding) {
          const isLeftEdge = pos === 0 && dotIndex > 0;
          const isRightEdge = pos === maxVisible - 1 && dotIndex < total - 1;

          if (isLeftEdge || isRightEdge) {
            sizePx = Math.min(sizePx, 2.75);
            opacity = 0.2;
          }
        }

        return (
          <button
            key={dotIndex}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Go to item ${dotIndex + 1} of ${total}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(dotIndex);
            }}
            style={{
              width: `${sizePx}px`,
              height: `${sizePx}px`,
              opacity,
              backgroundColor,
              boxShadow: isActive ? "0 0 5px rgba(255, 255, 255, 0.75)" : "none",
            }}
            className="shrink-0 rounded-full transition-all duration-200 ease-out cursor-pointer p-0 border-0 outline-none hover:opacity-90 active:scale-90"
          />
        );
      })}
    </div>
  );
};

export default CarouselDots;
