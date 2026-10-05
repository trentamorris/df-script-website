import React from "react";
import { parseToPx, resolveBoxModel } from "./layoutUtils";

export type DragAxis = "x" | "y";
export type DragPointer = { x: number; y: number };
export type DragClientRect = { left: number; right: number; top: number; bottom: number };

export type DragClientCoordinates = {
  clientX: number;
  clientY: number;
};

export type DragPointerType = "mouse" | "touch" | "keyboard";

export type ResizeOrientation = "horizontal" | "vertical";
export type ResizeAnchor = "left" | "right" | "top" | "bottom";

export type DragContainerRect = {
  adjustedWidth: number;
  adjustedHeight: number;
  containerLeftX: number;
  containerRightX: number;
  containerTopY: number;
  containerBottomY: number;
};

export type DragInteractionEvent = DragClientCoordinates & {
  pointerType: DragPointerType;
};

export type DragPositionResult = {
  px: number;
  percent: number;
  normalizedPercent: number;
  minPx: number;
  maxPx: number;
  containerRect: DragContainerRect;
};

export type DragEndResult = DragPositionResult & {
  velocity: number;
  snap?: {
    px: number;
    percent: number;
  };
};

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

/** Minimum pointer travel (px) before a press is treated as a drag rather than a click. */
export const DRAG_THRESHOLD_PX = 5;
/** Weight applied to the previous smoothed velocity when blending in a new sample (0-1). */
const VELOCITY_SMOOTHING = 0.7;
/** Seconds of velocity to project past the release point when resolving snap targets. */
const SNAP_PROJECTION_SECONDS = 0.1;
/** Decay window (ms) to zero out velocity if pointer held stationary before release. */
const VELOCITY_STALE_MS = 100;

// ============================================================================
// Shared primitives
// ============================================================================

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const toPercent = (px: number, axisSize: number) => (axisSize > 0 ? (px / axisSize) * 100 : 0);

/** A point on a handle's moving edge, centred on the cross axis. */
export const getMovingEdgePoint = (el: HTMLElement, orientation: ResizeOrientation, anchor: ResizeAnchor): DragPointer => {
  const rect = el.getBoundingClientRect();
  const edge = { left: rect.right, right: rect.left, top: rect.bottom, bottom: rect.top }[anchor];
  return orientation === "horizontal"
    ? { x: edge, y: rect.top + rect.height / 2 }
    : { x: rect.left + rect.width / 2, y: edge };
};

export const KEYBOARD_STEP_PX = 10;
export const KEYBOARD_LARGE_STEP_PX = 50;

/** Screen-space offset an arrow key applies along the active axis (Shift = large step), or null. */
export const getKeyboardResizeOffset = (
  event: { key: string; shiftKey: boolean },
  orientation: ResizeOrientation
): DragPointer | null => {
  const isHoriz = orientation === "horizontal";
  const direction =
    event.key === (isHoriz ? "ArrowRight" : "ArrowDown") ? 1 :
      event.key === (isHoriz ? "ArrowLeft" : "ArrowUp") ? -1 : 0;
  if (!direction) return null;

  const step = direction * (event.shiftKey ? KEYBOARD_LARGE_STEP_PX : KEYBOARD_STEP_PX);
  return isHoriz ? { x: step, y: 0 } : { x: 0, y: step };
};

// ============================================================================
// Handle-drag geometry
// ============================================================================

interface CalculatePositionParams extends DragClientCoordinates {
  state: Pick<DragSessionState, "rect" | "minPx" | "maxPx" | "axisSize" | "grabOffset">;
  orientation: ResizeOrientation;
  anchor: ResizeAnchor;
  invert?: boolean;
}

/** Converts the pointer position to a clamped pixel distance from the anchor edge of the container. */
export function calculatePosition(
  params: CalculatePositionParams
): Omit<DragEndResult, "velocity" | "snap" | "containerRect"> {
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

// ============================================================================
// Handle-drag session (input-agnostic: used by mouse and touch)
// ============================================================================

export type DragSessionProps = {
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

export type DragSession = {
  move: (clientX: number, clientY: number, now: number) => void;
  end: (clientX: number, clientY: number) => void;
  /** Steps handle by offset, jumping to adjacent snap point if available. */
  nudge: (offset: DragPointer) => void;
};

export type StartDragSessionParams = {
  getProps: () => DragSessionProps;
  container: HTMLElement;
  handleEl: HTMLElement;
  clientX: number;
  clientY: number;
  pointerType: DragInteractionEvent["pointerType"];
};

export const startDragSession = (
  params: StartDragSessionParams
): DragSession => {
  const { getProps, container, handleEl, clientX, clientY, pointerType } = params;
  const initialProps = getProps();
  const { orientation, anchor, clampMin, clampMax, snapPoints } = initialProps;

  const containerRect = container.getBoundingClientRect();
  const box = resolveBoxModel(container);

  const adjustedWidth = container.clientWidth - box.left.padding - box.right.padding;
  const adjustedHeight = container.clientHeight - box.top.padding - box.bottom.padding;
  const axisSize = orientation === "horizontal" ? adjustedWidth : adjustedHeight;

  const rawMinPx = parseToPx(clampMin, { axisSize }) ?? 0;
  const rawMaxPx = parseToPx(clampMax, { axisSize }) ?? axisSize;
  const minPx = Math.min(rawMinPx, rawMaxPx);
  const maxPx = Math.max(rawMinPx, rawMaxPx);

  const parsedSnapPx = snapPoints
    ?.map((point) => parseToPx(point, { axisSize }))
    .filter((value): value is number => value !== undefined);
  const snapPointsPx = parsedSnapPx?.length ? parsedSnapPx : undefined;

  const handleRect = handleEl?.getBoundingClientRect();
  const movingEdge = handleRect ? { left: handleRect.right, right: handleRect.left, top: handleRect.bottom, bottom: handleRect.top }[anchor] : 0;
  const grabOffset = handleRect ? movingEdge - (orientation === "horizontal" ? clientX : clientY) : 0;

  const state: DragSessionState = {
    rect: {
      adjustedWidth,
      adjustedHeight,
      containerLeftX: containerRect.left + box.left.padding,
      containerRightX: containerRect.right - box.right.padding,
      containerTopY: containerRect.top + box.top.padding,
      containerBottomY: containerRect.bottom - box.bottom.padding,
    },
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

  initialProps.onPointerDown?.({ clientX, clientY, pointerType }, state.rect);

  const calculateMove = (x: number, y: number, now: number): DragPositionResult => {
    const { orientation, anchor, invert } = getProps();
    const currentPos = orientation === "horizontal" ? x : y;
    const deltaTime = now - state.lastTime;

    if (deltaTime > 0) {
      const instantVelocity = ((currentPos - state.lastPos) / deltaTime) * 1000;
      state.velocity = state.velocityInitialized
        ? state.velocity * VELOCITY_SMOOTHING + instantVelocity * (1 - VELOCITY_SMOOTHING)
        : instantVelocity;
      state.velocityInitialized = true;
      state.lastPos = currentPos;
      state.lastTime = now;
    }

    const position = calculatePosition({ clientX: x, clientY: y, state, orientation, anchor, invert });
    return { ...position, containerRect: state.rect };
  };

  const calculateEnd = (x: number, y: number, now: number): DragEndResult => {
    const { orientation, anchor, invert } = getProps();
    const position = calculatePosition({ clientX: x, clientY: y, state, orientation, anchor, invert });

    const axisDirection = (anchor === "bottom" || anchor === "right" ? -1 : 1) * (invert ? -1 : 1);
    const isVelocityStale = now - state.lastTime > VELOCITY_STALE_MS;
    const velocityPx = isVelocityStale ? 0 : state.velocity * axisDirection;

    const payload: DragEndResult = {
      ...position,
      containerRect: state.rect,
      velocity: velocityPx,
    };

    const { snapPointsPx } = state;
    if (snapPointsPx) {
      const projectedPx = position.px + velocityPx * SNAP_PROJECTION_SECONDS;
      let snapPx = snapPointsPx[0];
      for (let i = 1, n = snapPointsPx.length; i < n; i++) {
        if (Math.abs(snapPointsPx[i] - projectedPx) < Math.abs(snapPx - projectedPx)) snapPx = snapPointsPx[i];
      }
      payload.snap = { px: snapPx, percent: toPercent(snapPx, state.axisSize) };
    }

    return payload;
  };

  const session: DragSession = {
    move: (x, y, now) => {
      const payload = calculateMove(x, y, now);
      getProps().onPointerMove?.(payload, { clientX: x, clientY: y, pointerType });
    },
    end: (x, y) => {
      const payload = calculateEnd(x, y, performance.now());
      getProps().onPointerUp?.(payload, { clientX: x, clientY: y, pointerType });
    },
    nudge: (offset) => {
      const x = clientX + offset.x;
      const y = clientY + offset.y;
      session.move(x, y, state.lastTime);
      session.end(x, y);
    },
  };

  return session;
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

export type ScrollSpeedParams = {
  proximity: number;
  elapsedMs: number;
  baseSpeed: number;
  maxSpeed: number;
  rampDuration: number;
};

export const DEFAULT_AUTO_SCROLL_EDGE_ZONE = 40;
export const DEFAULT_AUTO_SCROLL_BASE_SPEED = 4;
export const DEFAULT_AUTO_SCROLL_MAX_SPEED = 24;
export const DEFAULT_AUTO_SCROLL_RAMP_DURATION = 1500;
/** `_calculateScrollSpeedPxPerFrame` returns px per frame at this reference frame time (60 Hz); the hook scales it by real elapsed time. */
const REFERENCE_FRAME_MS = 1000 / 60;
/** Cap on a single frame's elapsed time so a stalled tab doesn't cause a huge scroll jump. */
const MAX_FRAME_MS = 100;
/** Proximity is capped so dragging far outside the container doesn't scroll unboundedly fast. */
const MAX_PROXIMITY = 3;

function _getEdgeProximity({ position, start, end, edgeZone }: EdgeProximityParams): number {
  if (position < start + edgeZone) return -(start + edgeZone - position) / edgeZone;
  if (position > end - edgeZone) return (position - (end - edgeZone)) / edgeZone;
  return 0;
}

/** Scroll speed (px per reference frame) from edge proximity and time in the zone; ramps up over the first seconds. */
function _calculateScrollSpeedPxPerFrame({
  proximity,
  elapsedMs,
  baseSpeed,
  maxSpeed,
  rampDuration,
}: ScrollSpeedParams): number {
  const timeRamp = Math.min(1, elapsedMs / rampDuration);
  const cappedProximity = Math.min(Math.abs(proximity), MAX_PROXIMITY);
  return Math.sign(proximity) * (baseSpeed + (maxSpeed - baseSpeed) * timeRamp) * cappedProximity;
}

export interface EdgeScrollVelocityOptions {
  edgeThreshold?: number;
  maxScrollSpeed?: number;
  baseScrollSpeed?: number;
}

/** Scroll velocity for a cursor near or past an edge (no time ramp). */
export function calculateEdgeScrollVelocity(
  cursor: number,
  edgeMin: number,
  edgeMax: number,
  options: EdgeScrollVelocityOptions = {}
): number {
  const { edgeThreshold = DEFAULT_AUTO_SCROLL_EDGE_ZONE, maxScrollSpeed = DEFAULT_AUTO_SCROLL_MAX_SPEED, baseScrollSpeed = DEFAULT_AUTO_SCROLL_BASE_SPEED } = options;
  const proximity = _getEdgeProximity({ position: cursor, start: edgeMin, end: edgeMax, edgeZone: edgeThreshold });
  if (proximity === 0) return 0;
  return Math.round(
    _calculateScrollSpeedPxPerFrame({
      proximity,
      elapsedMs: 0,
      baseSpeed: baseScrollSpeed,
      maxSpeed: maxScrollSpeed,
      rampDuration: DEFAULT_AUTO_SCROLL_RAMP_DURATION,
    })
  );
}

export type DragAutoScrollOptions = {
  /** Auto-scroll only runs while a drag is active. */
  isActive: boolean;
  /** Axes that may scroll. Defaults to both. */
  axes?: readonly DragAxis[];
  edgeZone?: number;
  baseSpeed?: number;
  maxSpeed?: number;
  rampDuration?: number;
  getContainer: () => HTMLElement | null;
  getPointer: () => DragPointer | null;
  getDraggedRect?: () => DragClientRect | null;
  onScroll?: (container: HTMLElement) => void;
};

/** Runs edge auto-scroll animation loop when pointer or dragged object is in edge zone. */
export const useDragAutoScroll = (options: DragAutoScrollOptions): { update: () => void } => {
  const optionsRef = React.useRef(options);
  optionsRef.current = options;

  const notifyRef = React.useRef<(() => void) | null>(null);
  const { isActive, axes } = options;
  const axesKey = axes ? axes.join() : "x,y";

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
        const pos = isHorizontal ? pointer.x : pointer.y;
        const cStart = isHorizontal ? containerRect.left : containerRect.top;
        const cEnd = isHorizontal ? containerRect.right : containerRect.bottom;

        let proximity = _getEdgeProximity({ position: pos, start: cStart, end: cEnd, edgeZone });

        if (draggedRect) {
          const dir = direction[axis];
          if (dir < 0) {
            const leadingProx = _getEdgeProximity({
              position: isHorizontal ? draggedRect.left : draggedRect.top,
              start: cStart,
              end: cEnd,
              edgeZone,
            });
            if (leadingProx < proximity) proximity = leadingProx;
          } else if (dir > 0) {
            const trailingProx = _getEdgeProximity({
              position: isHorizontal ? draggedRect.right : draggedRect.bottom,
              start: cStart,
              end: cEnd,
              edgeZone,
            });
            if (trailingProx > proximity) proximity = trailingProx;
          }
        }

        if (proximity === 0) {
          edgeEnteredAt[axis] = null;
          continue;
        }

        isInEdgeZone = true;
        edgeEnteredAt[axis] ??= now;
        scrollDelta[axis] =
          frameScale *
          _calculateScrollSpeedPxPerFrame({
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
