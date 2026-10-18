import React from "react";

export interface CarouselProps<T = any> extends React.HTMLAttributes<HTMLDivElement> {
  /** The 0-based index of the currently active slide. */
  activeIndex: number;
  /** Optional array of items to render using renderSlide. */
  items?: T[];
  /** Render callback for each item in items array. */
  renderSlide?: (item: T, index: number) => React.ReactNode;
  /** Children slides (alternative to items + renderSlide). */
  children?: React.ReactNode;
  /** Transition duration in ms (defaults to 350). */
  duration?: number;
  /** CSS easing timing function (defaults to "cubic-bezier(0.25, 1, 0.5, 1)"). */
  easing?: string;
  /** Custom class for the outer viewport container. */
  className?: string;
  /** Custom class for the sliding flex track. */
  trackClassName?: string;
  /** Custom class for each slide item wrapper. */
  slideClassName?: string;
  /** Whether navigation wraps around infinitely. Defaults to true. */
  loop?: boolean;
}

