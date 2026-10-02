import React from "react";
import clsx from "clsx";
import {
  DraggableDividerProps,
  DraggableDividerAnchorTypes,
  DraggableDividerDragDirectionTypes,
  DraggableDividerEventPayload,
} from "./draggableDividerTypes";
import {
  calculatePosition,
  clamp,
  createDragSessionState,
  getElementCenter,
  getKeyboardResizeOffset,
  getSeparatorAria,
  isPrimaryPress,
  RESIZE_HANDLE,
  toPercent,
  useWindowPointerDrag,
} from "../utils/dragUtils";

const DEFAULT_DRAG_OPTIONS: Record<DraggableDividerAnchorTypes, DraggableDividerDragDirectionTypes> = {
  left: "right",
  right: "left",
  top: "down",
  bottom: "up",
};

/** Draggable Divider */
export function DraggableDivider({
  containerRef,
  orientation,
  anchor,
  dragDirection,
  thicknessPx = 4,
  clampMin,
  clampMax,
  clampUnit = "px",
  onPointerDown,
  onPointerMove,
  onPointerUp,
  className,
}: DraggableDividerProps) {
  const isInvertedDragDirection = !!dragDirection && dragDirection !== DEFAULT_DRAG_OPTIONS[anchor];
  const startDrag = useWindowPointerDrag();

  /** Measures the container once and returns a resolver from a client point to the reported value. */
  const createSession = React.useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return null;

      const toClampValue = (value: number | undefined) =>
        value === undefined ? undefined : clampUnit === "percent" ? `${value}%` : value;

      const state = createDragSessionState({
        container,
        orientation,
        anchor,
        clampMin: toClampValue(clampMin),
        clampMax: toClampValue(clampMax),
        clientX,
        clientY,
      });

      const { rect, axisSize, minPx } = state;
      // Unlike a section, a divider has no implicit upper bound when 'clampMax' is omitted.
      const maxPx = clampMax === undefined ? Infinity : state.maxPx;

      const valueAt = (x: number, y: number): DraggableDividerEventPayload => {
        // Inverted drags measure unclamped from the anchor, flip across the axis, then clamp to the limits.
        const position = calculatePosition({
          clientX: x,
          clientY: y,
          state: {
            ...state,
            minPx: isInvertedDragDirection ? -Infinity : minPx,
            maxPx: isInvertedDragDirection ? Infinity : maxPx,
          },
          orientation,
          anchor,
        });
        const px = isInvertedDragDirection ? clamp(axisSize - position.px, minPx, maxPx) : position.px;
        return { px, percent: toPercent(px, axisSize), containerRect: rect };
      };

      return { rect, valueAt };
    },
    [containerRef, orientation, anchor, isInvertedDragDirection, clampMin, clampMax, clampUnit]
  );

  const handlePointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isPrimaryPress(e)) return;
      const session = createSession(e.clientX, e.clientY);
      if (!session) return;
      onPointerDown?.({ e, containerRect: session.rect });

      startDrag({
        handleEl: e.currentTarget,
        pointerId: e.pointerId,
        cursor: RESIZE_HANDLE[orientation].bodyCursor,
        onMove: (evt) => onPointerMove?.({ payload: session.valueAt(evt.clientX, evt.clientY), evt }),
        onEnd: (evt) => onPointerUp?.({ payload: session.valueAt(evt.clientX, evt.clientY), evt }),
      });
    },
    [createSession, startDrag, orientation, onPointerDown, onPointerMove, onPointerUp]
  );

  /** Arrow keys along the axis move the divider a step (Shift = large step), as a move followed by a release. */
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const offset = getKeyboardResizeOffset(e, orientation);
      if (!offset) return;
      const center = getElementCenter(e.currentTarget);
      const session = createSession(center.x, center.y);
      if (!session) return;

      e.preventDefault();
      const payload = session.valueAt(center.x + offset.x, center.y + offset.y);
      onPointerMove?.({ payload, evt: e.nativeEvent });
      onPointerUp?.({ payload, evt: e.nativeEvent });
    },
    [createSession, orientation, onPointerMove, onPointerUp]
  );

  const dividerClasses = React.useMemo(() => {
    const orientationClass = clsx({
      [RESIZE_HANDLE[orientation].className]: true,
      [orientation === "horizontal" ? "h-[100%]" : "w-[100%]"]: true,
    });

    const anchorClasses: Record<DraggableDividerAnchorTypes, string> = {
      left: "border-l top-0 bottom-0 right-[100%] translate-x-1/2",
      right: "border-r top-0 bottom-0 left-[100%] -translate-x-1/2",
      top: "border-t left-0 right-0 bottom-[100%] translate-y-1/2",
      bottom: "border-b left-0 right-0 top-[100%] -translate-y-1/2",
    };

    return clsx(
      "draggable-divider absolute z-10 touch-none border-[var(--sui-palette-divider,rgba(255,255,255,0.06))] hover:bg-[var(--draggable-color,var(--panel-nav-accent))] active:bg-[var(--draggable-color,var(--panel-nav-accent))]",
      orientationClass,
      anchorClasses[anchor],
      className
    );
  }, [orientation, anchor, className]);

  return (
    <div
      {...getSeparatorAria(orientation)}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      style={{
        [orientation === "horizontal" ? "width" : "height"]: `${thicknessPx}px`,
      }}
      className={dividerClasses}
    />
  );
}

export default DraggableDivider;
