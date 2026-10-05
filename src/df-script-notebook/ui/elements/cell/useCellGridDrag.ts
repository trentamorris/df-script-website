import React from "react";
import { CellLayout, PageGridConfig } from "../../../types";
import { calculateEdgeScrollVelocity } from "../../../utils/dragUtils";
import { getScrollableAncestor } from "../../../utils/layoutUtils";
import { usePointerDrag } from "../../../hooks/usePointerDrag";
import {
  calculateGridSteps,
  calculateCellMoveCoordinates,
  calculateCellResizeDimensions,
} from "./utils";

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

interface DragSession {
  initialLayout: CellLayout;
  grabOffsetX?: number;
  grabOffsetY?: number;
  scrollXEl: HTMLElement | null;
  scrollYEl: HTMLElement | null;
  currentClientX: number;
  currentClientY: number;
  rafId: number | null;
}

const DEFAULT_GAP_PX = 12;

function stepAutoScroll(session: DragSession, onDidScroll: () => void) {
  let didScroll = false;
  if (session.scrollXEl) {
    const bounds = session.scrollXEl.getBoundingClientRect();
    const vx = calculateEdgeScrollVelocity(session.currentClientX, bounds.left, bounds.right);
    if (vx !== 0) {
      session.scrollXEl.scrollLeft += vx;
      didScroll = true;
    }
  }
  if (session.scrollYEl) {
    const bounds = session.scrollYEl.getBoundingClientRect();
    const vy = calculateEdgeScrollVelocity(session.currentClientY, bounds.top, bounds.bottom);
    if (vy !== 0) {
      session.scrollYEl.scrollTop += vy;
      didScroll = true;
    }
  }
  if (didScroll) onDidScroll();
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
  const gapPx = DEFAULT_GAP_PX;

  const moveSessionRef = React.useRef<DragSession | null>(null);
  const resizeSessionRef = React.useRef<DragSession | null>(null);

  const updateMove = React.useCallback((clientX: number, clientY: number) => {
    const session = moveSessionRef.current;
    const container = cellElementRef.current?.parentElement;
    if (!session || !container) return;

    session.currentClientX = clientX;
    session.currentClientY = clientY;

    const gridRect = container.getBoundingClientRect();
    const { colStepPx, rowStepPx } = calculateGridSteps(gridRect.width, totalCols, rowHeight, gapPx);

    const { x, y } = calculateCellMoveCoordinates({
      clientX,
      clientY,
      gridRect,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
      grabOffsetX: session.grabOffsetX ?? 0,
      grabOffsetY: session.grabOffsetY ?? 0,
      colStepPx,
      rowStepPx,
      totalCols,
      totalRows,
      cellW: session.initialLayout.w,
      cellH: session.initialLayout.h,
    });

    setLiveLayout((prev) => ({ ...(prev ?? session.initialLayout), x, y }));
    onUpdateLayout?.(cellId, { x, y });
  }, [cellElementRef, totalCols, rowHeight, gapPx, totalRows, cellId, onUpdateLayout]);

  const updateResize = React.useCallback((clientX: number, clientY: number) => {
    const session = resizeSessionRef.current;
    const container = cellElementRef.current?.parentElement;
    if (!session || !container) return;

    session.currentClientX = clientX;
    session.currentClientY = clientY;

    const gridRect = container.getBoundingClientRect();
    const { colStepPx, rowStepPx } = calculateGridSteps(gridRect.width, totalCols, rowHeight, gapPx);

    const { w, h } = calculateCellResizeDimensions({
      clientX,
      clientY,
      gridRect,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
      originX: session.initialLayout.x,
      originY: session.initialLayout.y,
      colStepPx,
      rowStepPx,
      totalCols,
    });

    setLiveLayout((prev) => ({ ...(prev ?? session.initialLayout), w, h }));
    onUpdateLayout?.(cellId, { w, h });
  }, [cellElementRef, totalCols, rowHeight, gapPx, cellId, onUpdateLayout]);

  // --- Move Pointer Drag ---
  const { startDrag: handleMovePointerDown } = usePointerDrag({
    canStart: () => Boolean(isGridCanvasMode && onUpdateLayout),
    onStart: (e) => {
      setIsMoving(true);
      onInteractionChange?.(true);

      const cellRect = cellElementRef.current?.getBoundingClientRect();
      const session: DragSession = {
        grabOffsetX: cellRect ? e.clientX - cellRect.left : 0,
        grabOffsetY: cellRect ? e.clientY - cellRect.top : 0,
        initialLayout: { ...baseLayout },
        scrollXEl: getScrollableAncestor({ el: cellElementRef.current, axis: "x" }),
        scrollYEl: getScrollableAncestor({ el: cellElementRef.current, axis: "y" }),
        currentClientX: e.clientX,
        currentClientY: e.clientY,
        rafId: null,
      };
      moveSessionRef.current = session;

      const loop = () => {
        const cur = moveSessionRef.current;
        if (!cur) return;
        stepAutoScroll(cur, () => updateMove(cur.currentClientX, cur.currentClientY));
        cur.rafId = requestAnimationFrame(loop);
      };
      session.rafId = requestAnimationFrame(loop);
    },
    onMove: ({ clientX, clientY }) => updateMove(clientX, clientY),
    onEnd: () => {
      if (moveSessionRef.current?.rafId) cancelAnimationFrame(moveSessionRef.current.rafId);
      moveSessionRef.current = null;
      setIsMoving(false);
      setLiveLayout(null);
      onInteractionChange?.(false);
    },
  });

  // --- Resize Pointer Drag ---
  const { startDrag: handleResizePointerDown } = usePointerDrag({
    cursor: "se-resize",
    canStart: () => Boolean(isGridCanvasMode && onUpdateLayout),
    onStart: (e) => {
      setIsResizing(true);
      onInteractionChange?.(true);

      const session: DragSession = {
        initialLayout: { ...baseLayout },
        scrollXEl: getScrollableAncestor({ el: cellElementRef.current, axis: "x" }),
        scrollYEl: getScrollableAncestor({ el: cellElementRef.current, axis: "y" }),
        currentClientX: e.clientX,
        currentClientY: e.clientY,
        rafId: null,
      };
      resizeSessionRef.current = session;

      const loop = () => {
        const cur = resizeSessionRef.current;
        if (!cur) return;
        stepAutoScroll(cur, () => updateResize(cur.currentClientX, cur.currentClientY));
        cur.rafId = requestAnimationFrame(loop);
      };
      session.rafId = requestAnimationFrame(loop);
    },
    onMove: ({ clientX, clientY }) => updateResize(clientX, clientY),
    onEnd: () => {
      if (resizeSessionRef.current?.rafId) cancelAnimationFrame(resizeSessionRef.current.rafId);
      resizeSessionRef.current = null;
      setIsResizing(false);
      setLiveLayout(null);
      onInteractionChange?.(false);
    },
  });

  return {
    isMoving,
    isResizing,
    liveLayout,
    handleMovePointerDown,
    handleResizePointerDown,
  };
}

