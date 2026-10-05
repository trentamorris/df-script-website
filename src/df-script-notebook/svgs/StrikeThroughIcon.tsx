import React from "react";
import { SvgIconProps } from "./types";

export function StrikeThroughIcon({
  size,
  className = "w-full h-full p-1",
  ...props
}: SvgIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
      {...props}
    >
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  );
}
