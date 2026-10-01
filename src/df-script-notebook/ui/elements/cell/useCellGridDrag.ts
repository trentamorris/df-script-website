import React from "react";
import { CellLayout, PageGridConfig } from "../../../types";

interface UseCellGridDragOptions {
  cellId: string;
  layout?: CellLayout;
  isGridCanvasMode?: boolean;
  gridConfig?: PageGridConfig;
  cellElementRef: React.RefObject<HTMLElement | null>;
  onUpdateLayout?: (id: string, layout: Partial<CellLayout>) => void;
  onInteractionChange?: (isInteracting: boolean) => void;
}

interface UseCellGridDragReturn {
  isMoving: boolean;
  isResizing: boolean;
  liveLayout: CellLayout | null;
  handleMovePointerDown: (e: React.PointerEvent) => void;
  handleResizePointerDown: (e: React.PointerEvent) => void;
}

const EDGE_THRESHOLD = 60;
const MAX_SCROLL_SPEED = 30;

/** Returns scroll velocity based on cursor overshoot past an edge. Accelerates the further outside. */
function _edgeScrollVelocity(cursor: number, edgeMin: number, edgeMax: number): number {
  if (cursor < edgeMin + EDGE_THRESHOLD) {
    const overshoot = (edgeMin + EDGE_THRESHOLD) - cursor;
    return -Math.min(MAX_SCROLL_SPEED, Math.round(overshoot * 0.5));
  }
  if (cursor > edgeMax - EDGE_THRESHOLD) {
    const overshoot = cursor - (edgeMax - EDGE_THRESHOLD);
    return Math.min(MAX_SCROLL_SPEED, Math.round(overshoot * 0.5));
  }
  return 0;
}

/** Walks up the DOM to find the nearest scrollable ancestor for a given axis. */
function _findScrollParent(el: HTMLElement | null, axis: "x" | "y"): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    const overflow = axis === "x" ? style.overflowX : style.overflowY;
    if (overflow === "auto" || overflow === "scroll") {
      const hasScroll = axis === "x"
        ? node.scrollWidth > node.clientWidth + 1
        : node.scrollHeight > node.clientHeight + 1;
      if (hasScroll) return node;
    }
    node = node.parentElement;
  }
  return document.documentElement as HTMLElement;
}

export function useCellGridDrag({
  cellId,
  layout,
  isGridCanvasMode,
  gridConfig,
  cellElementRef,
  onUpdateLayout,
  onInteractionChange,
}: UseCellGridDragOptions): UseCellGridDragReturn {
  const [isMoving, setIsMoving] = React.useState(false);
  const [isResizing, setIsResizing] = React.useState(false);
  const [liveLayout, setLiveLayout] = React.useState<CellLayout | null>(null);

  const baseLayout = layout ?? { x: 0, y: 0, w: 12, h: 6, z: 1 };
  const totalCols = gridConfig?.columns ?? 12;
  const totalRows = gridConfig?.rows ?? 24;
  const rowHeight = gridConfig?.rowHeight ?? 48;
  const gapPx = 12;

  const handleMovePointerDown = (e: React.PointerEvent) => {
    if (!isGridCanvasMode || !onUpdateLayout) return;
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    setIsMoving(true);
    onInteractionChange?.(true);

    const gridContainer = cellElementRef.current?.parentElement as HTMLElement | null;
    const initialLayout = { ...baseLayout };

    const cellRect = cellElementRef.current?.getBoundingClientRect();
    const grabOffsetX = cellRect ? e.clientX - cellRect.left : 0;
    const grabOffsetY = cellRect ? e.clientY - cellRect.top : 0;

    let currentClientX = e.clientX;
    let currentClientY = e.clientY;
    let rafId: number | null = null;

    // Resolve scroll containers once; they won't change mid-drag
    const scrollContainerX = _findScrollParent(cellElementRef.current, "x");
    const scrollContainerY = _findScrollParent(cellElementRef.current, "y");

    const computeAndApplyPosition = () => {
      if (!gridContainer) return;
      const gridRect = gridContainer.getBoundingClientRect();
      const colStepPx = Math.max(15, (gridRect.width - (totalCols - 1) * gapPx) / totalCols) + gapPx;
      const rowStepPx = rowHeight + gapPx;

      const relativeX = (currentClientX - gridRect.left + gridContainer.scrollLeft) - grabOffsetX;
      const relativeY = (currentClientY - gridRect.top + gridContainer.scrollTop) - grabOffsetY;

      const rawGridX = Math.round(relativeX / colStepPx);
      const rawGridY = Math.round(relativeY / rowStepPx);

      const maxX = Math.max(0, totalCols - initialLayout.w);
      const maxY = Math.max(0, totalRows - initialLayout.h);

      const boundedX = Math.max(0, Math.min(maxX, rawGridX));
      const boundedY = Math.max(0, Math.min(maxY, rawGridY));

      const updated: CellLayout = { ...initialLayout, x: boundedX, y: boundedY };
      setLiveLayout(updated);
      onUpdateLayout(cellId, { x: boundedX, y: boundedY });
    };

    const rafLoop = () => {
      let didScroll = false;

      if (scrollContainerX) {
        const boundsX = scrollContainerX.getBoundingClientRect();
        const vx = _edgeScrollVelocity(currentClientX, boundsX.left, boundsX.right);
        if (vx !== 0) { scrollContainerX.scrollLeft += vx; didScroll = true; }
      }

      if (scrollContainerY) {
        const boundsY = scrollContainerY.getBoundingClientRect();
        const vy = _edgeScrollVelocity(currentClientY, boundsY.top, boundsY.bottom);
        if (vy !== 0) { scrollContainerY.scrollTop += vy; didScroll = true; }
      }

      if (didScroll) computeAndApplyPosition();

      rafId = requestAnimationFrame(rafLoop);
    };

    rafId = requestAnimationFrame(rafLoop);

    const onPointerMove = (moveEvent: PointerEvent) => {
      currentClientX = moveEvent.clientX;
      currentClientY = moveEvent.clientY;
      computeAndApplyPosition();
    };

    const onPointerUp = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      setIsMoving(false);
      setLiveLayout(null);
      onInteractionChange?.(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    if (!isGridCanvasMode || !onUpdateLayout) return;
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    onInteractionChange?.(true);

    const gridContainer = cellElementRef.current?.parentElement as HTMLElement | null;
    const initialLayout = { ...baseLayout };

    let currentClientX = e.clientX;
    let currentClientY = e.clientY;
    let rafId: number | null = null;

    const scrollContainerX = _findScrollParent(cellElementRef.current, "x");
    const scrollContainerY = _findScrollParent(cellElementRef.current, "y");

    const computeAndApplyDimensions = () => {
      if (!gridContainer) return;
      const gridRect = gridContainer.getBoundingClientRect();
      const colStepPx = Math.max(15, (gridRect.width - (totalCols - 1) * gapPx) / totalCols) + gapPx;
      const rowStepPx = rowHeight + gapPx;

      const cellLeft = gridRect.left - gridContainer.scrollLeft + initialLayout.x * colStepPx;
      const cellTop = gridRect.top - gridContainer.scrollTop + initialLayout.y * rowStepPx;

      const relativeW = currentClientX - cellLeft;
      const relativeH = currentClientY - cellTop;

      const rawGridW = Math.round(relativeW / colStepPx);
      const rawGridH = Math.round(relativeH / rowStepPx);

      const maxColsForCell = totalCols - initialLayout.x;
      const boundedW = Math.max(1, Math.min(maxColsForCell, rawGridW));
      const boundedH = Math.max(1, Math.min(100, rawGridH));

      const updated: CellLayout = { ...initialLayout, w: boundedW, h: boundedH };
      setLiveLayout(updated);
      onUpdateLayout(cellId, { w: boundedW, h: boundedH });
    };

    const rafLoop = () => {
      let didScroll = false;

      if (scrollContainerX) {
        const boundsX = scrollContainerX.getBoundingClientRect();
        const vx = _edgeScrollVelocity(currentClientX, boundsX.left, boundsX.right);
        if (vx !== 0) { scrollContainerX.scrollLeft += vx; didScroll = true; }
      }

      if (scrollContainerY) {
        const boundsY = scrollContainerY.getBoundingClientRect();
        const vy = _edgeScrollVelocity(currentClientY, boundsY.top, boundsY.bottom);
        if (vy !== 0) { scrollContainerY.scrollTop += vy; didScroll = true; }
      }

      if (didScroll) computeAndApplyDimensions();

      rafId = requestAnimationFrame(rafLoop);
    };

    rafId = requestAnimationFrame(rafLoop);

    const onPointerMove = (moveEvent: PointerEvent) => {
      currentClientX = moveEvent.clientX;
      currentClientY = moveEvent.clientY;
      computeAndApplyDimensions();
    };

    const onPointerUp = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      setIsResizing(false);
      setLiveLayout(null);
      onInteractionChange?.(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  return {
    isMoving,
    isResizing,
    liveLayout,
    handleMovePointerDown,
    handleResizePointerDown,
  };
}
