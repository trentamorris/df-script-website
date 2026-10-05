import type { DragContainerRect } from "../../../utils/dragUtils";

/** Generic Draggable Divider **/
export type DraggableDividerAnchorTypes = "left" | "right" | "top" | "bottom";
export type DraggableDividerDragDirectionTypes = "left" | "right" | "up" | "down";
export type DraggableDividerOrientationTypes = "horizontal" | "vertical";
export type DraggableClampUnit = "px" | "percent";

export type DraggableDividerContainerRect = DragContainerRect;

export type DraggableDividerEventPayload = {
  px: number;
  percent: number;
  containerRect: DraggableDividerContainerRect;
};

export type DraggableDividerOnPointerDownParams = (params: {
  e: React.PointerEvent<HTMLDivElement>;
  containerRect: DraggableDividerContainerRect;
}) => void;

/** `evt` is the pointer event while dragging, or the key event for an arrow-key step. */
export type DraggableDividerOnPointerMoveParams = (params: {
  payload: DraggableDividerEventPayload;
  evt: PointerEvent | KeyboardEvent;
}) => void;

export type DraggableDividerOnPointerUpParams = (params: {
  payload: DraggableDividerEventPayload;
  evt: PointerEvent | KeyboardEvent;
}) => void;

export type DraggableDividerProps = {
  /* Container to be resized */
  containerRef: React.RefObject<HTMLElement | null>;

  /* Horizontal resizes width; vertical resizes height */
  orientation: DraggableDividerOrientationTypes;

  /* Divider thickness (in px). Example: 2, 4. Default: 4 */
  thicknessPx?: number;

  /**
   * Which edge the divider is anchored to.
   * For horizontal: "left" or "right" (default "right").
   * For vertical: "top" or "bottom" (default "bottom").
   */
  anchor: DraggableDividerAnchorTypes;

  /**
   * Specifies the direction the user drags to **increase** the reported `px` value.
   *
   * By default (when omitted), the drag direction is inferred from the `anchor`:
   *
   * | `anchor`  | Default drag direction to increase `px` |
   * |-----------|------------------------------------------|
   * | `"left"`   | drag **right**                           |
   * | `"right"`  | drag **left**                            |
   * | `"top"`    | drag **down**                            |
   * | `"bottom"` | drag **up**                              |
   *
   * Setting `dragDirection` **inverts** this relationship when it opposes
   * the default. This is useful when a panel sits on the opposite side of
   * the layout from where the divider is anchored.
   */
  dragDirection?: DraggableDividerDragDirectionTypes;

  /** Clamp Parameters */
  clampMin?: number;
  clampMax?: number;
  clampUnit?: DraggableClampUnit; // 'px' (default) | 'percent'

  /* Pointer Hooks */
  onPointerDown?: DraggableDividerOnPointerDownParams;
  onPointerMove?: DraggableDividerOnPointerMoveParams;
  onPointerUp?: DraggableDividerOnPointerUpParams;

  /** Extra classes to merge */
  className?: string;
};
