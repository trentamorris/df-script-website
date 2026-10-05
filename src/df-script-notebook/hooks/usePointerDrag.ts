import React from "react";
import { DragPointer, DRAG_THRESHOLD_PX } from "../utils/dragUtils";

export interface TrackPointerDragOptions {
  /** Element that receives the `active` class while dragging (e.g. the divider/handle). */
  handleEl?: HTMLElement | null;
  /** Only events from this pointer are tracked; other pointers are ignored. */
  pointerId?: number;
  /** Where the press started. When provided, `onEnd` reports whether the pointer travelled past the drag threshold. */
  origin?: DragPointer;
  /** Body cursor shown for the duration of the drag. */
  cursor?: string;
  /** Called at most once per animation frame with the newest pointermove. */
  onMove: (event: PointerEvent, frameTime: number) => void;
  /** Called once on pointerup, pointercancel or Escape, after cleanup. `cancelled` means the result should be discarded. */
  onEnd: (event: PointerEvent, result: { hasDragged: boolean; cancelled: boolean }) => void;
}

const _trackPointerDrag = ({
  handleEl,
  pointerId,
  origin,
  cursor,
  onMove,
  onEnd,
}: TrackPointerDragOptions): (() => void) => {
  const controller = new AbortController();
  const { signal } = controller;
  let frameId: number | null = null;
  let latestEvent: PointerEvent | null = null;
  let hasDragged = false;
  const previousCursor = document.body.style.cursor;

  handleEl?.classList.add("active");
  document.body.classList.add("select-none");
  if (cursor) document.body.style.cursor = cursor;

  const teardown = () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    controller.abort();
    handleEl?.classList.remove("active");
    document.body.classList.remove("select-none");
    if (cursor) document.body.style.cursor = previousCursor;
  };

  const isTrackedPointer = (event: PointerEvent) => pointerId === undefined || event.pointerId === pointerId;

  const handleMove = (event: PointerEvent) => {
    if (!isTrackedPointer(event)) return;
    if (origin && !hasDragged) {
      hasDragged = Math.abs(event.clientX - origin.x) > DRAG_THRESHOLD_PX || Math.abs(event.clientY - origin.y) > DRAG_THRESHOLD_PX;
    }

    latestEvent = event;
    if (frameId !== null) return;
    frameId = requestAnimationFrame((frameTime) => {
      frameId = null;
      if (latestEvent) onMove(latestEvent, frameTime);
    });
  };

  const handleEnd = (event: PointerEvent) => {
    if (!isTrackedPointer(event)) return;
    teardown();
    onEnd(event, { hasDragged, cancelled: event.type === "pointercancel" });
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !latestEvent) return;
    teardown();
    onEnd(latestEvent, { hasDragged, cancelled: true });
  };

  window.addEventListener("keydown", handleKeyDown, { signal });
  window.addEventListener("pointermove", handleMove, { signal, passive: true });
  window.addEventListener("pointerup", handleEnd, { signal, passive: true });
  window.addEventListener("pointercancel", handleEnd, { signal, passive: true });

  return teardown;
};

export interface PointerDragStartEvent {
  clientX: number;
  clientY: number;
  pointerId?: number;
  pointerType: "mouse" | "touch" | "pen" | "keyboard";
}

export interface PointerDragMovePayload {
  clientX: number;
  clientY: number;
  deltaX: number;
  deltaY: number;
  nativeEvent: PointerEvent;
  frameTime: number;
}

export interface PointerDragEndResult {
  hasDragged: boolean;
  cancelled: boolean;
  nativeEvent: PointerEvent;
}

export interface UsePointerDragOptions {
  /** Element that receives an 'active' CSS class while dragging (e.g. handle or divider) */
  targetEl?: HTMLElement | null;
  /** Body cursor override shown for the duration of the drag (e.g. 'col-resize', 'se-resize') */
  cursor?: string;
  /** Primary button only by default. Return false to prevent starting a drag */
  canStart?: (e: React.PointerEvent) => boolean;
  /** Called immediately on drag start */
  onStart?: (event: PointerDragStartEvent) => void;
  /** Called at most once per animation frame with the latest pointer coordinates and deltas */
  onMove?: (payload: PointerDragMovePayload) => void;
  /** Called on pointerup, pointercancel, or Escape */
  onEnd?: (result: PointerDragEndResult) => void;
}


/**
 * Hook providing window pointer dragging bound to the component's lifetime.
 * Supports both imperative `startDragSession` (for custom handle sessions) and React `startDrag` (for event handlers).
 */
export function usePointerDrag(options: UsePointerDragOptions = {}) {
  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  const teardownRef = React.useRef<(() => void) | null>(null);

  // Guarantee cleanup on unmount
  React.useEffect(() => () => teardownRef.current?.(), []);

  const startDragSession = React.useCallback((sessionOptions: TrackPointerDragOptions) => {
    teardownRef.current?.();
    teardownRef.current = _trackPointerDrag({
      ...sessionOptions,
      onEnd: (event, result) => {
        teardownRef.current = null;
        sessionOptions.onEnd(event, result);
      },
    });
  }, []);

  const startDrag = React.useCallback((e: React.PointerEvent) => {
    const opts = optionsRef.current;
    if (opts.canStart && !opts.canStart(e)) return;
    if (e.button !== 0) return; // Only primary button starts a drag

    e.preventDefault();
    e.stopPropagation();

    const pointerId = e.pointerId;
    const originX = e.clientX;
    const originY = e.clientY;

    opts.onStart?.({
      clientX: originX,
      clientY: originY,
      pointerId,
      pointerType: e.pointerType as "mouse" | "touch" | "pen",
    });

    startDragSession({
      handleEl: opts.targetEl,
      pointerId,
      origin: { x: originX, y: originY },
      cursor: opts.cursor,
      onMove: (latestEvent, frameTime) => {
        opts.onMove?.({
          clientX: latestEvent.clientX,
          clientY: latestEvent.clientY,
          deltaX: latestEvent.clientX - originX,
          deltaY: latestEvent.clientY - originY,
          nativeEvent: latestEvent,
          frameTime,
        });
      },
      onEnd: (endEvent, { hasDragged, cancelled }) => {
        opts.onEnd?.({
          hasDragged,
          cancelled,
          nativeEvent: endEvent,
        });
      },
    });
  }, [startDragSession]);

  return { startDrag, startDragSession };
}

