import React from "react";
import clsx from "clsx";
import { DraggableSectionProps } from "./draggableSectionTypes";
import {
  HandleDragSession,
  getMovingEdgePoint,
  getKeyboardResizeOffset,
  startHandleDragSession,
  trackTouchDrag,
  toAxis,
  getScrollableAncestor,
  createDragEvent,
  RESIZE_HANDLE,
  useLatestRef,
  useWindowPointerDrag,
} from "../utils/dragUtils";

export const DraggableSection = React.forwardRef<HTMLDivElement, DraggableSectionProps>(
  (props, ref) => {
    const {
      containerRef,
      orientation,
      anchor,
      clampMin,
      clampMax,
      snapPoints,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onClick,
      className,
      draggable = true,
      children,
      onKeyDown,
      ...rest
    } = props;

    const innerRef = React.useRef<HTMLDivElement | null>(null);

    const setRefs = React.useCallback(
      (node: HTMLDivElement | null) => {
        innerRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }
      },
      [ref]
    );

    const latestRef = useLatestRef(props);
    const startDrag = useWindowPointerDrag();
    const getLatestProps = React.useCallback(() => latestRef.current, [latestRef]);

    const handlePointerDown = React.useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggable || e.button !== 0) return;
        const container = containerRef.current;
        const el = innerRef.current;
        if (!container || !el) return;

        const session = startHandleDragSession({
          getProps: getLatestProps,
          container,
          handleEl: el,
          clientX: e.clientX,
          clientY: e.clientY,
          pointerType: "mouse",
        });

        startDrag({
          handleEl: el,
          pointerId: e.pointerId,
          origin: { x: e.clientX, y: e.clientY },
          cursor: RESIZE_HANDLE[orientation].bodyCursor,
          onMove: (evt, frameTime) => {
            session.move(evt.clientX, evt.clientY, frameTime);
          },
          onEnd: (evt, result) => {
            if (!result.cancelled) {
              session.end(evt.clientX, evt.clientY);
            }
            if (!result.hasDragged && !result.cancelled) {
              latestRef.current.onClick?.(createDragEvent(evt.clientX, evt.clientY, "mouse"));
            }
          },
        });
      },
      [draggable, containerRef, getLatestProps, startDrag, orientation, latestRef]
    );

    /** Arrow keys on the section itself (not its content) step it, or jump between snap points. */
    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(e);
        const currentProps = latestRef.current;
        if (e.defaultPrevented || !currentProps.draggable || e.target !== e.currentTarget) return;

        const offset = getKeyboardResizeOffset(e, currentProps.orientation);
        const container = containerRef.current;
        if (!offset || !container) return;

        e.preventDefault();
        const origin = getMovingEdgePoint(e.currentTarget, currentProps.orientation, currentProps.anchor);
        startHandleDragSession({
          getProps: getLatestProps,
          container,
          handleEl: e.currentTarget,
          clientX: origin.x,
          clientY: origin.y,
          pointerType: "keyboard",
        }).nudge(offset);
      },
      [containerRef, getLatestProps, latestRef, onKeyDown]
    );

    React.useEffect(() => {
      const el = innerRef.current;
      if (!el) return;

      let session: HandleDragSession | null = null;
      // The scrollable element under the finger at touchstart, if any (e.g. a sheet's scrolling body).
      let gestureScroller: HTMLElement | null = null;

      return trackTouchDrag({
        el,
        canStart: () => latestRef.current.draggable ?? true,
        getAxis: () => toAxis(latestRef.current.orientation),
        onGestureStart: (target) => {
          gestureScroller = containerRef.current
            ? getScrollableAncestor({
                el: target,
                stopEl: el,
                checkScrollbounds: true,
                includeSelf: true,
                axis: toAxis(latestRef.current.orientation),
              })
            : null;
        },
        shouldStartDrag: ({ deltaY }) => {
          if (!containerRef.current) return false;

          // A bottom sheet only takes over from its scrolling content once that content hits an end.
          const { orientation: currentOrientation, anchor: currentAnchor } = latestRef.current;
          if (!gestureScroller || currentOrientation !== "vertical" || currentAnchor !== "bottom") return true;

          const { scrollTop, scrollHeight, clientHeight } = gestureScroller;
          const isPullingDown = deltaY > 0;
          const atTop = scrollTop <= 0;
          const atBottom = scrollTop >= scrollHeight - clientHeight - 1;
          return (isPullingDown && atTop) || (!isPullingDown && atBottom);
        },
        onStart: (touch) => {
          const container = containerRef.current;
          if (!container) return;
          session = startHandleDragSession({
            getProps: getLatestProps,
            container,
            handleEl: el,
            clientX: touch.clientX,
            clientY: touch.clientY,
            pointerType: "touch",
          });
        },
        onMove: (touch, now) => session?.move(touch.clientX, touch.clientY, now),
        onEnd: (touch) => {
          session?.end(touch.clientX, touch.clientY);
          session = null;
        },
        onTap: (touch) =>
          latestRef.current.onClick?.(createDragEvent(touch.clientX, touch.clientY, "touch")),
      });
    }, [containerRef, getLatestProps, latestRef]);

    const sectionClasses = React.useMemo(() => {
      const touchClass = orientation === "horizontal" ? "touch-pan-y" : "touch-none";
      return clsx("draggable-section", touchClass, RESIZE_HANDLE[orientation].className, className);
    }, [orientation, className]);

    return (
      <div
        ref={setRefs}
        // Not a 'separator': separators hide their children from assistive tech, and a section has content.
        role="group"
        aria-roledescription="resizable section"
        tabIndex={draggable ? 0 : undefined}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        className={sectionClasses}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

DraggableSection.displayName = "DraggableSection";

export default DraggableSection;
