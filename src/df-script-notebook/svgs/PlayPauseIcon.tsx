import React from "react";
import { SvgIconProps } from "./types";

export interface PlayPauseIconProps extends SvgIconProps {
  /** If true, animates to pause bars; otherwise shows play triangle */
  isPlaying?: boolean;
}

export function PlayPauseIcon({
  isPlaying = false,
  size = 24,
  className = "",
  ...props
}: PlayPauseIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`overflow-visible ${className}`}
      {...props}
    >
      {/* Left Bar / Left half of triangle */}
      <path
        d={
          isPlaying
            ? "M6 5 L10 5 L10 19 L6 19 Z"
            : "M8 5 L13 8.5 L13 15.5 L8 19 Z"
        }
        className="transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center"
      />
      {/* Right Bar / Right half of triangle */}
      <path
        d={
          isPlaying
            ? "M14 5 L18 5 L18 19 L14 19 Z"
            : "M13 8.5 L19 12 L19 12 L13 15.5 Z"
        }
        className="transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center"
      />
    </svg>
  );
}
