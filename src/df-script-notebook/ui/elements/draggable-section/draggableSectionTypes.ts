import React from "react";
import type {
  DragContainerRect,
  DragEndResult,
  DragInteractionEvent,
  DragPositionResult,
  DragSessionState,
  DraggableSectionCalculatePositionParams,
  DraggableSectionCreateDragSessionStateParams,
  DraggableSectionProcessDragEndParams,
  DraggableSectionProcessDragMoveParams,
  ResizeAnchor,
  ResizeOrientation,
} from "../utils/dragUtils";

export type DraggableSectionOrientation = ResizeOrientation;
export type DraggableSectionAnchor = ResizeAnchor;
export type DraggableSectionClampUnit = "px" | "percent";


/** Type for the onPointerDown callback function. */
export type DraggableSectionOnPointerDown = (
  e: DragInteractionEvent,
  rect: DragContainerRect
) => void;

/** Type for the onPointerMove callback function. */
export type DraggableSectionOnPointerMove = (
  data: DragPositionResult,
  e: DragInteractionEvent
) => void;

/** Type for the onPointerUp callback function. */
export type DraggableSectionOnPointerUp = (
  data: DragEndResult,
  e: DragInteractionEvent
) => void;

export interface DraggableSectionProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "onPointerDown" | "onPointerMove" | "onPointerUp" | "onClick"
  > {
  /** A ref to the container element that defines the bounds of the draggable area. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** The orientation of the drag action. */
  orientation: DraggableSectionOrientation;
  /** The anchor point from which the drag is measured. */
  anchor: DraggableSectionAnchor;
  /** The minimum value the drag can be clamped to. */
  clampMin?: number | string;
  /** The maximum value the drag can be clamped to. */
  clampMax?: number | string;
  /** Array of values (px or percent) to snap to on release */
  snapPoints?: (number | string)[];
  /** Callback fired when the pointer is pressed down on the section. */
  onPointerDown?: DraggableSectionOnPointerDown;
  /** Callback fired when the pointer moves after being pressed down. */
  onPointerMove?: DraggableSectionOnPointerMove;
  /** Callback fired when the pointer is released. */
  onPointerUp?: DraggableSectionOnPointerUp;
  /** Callback fired when the section is activated without dragging (a tap or click). */
  onClick?: (e: DragInteractionEvent) => void;
  /** Custom class name to apply to the draggable section. */
  className?: string;
  /** Whether the draggable section can currently be dragged. Defaults to true. */
  draggable?: boolean;
  /** The content to be rendered inside the draggable section. */
  children: React.ReactNode;
}
