import React from "react";
import clsx from "clsx";
import { Button } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import styles from "./styles.module.css";
import {
  ScrollableCanvasProps,
  ScrollableCanvasArrowProps,
  ScrollableCanvasHandle,
} from "./types";

const ScrollableCanvasArrow = React.forwardRef<HTMLDivElement, ScrollableCanvasArrowProps>(
  ({ direction, onClick }, ref) => {
    return (
      <div
        ref={ref}
        data-direction={direction}
        className={clsx(
          styles.arrowBtnContainer,
          "absolute z-20 flex items-center justify-center h-full",
          direction === "left" ? "left-0 top-0" : "right-0 top-0",
        )}
      >
        <div className={styles.arrowBtnBg}>
          <Button
            className={clsx(
              styles.arrowBtn,
              "!rounded-[50px] border border-white/10 hover:bg-white/10 active:scale-95 transition-all",
            )}
            onClick={onClick}
          >
            {direction === "left" ? <ChevronLeft color="inherit" /> : <ChevronRight color="inherit" />}
          </Button>
        </div>
      </div>
    );
  },
);

ScrollableCanvasArrow.displayName = "ScrollableCanvasArrow";

/*** Scrollable Section ***/
export const ScrollableCanvas = React.forwardRef<ScrollableCanvasHandle, ScrollableCanvasProps>(({
  children,
  className,
  scrollContentStartOffset,
  scrollContentEndOffset,
  gap,
  arrowBackgroundColor,
  arrowColor,
  onOverflowChange,
}, ref) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const leftArrowRef = React.useRef<HTMLDivElement>(null);
  const rightArrowRef = React.useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = React.useState<boolean>(false);
  const [showRightArrow, setShowRightArrow] = React.useState<boolean>(false);

  const scrollContainerOffsets = React.useMemo(
    () => ({
      "--scroll-content-start-offset": scrollContentStartOffset
        ? typeof scrollContentStartOffset === "number"
          ? `${scrollContentStartOffset}px`
          : scrollContentStartOffset
        : "0px",
      "--scroll-content-end-offset": scrollContentEndOffset
        ? typeof scrollContentEndOffset === "number"
          ? `${scrollContentEndOffset}px`
          : scrollContentEndOffset
        : "0px",
      "--scroll-content-item-spacing": gap ? (typeof gap === "number" ? `${gap}px` : gap) : "0px",
      "--scroll-arrow-background-color": arrowBackgroundColor ?? "rgba(10, 10, 10, 0.95)",
      "--scroll-arrow-color": arrowColor ?? "inherit",
    }),
    [scrollContentStartOffset, scrollContentEndOffset, arrowBackgroundColor, arrowColor, gap],
  ) as React.CSSProperties;

  const updateScrollState = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const computedStyle = getComputedStyle(el);

    const startOffsetPx = parseFloat(computedStyle.getPropertyValue("--scroll-content-start-offset")) || 0;
    const endOffsetPx = parseFloat(computedStyle.getPropertyValue("--scroll-content-end-offset")) || 0;
    const scrollThreshold = 2;
    const remainingScrollDistance = scrollWidth - clientWidth - scrollLeft;

    setShowLeftArrow(Math.floor(scrollLeft - startOffsetPx) > scrollThreshold);
    setShowRightArrow(Math.ceil(remainingScrollDistance - endOffsetPx) > scrollThreshold);
    onOverflowChange?.(Math.ceil(scrollWidth - clientWidth - startOffsetPx - endOffsetPx) > scrollThreshold);
  }, [onOverflowChange]);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver?.observe(el);

    const mutationObserver = new MutationObserver(updateScrollState);
    mutationObserver?.observe(el, { childList: true, subtree: true });

    el.addEventListener("scroll", updateScrollState);

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      el.removeEventListener("scroll", updateScrollState);
    };
  }, [updateScrollState]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (el) {
      const offset = el.clientWidth * 0.7;
      el.scrollBy({ left: direction === "left" ? -offset : offset, behavior: "smooth" });
    }
  };

  React.useImperativeHandle(ref, () => ({
    scrollToElement: (element, behavior = "smooth") => {
      const scrollContainer = scrollRef.current;
      if (!scrollContainer) return;

      const containerBounds = scrollContainer.getBoundingClientRect();
      const elementBounds = element.getBoundingClientRect();
      const leftArrowBounds = leftArrowRef.current?.getBoundingClientRect();
      const rightArrowBounds = rightArrowRef.current?.getBoundingClientRect();
      const leftOverlayWidth = leftArrowBounds
        ? Math.max(0, Math.min(leftArrowBounds.right, containerBounds.right) - containerBounds.left)
        : 0;
      const rightOverlayWidth = rightArrowBounds
        ? Math.max(0, containerBounds.right - Math.max(rightArrowBounds.left, containerBounds.left))
        : 0;
      const visibleLeft = containerBounds.left + leftOverlayWidth;
      const visibleRight = containerBounds.right - rightOverlayWidth;
      const leftOffset = elementBounds.left - visibleLeft;
      const rightOffset = elementBounds.right - visibleRight;

      if (leftOffset < 0) {
        scrollContainer.scrollBy({ left: leftOffset, behavior });
      } else if (rightOffset > 0) {
        scrollContainer.scrollBy({ left: rightOffset, behavior });
      }
    },
  }), []);

  return (
    <div
      style={scrollContainerOffsets}
      className={clsx(styles.scrollableCanvasContainer, "relative flex items-center min-w-0", className ?? "")}
    >
      {/* Left Arrow */}
      {showLeftArrow && (
        <ScrollableCanvasArrow
          ref={leftArrowRef}
          direction="left"
          onClick={() => handleScroll("left")}
        />
      )}

      {/* Main Scrollable Area */}
      <div
        ref={scrollRef}
        className={clsx(
          styles.scrollableArea,
          "flex items-center overflow-x-auto w-full scroll-smooth min-w-0",
          scrollContentStartOffset && styles.hasStartOffset,
          scrollContentEndOffset && styles.hasEndOffset,
        )}
      >
        {children}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <ScrollableCanvasArrow
          ref={rightArrowRef}
          direction="right"
          onClick={() => handleScroll("right")}
        />
      )}
    </div>
  );
});

ScrollableCanvas.displayName = "ScrollableCanvas";
