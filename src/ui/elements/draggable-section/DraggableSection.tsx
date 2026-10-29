import React from "react";
import clsx from "clsx";
import { DraggableSectionProps } from "./types";
import {
  DragPointerType,
  getMovingEdgePoint,
  getKeyboardResizeOffset,
  startDragSession,
} from "../../../utils/dragUtils";
import { usePointerDrag } from "../../../hooks/usePointerDrag";

export const DraggableSection = React.forwardRef<HTMLDivElement, DraggableSectionProps>(
  (props, ref) => {
    const {
      containerRef,
      orientation,
      anchor,
      invert,
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

    const latestRef = React.useRef(props);
    latestRef.current = props;

    const { startDragSession: trackPointerDrag } = usePointerDrag();
    const getLatestProps = React.useCallback(() => latestRef.current, []);

    const handlePointerDown = React.useCallback(
      (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggable || e.button !== 0) return;
        const container = containerRef.current;
        const el = innerRef.current;
        if (!container || !el) return;
        e.stopPropagation();

        const pointerType: DragPointerType =
          e.pointerType === "touch" ? "touch" : "mouse";

        const session = startDragSession({
          getProps: getLatestProps,
          container,
          handleEl: el,
          clientX: e.clientX,
          clientY: e.clientY,
          pointerType,
        });

        trackPointerDrag({
          handleEl: el,
          pointerId: e.pointerId,
          origin: { x: e.clientX, y: e.clientY },
          cursor: orientation === "horizontal" ? "col-resize" : "row-resize",
          onMove: (evt, frameTime) => {
            session.move(evt.clientX, evt.clientY, frameTime);
          },
          onEnd: (evt, result) => {
            if (!result.cancelled) {
              session.end(evt.clientX, evt.clientY);
            }
            if (!result.hasDragged && !result.cancelled) {
              latestRef.current.onClick?.({ clientX: evt.clientX, clientY: evt.clientY, pointerType });
            }
          },
        });
      },
      [draggable, containerRef, getLatestProps, trackPointerDrag, orientation]
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
        startDragSession({
          getProps: getLatestProps,
          container,
          handleEl: e.currentTarget,
          clientX: origin.x,
          clientY: origin.y,
          pointerType: "keyboard",
        }).nudge(offset);
      },
      [containerRef, getLatestProps, onKeyDown]
    );

    const sectionClasses = React.useMemo(() => {
      const touchClass = orientation === "horizontal" ? "touch-pan-y" : "touch-none";
      const cursorClass = orientation === "horizontal" ? "cursor-ew-resize" : "cursor-ns-resize";
      return clsx("draggable-section", touchClass, cursorClass, className);
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
