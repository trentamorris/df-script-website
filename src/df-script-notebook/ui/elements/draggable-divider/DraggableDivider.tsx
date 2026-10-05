import React from "react";
import clsx from "clsx";
import {
  DraggableDividerProps,
  DraggableDividerAnchorTypes,
  DraggableDividerDragDirectionTypes,
} from "./types";
import { DraggableSection } from "../draggable-section/DraggableSection";

const DEFAULT_DRAG_OPTIONS: Record<DraggableDividerAnchorTypes, DraggableDividerDragDirectionTypes> = {
  left: "right",
  right: "left",
  top: "down",
  bottom: "up",
};

/** Draggable Divider - presentation wrapper over DraggableSection */
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

  const toClampValue = (value: number | undefined) =>
    value === undefined ? undefined : clampUnit === "percent" ? `${value}%` : value;

  const dividerClasses = React.useMemo(() => {
    const anchorClasses: Record<DraggableDividerAnchorTypes, string> = {
      left: "border-l top-0 bottom-0 right-[100%] translate-x-1/2",
      right: "border-r top-0 bottom-0 left-[100%] -translate-x-1/2",
      top: "border-t left-0 right-0 bottom-[100%] translate-y-1/2",
      bottom: "border-b left-0 right-0 top-[100%] -translate-y-1/2",
    };

    return clsx(
      "draggable-divider absolute z-10 touch-none border-[var(--sui-palette-divider,rgba(255,255,255,0.06))] hover:bg-[var(--draggable-color,var(--panel-nav-accent))] active:bg-[var(--draggable-color,var(--panel-nav-accent))]",
      orientation === "horizontal" ? "h-full" : "w-full",
      anchorClasses[anchor],
      className
    );
  }, [orientation, anchor, className]);

  return (
    <DraggableSection
      containerRef={containerRef}
      orientation={orientation}
      anchor={anchor}
      invert={isInvertedDragDirection}
      clampMin={toClampValue(clampMin)}
      clampMax={toClampValue(clampMax)}
      onPointerDown={(e, rect) => {
        onPointerDown?.({
          e: e as unknown as React.PointerEvent<HTMLDivElement>,
          containerRect: rect,
        });
      }}
      onPointerMove={(data, e) => {
        onPointerMove?.({
          payload: { px: data.px, percent: data.percent, containerRect: data.containerRect },
          evt: { clientX: e.clientX, clientY: e.clientY } as PointerEvent,
        });
      }}
      onPointerUp={(data, e) => {
        onPointerUp?.({
          payload: { px: data.px, percent: data.percent, containerRect: data.containerRect },
          evt: { clientX: e.clientX, clientY: e.clientY } as PointerEvent,
        });
      }}
      style={{
        [orientation === "horizontal" ? "width" : "height"]: `${thicknessPx}px`,
      }}
      className={dividerClasses}
    >
      {null}
    </DraggableSection>
  );
}

export default DraggableDivider;
