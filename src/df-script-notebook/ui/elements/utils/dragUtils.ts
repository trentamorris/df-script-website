import React from "react";
import { parseToPx, resolveBoxModel, getScrollableAncestor } from "../../../utils/layoutUtils";
export { getScrollableAncestor };

// ============================================================================
// Shared types & constants
// ============================================================================

export type DragAxis = "x" | "y";
export type DragPointer = { x: number; y: number };
export type DragClientRect = { left: number; right: number; top: number; bottom: number };

export type ResizeOrientation = "horizontal" | "vertical";
export type ResizeAnchor = "left" | "right" | "top" | "bottom";

/** Container rectangle measurements adjusted for internal padding */
export type DragContainerRect = {
  adjustedWidth: number;
  adjustedHeight: number;
  containerLeftX: number;
  containerRightX: number;
  containerTopY: number;
  containerBottomY: number;
};

/** Unified source-agnostic interaction event */
export type DragInteractionEvent = {
  clientX: number;
  clientY: number;
  pointerType: "mouse" | "touch" | "keyboard";
};

/** Clamped position outcome along an axis */
export type DragPositionResult = {
  px: number;
  percent: number;
  normalizedPercent: number;
  minPx: number;
  maxPx: number;
  containerRect: DragContainerRect;
};

/** Drag completion outcome with velocity and snap projection */
export type DragEndResult = DragPositionResult & {
  velocity: number;
  snap?: {
    px: number;
    percent: number;
  };
};

/** Active state for 1D handle-drag tracking */
export interface DragSessionState {
  rect: DragContainerRect;
  axisSize: number;
  minPx: number;
  maxPx: number;
  snapPointsPx?: number[];
  grabOffset: number;
  lastPos: number;
  lastTime: number;
  velocity: number;
  velocityInitialized: boolean;
}

// Backwards-compatibility aliases for DraggableSection types
export type DraggableSectionContainerRect = DragContainerRect;
export type DraggableDragEvent = DragInteractionEvent;
export type DraggablePointerEvent = DragPositionResult;
export type DraggablePointerUpEvent = DragEndResult;

export interface DraggableSectionCalculatePositionParams {
  clientX: number;
  clientY: number;
  state: Pick<DragSessionState, "rect" | "minPx" | "maxPx" | "axisSize" | "grabOffset">;
  orientation: ResizeOrientation;
  anchor: ResizeAnchor;
  invert?: boolean;
}

export interface DraggableSectionCreateDragSessionStateParams {
  container: HTMLElement;
  orientation: ResizeOrientation;
  anchor: ResizeAnchor;
  clampMin?: number | string;
  clampMax?: number | string;
  snapPoints?: (number | string)[];
  clientX: number;
  clientY: number;
  handleEl?: HTMLElement | null;
}

export interface DraggableSectionProcessDragMoveParams {
  clientX: number;
  clientY: number;
  now: number;
  state: DragSessionState;
  orientation: ResizeOrientation;
  anchor: ResizeAnchor;
  invert?: boolean;
}

export interface DraggableSectionProcessDragEndParams {
  clientX: number;
  clientY: number;
  now: number;
  state: DragSessionState;
  orientation: ResizeOrientation;
  anchor: ResizeAnchor;
  invert?: boolean;
}

/** Minimum pointer travel (px) before a press is treated as a drag rather than a click. */
export const DRAG_THRESHOLD_PX = 5;
/** Weight applied to the previous smoothed velocity when blending in a new sample (0-1). */
const VELOCITY_SMOOTHING = 0.7;
/** Seconds of velocity to project past the release point when resolving snap targets. */
const SNAP_PROJECTION_SECONDS = 0.1;
/**
 * Milliseconds of pointer inactivity before release after which the last sampled velocity
 * is considered stale and decayed to zero. Prevents a "flick then hold then release"
 * gesture from flinging on the residual velocity of the earlier motion.
 */
const VELOCITY_STALE_MS = 100;

/** True once the pointer has travelled far enough from where it was pressed to count as a drag. */
export const exceedsDragThreshold = (deltaX: number, deltaY: number) =>
  Math.abs(deltaX) > DRAG_THRESHOLD_PX || Math.abs(deltaY) > DRAG_THRESHOLD_PX;

/** Builds a normalized, source-agnostic drag event from raw client coordinates. */
export const createDragEvent = (
  clientX: number,
  clientY: number,
  pointerType: DraggableDragEvent["pointerType"]
): DraggableDragEvent => ({ clientX, clientY, pointerType });

// ============================================================================
// Shared primitives
// ============================================================================

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** `px` as a percentage of `axisSize` (0 when the axis has no size). */
export const toPercent = (px: number, axisSize: number) => (axisSize > 0 ? (px / axisSize) * 100 : 0);

/** Only the primary button (left click / pen tip / touch contact) starts a drag. */
export const isPrimaryPress = (event: { button: number }) => event.button === 0;

/** The drag axis for a resize orientation. */
export const toAxis = (orientation: ResizeOrientation): DragAxis => (orientation === "horizontal" ? "x" : "y");

/** Centre of an element in client coordinates. */
export const getElementCenter = (el: HTMLElement): DragPointer => {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

/** Client coordinate (along the drag axis) of a handle's moving edge: the edge facing away from the anchor. */
export const getMovingEdge = (el: HTMLElement, anchor: ResizeAnchor): number => {
  const rect = el.getBoundingClientRect();
  return { left: rect.right, right: rect.left, top: rect.bottom, bottom: rect.top }[anchor];
};

/** A point on a handle's moving edge, centred on the cross axis. */
export const getMovingEdgePoint = (el: HTMLElement, orientation: ResizeOrientation, anchor: ResizeAnchor): DragPointer => {
  const center = getElementCenter(el);
  const edge = getMovingEdge(el, anchor);
  return orientation === "horizontal" ? { x: edge, y: center.y } : { x: center.x, y: edge };
};

export const KEYBOARD_STEP_PX = 10;
export const KEYBOARD_LARGE_STEP_PX = 50;

/**
 * Screen-space offset an arrow key applies to a resize handle (Shift = large step), or null for any other key.
 * Only the arrows along the handle's axis count, so the cross-axis arrows keep their default behaviour.
 */
export const getKeyboardResizeOffset = (
  event: { key: string; shiftKey: boolean },
  orientation: ResizeOrientation
): DragPointer | null => {
  const [decreaseKey, increaseKey] = orientation === "horizontal" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"];
  const direction = event.key === decreaseKey ? -1 : event.key === increaseKey ? 1 : 0;
  if (!direction) return null;
  const step = direction * (event.shiftKey ? KEYBOARD_LARGE_STEP_PX : KEYBOARD_STEP_PX);
  return orientation === "horizontal" ? { x: step, y: 0 } : { x: 0, y: step };
};

/** Cursor presets shared by every resize handle (divider, section). */
export const RESIZE_HANDLE = {
  horizontal: { className: "cursor-ew-resize", bodyCursor: "col-resize" },
  vertical: { className: "cursor-ns-resize", bodyCursor: "row-resize" },
} as const satisfies Record<ResizeOrientation, { className: string; bodyCursor: string }>;

/**
 * ARIA for a resize separator. `aria-orientation` describes the separator *line*, so a handle that resizes
 * horizontally (width) is a vertical line.
 */
export const getSeparatorAria = (orientation: ResizeOrientation) =>
  ({
    role: "separator",
    "aria-orientation": orientation === "horizontal" ? "vertical" : "horizontal",
    tabIndex: 0,
  }) as const;

/** A ref that always holds the latest value. Long-lived listeners read it to see current props/callbacks. */
export const useLatestRef = <T,>(value: T): React.MutableRefObject<T> => {
  const ref = React.useRef(value);
  ref.current = value;
  return ref;
};

/**
 * `trackWindowPointerDrag` bound to a component's lifetime: only one drag runs at a time and an unmount mid-drag
 * releases the window listeners and restores the body cursor/selection.
 */
export const useWindowPointerDrag = () => {
  const teardownRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => () => teardownRef.current?.(), []);

  return React.useCallback((options: WindowPointerDragOptions) => {
    teardownRef.current?.();
    teardownRef.current = trackWindowPointerDrag({
      ...options,
      onEnd: (event, result) => {
        teardownRef.current = null;
        options.onEnd(event, result);
      },
    });
  }, []);
};

// ============================================================================
// Handle-drag geometry (DraggableSection, DraggableDivider)
// ============================================================================

/** Converts the pointer position to a clamped pixel distance from the anchor edge of the container. */
export function calculatePosition(
  params: DraggableSectionCalculatePositionParams
): Omit<DraggablePointerUpEvent, "velocity" | "snap" | "containerRect"> {
  const { clientX, clientY, state, orientation, anchor, invert = false } = params;
  const { rect, minPx, maxPx, axisSize, grabOffset } = state;
  let rawPx = 0;
  if (orientation === "horizontal") {
    const adjustedX = clientX + grabOffset;
    rawPx = anchor === "right" ? rect.containerRightX - adjustedX : adjustedX - rect.containerLeftX;
  } else {
    const adjustedY = clientY + grabOffset;
    rawPx = anchor === "bottom" ? rect.containerBottomY - adjustedY : adjustedY - rect.containerTopY;
  }

  if (invert) {
    rawPx = axisSize - rawPx;
  }

  const px = clamp(rawPx, minPx, maxPx);
  const percent = toPercent(px, axisSize);

  const travelRange = maxPx - minPx;
  const normalizedPercent = travelRange > 0 ? ((px - minPx) / travelRange) * 100 : 0;

  return { px, percent, normalizedPercent, minPx, maxPx };
}

/** Measures the container (minus padding), resolves clamp/snap values to px and captures the grab offset. */
export function createDragSessionState(params: DraggableSectionCreateDragSessionStateParams): DragSessionState {
  const { container, orientation, anchor, clampMin, clampMax, snapPoints, clientX, clientY, handleEl } = params;
  const containerRect = container.getBoundingClientRect();
  const box = resolveBoxModel(container);

  const adjustedWidth = container.clientWidth - box.left.padding - box.right.padding;
  const adjustedHeight = container.clientHeight - box.top.padding - box.bottom.padding;

  const rect: DraggableSectionContainerRect = {
    adjustedWidth,
    adjustedHeight,
    containerLeftX: containerRect.left + box.left.padding,
    containerRightX: containerRect.right - box.right.padding,
    containerTopY: containerRect.top + box.top.padding,
    containerBottomY: containerRect.bottom - box.bottom.padding,
  };

  const axisSize = orientation === "horizontal" ? adjustedWidth : adjustedHeight;

  const minPx = parseToPx(clampMin, { axisSize }) ?? 0;
  const maxPx = parseToPx(clampMax, { axisSize }) ?? axisSize;

  let snapPointsPx: number[] | undefined = undefined;
  if (snapPoints && snapPoints.length > 0) {
    snapPointsPx = snapPoints
      .map((point) => parseToPx(point, { axisSize }))
      .filter((value): value is number => value !== undefined)
      .sort((a, b) => a - b);
  }

  // Capture how far the grab point sits from the section's moving edge so the dragged element
  // follows the pointer from where it was grabbed instead of teleporting its edge to the cursor
  // (matches native bottom-sheet behavior). Measured once against the live rect at grab time.
  const grabOffset = handleEl ? getMovingEdge(handleEl, anchor) - (orientation === "horizontal" ? clientX : clientY) : 0;

  return {
    rect,
    axisSize,
    minPx,
    maxPx,
    snapPointsPx,
    grabOffset,
    lastPos: orientation === "horizontal" ? clientX : clientY,
    lastTime: performance.now(),
    velocity: 0,
    velocityInitialized: false,
  };
}

/** Updates velocity tracking and resolves the clamped position for one move sample. */
export function processDragMove(
  params: DraggableSectionProcessDragMoveParams
): Omit<DraggablePointerUpEvent, "velocity" | "snap"> {
  const { clientX, clientY, now, state, orientation, anchor, invert } = params;
  const currentPos = orientation === "horizontal" ? clientX : clientY;
  const deltaTime = now - state.lastTime;

  if (deltaTime > 0) {
    const instantVelocity = ((currentPos - state.lastPos) / deltaTime) * 1000;
    state.velocity = state.velocityInitialized
      ? state.velocity * VELOCITY_SMOOTHING + instantVelocity * (1 - VELOCITY_SMOOTHING)
      : instantVelocity;
    state.velocityInitialized = true;
  }

  state.lastPos = currentPos;
  state.lastTime = now;

  const position = calculatePosition({ clientX, clientY, state, orientation, anchor, invert });
  return { ...position, containerRect: state.rect };
}

/** Resolves the final position, decays stale velocity and picks the snap target (if any) on release. */
export function processDragEnd(params: DraggableSectionProcessDragEndParams): DraggablePointerUpEvent {
  const { clientX, clientY, now, state, orientation, anchor, invert } = params;
  const position = calculatePosition({ clientX, clientY, state, orientation, anchor, invert });

  const baseDirection = anchor === "bottom" || anchor === "right" ? -1 : 1;
  const axisDirection = invert ? -baseDirection : baseDirection;
  const isVelocityStale = now - state.lastTime > VELOCITY_STALE_MS;
  const velocityPx = isVelocityStale ? 0 : state.velocity * axisDirection;

  const payload: DraggablePointerUpEvent = {
    ...position,
    containerRect: state.rect,
    velocity: velocityPx,
  };

  if (state.snapPointsPx && state.snapPointsPx.length > 0) {
    const projectedPx = position.px + velocityPx * SNAP_PROJECTION_SECONDS;

    let closestSnapPx = state.snapPointsPx[0];
    let closestDistance = Math.abs(closestSnapPx - projectedPx);
    for (let i = 1; i < state.snapPointsPx.length; i++) {
      const candidate = state.snapPointsPx[i];
      const distance = Math.abs(candidate - projectedPx);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestSnapPx = candidate;
      }
    }

    payload.snap = {
      px: closestSnapPx,
      percent: toPercent(closestSnapPx, state.axisSize),
    };
  }

  return payload;
}

// ============================================================================
// Handle-drag session (input-agnostic: used by mouse and touch)
// ============================================================================

/** The props a handle drag reads. Read through a getter so a session always sees the latest callbacks. */
export type HandleDragProps = {
  orientation: ResizeOrientation;
  anchor: ResizeAnchor;
  invert?: boolean;
  clampMin?: number | string;
  clampMax?: number | string;
  snapPoints?: (number | string)[];
  onPointerDown?: (e: DragInteractionEvent, rect: DragContainerRect) => void;
  onPointerMove?: (data: DragPositionResult, e: DragInteractionEvent) => void;
  onPointerUp?: (data: DragEndResult, e: DragInteractionEvent) => void;
  onClick?: (e: DragInteractionEvent) => void;
};

export type HandleDragSession = {
  move: (clientX: number, clientY: number, now: number) => void;
  end: (clientX: number, clientY: number) => void;
  /**
   * A discrete step (keyboard): moves the handle by a client-space offset and releases. With snap points it jumps
   * to the next snap point in that direction instead, so a step never snaps straight back.
   */
  nudge: (offset: DragPointer) => void;
};

export type StartHandleDragSessionParams = {
  getProps: () => HandleDragProps;
  container: HTMLElement;
  handleEl: HTMLElement;
  clientX: number;
  clientY: number;
  pointerType: DraggableDragEvent["pointerType"];
};

/** Starts a handle drag: measures the container, fires `onPointerDown`, and returns the move/end drivers. */
export const startHandleDragSession = (
  params: StartHandleDragSessionParams
): HandleDragSession => {
  const { getProps, container, handleEl, clientX, clientY, pointerType } = params;
  const initialProps = getProps();
  const state = createDragSessionState({
    container,
    orientation: initialProps.orientation,
    anchor: initialProps.anchor,
    clampMin: initialProps.clampMin,
    clampMax: initialProps.clampMax,
    snapPoints: initialProps.snapPoints,
    clientX,
    clientY,
    handleEl,
  });

  initialProps.onPointerDown?.(createDragEvent(clientX, clientY, pointerType), state.rect);

  return {
    move: (x, y, now) => {
      const { orientation, anchor, invert, onPointerMove } = getProps();
      const payload = processDragMove({ clientX: x, clientY: y, now, state, orientation, anchor, invert });
      onPointerMove?.(payload, createDragEvent(x, y, pointerType));
    },
    end: (x, y) => {
      const { orientation, anchor, invert, onPointerUp } = getProps();
      const payload = processDragEnd({ clientX: x, clientY: y, now: performance.now(), state, orientation, anchor, invert });
      onPointerUp?.(payload, createDragEvent(x, y, pointerType));
    },
    nudge: (offset) => {
      const { orientation, anchor, invert, onPointerMove, onPointerUp } = getProps();
      const positionAt = (x: number, y: number) =>
        calculatePosition({ clientX: x, clientY: y, state, orientation, anchor, invert }).px;

      let x = clientX + offset.x;
      let y = clientY + offset.y;
      const fromPx = positionAt(clientX, clientY);
      const toPx = positionAt(x, y);

      if (state.snapPointsPx?.length && toPx !== fromPx) {
        const nextSnapPx =
          toPx > fromPx
            ? state.snapPointsPx.find((px) => px > fromPx + 1)
            : [...state.snapPointsPx].reverse().find((px) => px < fromPx - 1);
        if (nextSnapPx !== undefined) {
          // px grows away from the anchor; convert back to a client-space offset.
          const stepDirection = (anchor === "right" || anchor === "bottom" ? -1 : 1) * (invert ? -1 : 1);
          const clientDelta = (nextSnapPx - fromPx) * stepDirection;
          x = orientation === "horizontal" ? clientX + clientDelta : clientX;
          y = orientation === "vertical" ? clientY + clientDelta : clientY;
        }
      }

      const event = createDragEvent(x, y, pointerType);
      onPointerMove?.(processDragMove({ clientX: x, clientY: y, now: state.lastTime, state, orientation, anchor, invert }), event);
      // Releasing at the same timestamp keeps velocity at zero, so the snap resolves to the nudged position.
      onPointerUp?.(processDragEnd({ clientX: x, clientY: y, now: state.lastTime, state, orientation, anchor, invert }), event);
    },
  };
};

// ============================================================================
// Pointer / touch sessions
// ============================================================================

export type WindowPointerDragOptions = {
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
};

/**
 * Runs a pointer drag session on `window`: marks the handle active, disables text selection and sets the cursor,
 * coalesces moves to one per frame and cleans everything up on release. Returns a teardown that ends the
 * session early (e.g. on unmount) without calling `onEnd`.
 */
export const trackWindowPointerDrag = ({
  handleEl,
  pointerId,
  origin,
  cursor,
  onMove,
  onEnd,
}: WindowPointerDragOptions): (() => void) => {
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
    if (origin && !hasDragged) hasDragged = exceedsDragThreshold(event.clientX - origin.x, event.clientY - origin.y);

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

export type TouchDragOptions = {
  /** The handle element. Listeners attach here and it receives the `active` class while dragging. */
  el: HTMLElement;
  /** Whether a new gesture may start at all. */
  canStart: () => boolean;
  /** The axis the drag moves along; the gesture must travel mostly along it to become a drag. */
  getAxis: () => DragAxis;
  /** Called on touchstart so the caller can capture state (e.g. the scrollable ancestor under the finger). */
  onGestureStart?: (target: HTMLElement) => void;
  /** Called once, when the drag threshold is crossed along the main axis. Return false to leave the gesture alone. */
  shouldStartDrag: (delta: { deltaX: number; deltaY: number }) => boolean;
  onStart: (touch: Touch) => void;
  /** Called at most once per animation frame with the newest touch. */
  onMove: (touch: Touch, frameTime: number) => void;
  onEnd: (touch: Touch) => void;
  /** Called when the gesture ends without ever becoming a drag (a tap). */
  onTap?: (touch: Touch) => void;
};

/**
 * Touch counterpart to `trackWindowPointerDrag`: single-finger tracking, drag-threshold and main-axis detection,
 * one-move-per-frame coalescing and cleanup. Returns a teardown that removes the listeners.
 */
export const trackTouchDrag = ({
  el,
  canStart,
  getAxis,
  onGestureStart,
  shouldStartDrag,
  onStart,
  onMove,
  onEnd,
  onTap,
}: TouchDragOptions): (() => void) => {
  let activeTouchId: number | null = null;
  let isDragging = false;
  let hasMoved = false;
  let startX = 0;
  let startY = 0;
  let frameId: number | null = null;
  let latestTouch: Touch | null = null;

  const findTouch = (list: TouchList, id: number): Touch | null => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].identifier === id) return list[i];
    }
    return null;
  };

  const resetGesture = () => {
    activeTouchId = null;
    isDragging = false;
    hasMoved = false;
    latestTouch = null;
  };

  const flushFrame = (frameTime: number) => {
    frameId = null;
    if (isDragging && latestTouch) onMove(latestTouch, frameTime);
  };

  const handleTouchStart = (event: TouchEvent) => {
    if (!canStart() || event.touches.length !== 1) return;
    const touch = event.touches[0];
    resetGesture();
    activeTouchId = touch.identifier;
    startX = touch.clientX;
    startY = touch.clientY;
    onGestureStart?.(event.target as HTMLElement);
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (activeTouchId === null) return;
    const touch = findTouch(event.touches, activeTouchId);
    if (!touch) return;

    if (!isDragging) {
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      if (!exceedsDragThreshold(deltaX, deltaY)) return;

      hasMoved = true;
      const isMainAxisGesture =
        getAxis() === "y" ? Math.abs(deltaY) > Math.abs(deltaX) : Math.abs(deltaX) > Math.abs(deltaY);
      if (!isMainAxisGesture || !shouldStartDrag({ deltaX, deltaY })) {
        activeTouchId = null;
        return;
      }

      isDragging = true;
      el.classList.add("active");
      onStart(touch);
    }

    event.preventDefault();
    latestTouch = touch;
    if (frameId === null) frameId = requestAnimationFrame(flushFrame);
  };

  const handleTouchEnd = (event: TouchEvent) => {
    if (activeTouchId === null) return;
    const touch = findTouch(event.changedTouches, activeTouchId);
    if (!touch) return;

    if (frameId !== null) {
      cancelAnimationFrame(frameId);
      frameId = null;
    }

    if (isDragging) {
      el.classList.remove("active");
      onEnd(touch);
    } else if (!hasMoved) {
      onTap?.(touch);
    }

    resetGesture();
  };

  el.addEventListener("touchstart", handleTouchStart, { passive: true });
  el.addEventListener("touchmove", handleTouchMove, { passive: false });
  el.addEventListener("touchend", handleTouchEnd, { passive: true });
  el.addEventListener("touchcancel", handleTouchEnd, { passive: true });

  return () => {
    el.removeEventListener("touchstart", handleTouchStart);
    el.removeEventListener("touchmove", handleTouchMove);
    el.removeEventListener("touchend", handleTouchEnd);
    el.removeEventListener("touchcancel", handleTouchEnd);
    if (frameId !== null) cancelAnimationFrame(frameId);
    el.classList.remove("active");
  };
};

// ============================================================================
// Edge auto-scroll
// ============================================================================

export type EdgeProximityParams = {
  /** Coordinate being tested along the axis. */
  position: number;
  /** Container start/end along the axis (e.g. `rect.top` / `rect.bottom`). */
  start: number;
  end: number;
  /** Thickness in px from each container edge in which auto-scroll engages. */
  edgeZone: number;
};

export type SpanEdgeProximityParams = {
  /** Leading/trailing coordinates of the dragged object along the axis (equal for a pointer). */
  spanStart: number;
  spanEnd: number;
  containerStart: number;
  containerEnd: number;
  edgeZone: number;
};

export type ScrollSpeedParams = {
  proximity: number;
  elapsedMs: number;
  baseSpeed: number;
  maxSpeed: number;
  rampDuration: number;
};

export type AxisAutoScrollProximityParams = {
  pointerPosition: number;
  /** Extent of the dragged object along the axis, when it has one (e.g. a grid panel). */
  draggedSpan?: { start: number; end: number } | null;
  containerStart: number;
  containerEnd: number;
  edgeZone: number;
  /** Sign of the pointer's recent travel along the axis (-1, 0 or 1). */
  direction: number;
};

export const DEFAULT_AUTO_SCROLL_EDGE_ZONE = 40;
export const DEFAULT_AUTO_SCROLL_BASE_SPEED = 4;
export const DEFAULT_AUTO_SCROLL_MAX_SPEED = 24;
export const DEFAULT_AUTO_SCROLL_RAMP_DURATION = 1500;
/** `getScrollSpeed` returns px per frame at this reference frame time (60 Hz); the hook scales it by real elapsed time. */
const REFERENCE_FRAME_MS = 1000 / 60;
/** Cap on a single frame's elapsed time so a stalled tab doesn't cause a huge scroll jump. */
const MAX_FRAME_MS = 100;
/** Proximity is capped so dragging far outside the container doesn't scroll unboundedly fast. */
const MAX_PROXIMITY = 3;

const ALL_AXES: readonly DragAxis[] = ["x", "y"];

/**
 * Normalized proximity to a container edge: negative inside the start zone, positive inside the end zone,
 * 0 elsewhere. Reaches ±1 at the container edge and keeps growing beyond it.
 */
export const getEdgeProximity = ({ position, start, end, edgeZone }: EdgeProximityParams): number => {
  if (position < start + edgeZone) return -(start + edgeZone - position) / edgeZone;
  if (position > end - edgeZone) return (position - (end - edgeZone)) / edgeZone;
  return 0;
};

/**
 * Like `getEdgeProximity`, but for an object with extent (e.g. a dragged panel): its leading edge is tested
 * against the start zone and its trailing edge against the end zone, and the deeper of the two wins.
 */
export const getSpanEdgeProximity = ({
  spanStart,
  spanEnd,
  containerStart,
  containerEnd,
  edgeZone,
}: SpanEdgeProximityParams): number => {
  const startProximity = getEdgeProximity({ position: spanStart, start: containerStart, end: containerEnd, edgeZone });
  const endProximity = getEdgeProximity({ position: spanEnd, start: containerStart, end: containerEnd, edgeZone });
  const leadingProximity = Math.min(0, startProximity);
  const trailingProximity = Math.max(0, endProximity);
  return Math.abs(leadingProximity) >= trailingProximity ? leadingProximity : trailingProximity;
};

/** Scroll speed (px per reference frame) from edge proximity and time in the zone; ramps up over the first seconds. */
export const getScrollSpeed = ({
  proximity,
  elapsedMs,
  baseSpeed,
  maxSpeed,
  rampDuration,
}: ScrollSpeedParams): number => {
  const timeRamp = Math.min(1, elapsedMs / rampDuration);
  const cappedProximity = Math.min(Math.abs(proximity), MAX_PROXIMITY);
  return Math.sign(proximity) * (baseSpeed + (maxSpeed - baseSpeed) * timeRamp) * cappedProximity;
};

/**
 * The proximity that drives auto-scroll on one axis. The pointer always counts. A dragged object's edge counts
 * too, but only when the pointer is travelling toward that edge, so grabbing an object that already sits at an
 * edge doesn't start scrolling. Whichever is deeper in its zone wins.
 */
export const getAxisAutoScrollProximity = ({
  pointerPosition,
  draggedSpan,
  containerStart,
  containerEnd,
  edgeZone,
  direction,
}: AxisAutoScrollProximityParams): number => {
  const pointerProximity = getSpanEdgeProximity({
    spanStart: pointerPosition,
    spanEnd: pointerPosition,
    containerStart,
    containerEnd,
    edgeZone,
  });
  if (!draggedSpan) return pointerProximity;

  const draggedProximity = getSpanEdgeProximity({
    spanStart: draggedSpan.start,
    spanEnd: draggedSpan.end,
    containerStart,
    containerEnd,
    edgeZone,
  });

  const isTravellingTowardEdge = draggedProximity !== 0 && Math.sign(draggedProximity) === direction;
  return isTravellingTowardEdge && Math.abs(draggedProximity) > Math.abs(pointerProximity)
    ? draggedProximity
    : pointerProximity;
};

export type DragAutoScrollOptions = {
  /** Auto-scroll only runs while a drag is active. */
  isActive: boolean;
  /** Axes that may scroll. Defaults to both. */
  axes?: readonly DragAxis[];
  edgeZone?: number;
  baseSpeed?: number;
  maxSpeed?: number;
  rampDuration?: number;
  /** The scrollable element that should scroll while dragging. */
  getContainer: () => HTMLElement | null;
  /** Latest pointer position in client coordinates. */
  getPointer: () => DragPointer | null;
  /** Optional client rect of the dragged object (see `getAxisAutoScrollProximity`). */
  getDraggedRect?: () => DragClientRect | null;
  /** Called after the container actually scrolled, so the caller can refresh position-derived state. */
  onScroll?: (container: HTMLElement) => void;
};

/** Just the knobs that control how eagerly and how fast auto-scroll runs. */
export type DragAutoScrollTuning = Pick<DragAutoScrollOptions, "edgeZone" | "baseSpeed" | "maxSpeed" | "rampDuration">;

/**
 * Edge auto-scroll for drag interactions. The animation-frame loop only runs while the pointer (or dragged
 * object) is inside an edge zone; call the returned `update` whenever the pointer moves and it starts or
 * stops the loop as needed. Idle drags cost nothing.
 */
export const useDragAutoScroll = (options: DragAutoScrollOptions): { update: () => void } => {
  const optionsRef = useLatestRef(options);

  const notifyRef = React.useRef<(() => void) | null>(null);
  const { isActive, axes = ALL_AXES } = options;
  const axesKey = axes.join();

  React.useEffect(() => {
    if (!isActive) return;

    const activeAxes = axesKey.split(",") as DragAxis[];
    const direction: Record<DragAxis, number> = { x: 0, y: 0 };
    const edgeEnteredAt: Record<DragAxis, number | null> = { x: null, y: null };
    let lastPointer: DragPointer | null = null;
    let lastFrameTime = 0;
    let frameId: number | null = null;

    /** Scrolls the container for this frame. Returns true while the loop should keep running (in an edge zone). */
    const scrollFrame = (now: number, frameScale: number): boolean => {
      const {
        getContainer,
        getPointer,
        getDraggedRect,
        onScroll,
        edgeZone = DEFAULT_AUTO_SCROLL_EDGE_ZONE,
        baseSpeed = DEFAULT_AUTO_SCROLL_BASE_SPEED,
        maxSpeed = DEFAULT_AUTO_SCROLL_MAX_SPEED,
        rampDuration = DEFAULT_AUTO_SCROLL_RAMP_DURATION,
      } = optionsRef.current;
      const container = getContainer();
      const pointer = getPointer();
      if (!container || !pointer) return false;

      const containerRect = container.getBoundingClientRect();
      const draggedRect = getDraggedRect?.() ?? null;
      const scrollDelta: Record<DragAxis, number> = { x: 0, y: 0 };
      let isInEdgeZone = false;

      for (const axis of activeAxes) {
        const isHorizontal = axis === "x";
        const proximity = getAxisAutoScrollProximity({
          pointerPosition: isHorizontal ? pointer.x : pointer.y,
          draggedSpan: draggedRect
            ? {
                start: isHorizontal ? draggedRect.left : draggedRect.top,
                end: isHorizontal ? draggedRect.right : draggedRect.bottom,
              }
            : null,
          containerStart: isHorizontal ? containerRect.left : containerRect.top,
          containerEnd: isHorizontal ? containerRect.right : containerRect.bottom,
          edgeZone,
          direction: direction[axis],
        });

        if (proximity === 0) {
          edgeEnteredAt[axis] = null;
          continue;
        }

        isInEdgeZone = true;
        edgeEnteredAt[axis] ??= now;
        scrollDelta[axis] =
          frameScale *
          getScrollSpeed({
            proximity,
            elapsedMs: now - (edgeEnteredAt[axis] ?? now),
            baseSpeed,
            maxSpeed,
            rampDuration,
          });
      }

      const { scrollLeft, scrollTop } = container;
      container.scrollLeft += scrollDelta.x;
      container.scrollTop += scrollDelta.y;
      if (container.scrollLeft !== scrollLeft || container.scrollTop !== scrollTop) onScroll?.(container);
      return isInEdgeZone;
    };

    const tick = () => {
      frameId = null;
      const now = performance.now();
      const frameScale = Math.min(now - lastFrameTime, MAX_FRAME_MS) / REFERENCE_FRAME_MS;
      lastFrameTime = now;
      if (scrollFrame(now, frameScale)) frameId = requestAnimationFrame(tick);
    };

    const notify = () => {
      const pointer = optionsRef.current.getPointer();
      if (pointer) {
        for (const axis of activeAxes) {
          const current = axis === "x" ? pointer.x : pointer.y;
          const previous = lastPointer ? (axis === "x" ? lastPointer.x : lastPointer.y) : current;
          if (current !== previous) direction[axis] = Math.sign(current - previous);
        }
        lastPointer = { x: pointer.x, y: pointer.y };
      }

      if (frameId !== null) return;
      // Start from one reference frame ago so the first frame scrolls a normal step.
      lastFrameTime = performance.now() - REFERENCE_FRAME_MS;
      frameId = requestAnimationFrame(tick);
    };

    notifyRef.current = notify;
    notify();

    return () => {
      notifyRef.current = null;
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [isActive, axesKey]);

  const update = React.useCallback(() => notifyRef.current?.(), []);
  return { update };
};
