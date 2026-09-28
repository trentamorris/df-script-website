import React from "react";

export type ScrollableCanvasDirection = "left" | "right";

export type ScrollableCanvasArrowProps = {
  direction: ScrollableCanvasDirection;
  onClick: () => void;
};

export type ScrollableCanvasProps = {
  children?: React.ReactNode;
  className?: string;
  scrollContentStartOffset?: string | number;
  scrollContentEndOffset?: string | number;
  gap?: string | number;
  arrowBackgroundColor?: string;
  arrowColor?: string;
  onOverflowChange?: (hasOverflow: boolean) => void;
};

export type ScrollableCanvasHandle = {
  scrollToElement: (element: HTMLElement, behavior?: ScrollBehavior) => void;
};
