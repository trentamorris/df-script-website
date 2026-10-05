import React from "react";

export type MarqueeProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
  pxPerSecond?: number;
  gapPx?: number;
  pauseOnLoop?: boolean;
  /** If true, the left edge will not have a fade effect */
  noFadeLeft?: boolean;
  /** If true, the right edge will not have a fade effect */
  noFadeRight?: boolean;
  /** The color used for the fade-out effect on the edges. Default's to var(--mui-palette-background-default) */
  fadeColor?: string;
  /** An object of classNames to apply to the internal elements of the marquee. */
  internalClassNames?: {
    /** Class name for the inner div that holds the scrolling text elements */
    marqueeContent?: string;
    /** Class name for the h3 text elements */
    marqueeText?: string;
  };
};
