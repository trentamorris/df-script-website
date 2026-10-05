import React from "react";
import { SvgIconProps } from "./types";

export function CrosshairIcon({
  style,
  ...props
}: SvgIconProps) {
  return (
    <svg
      style={{
        position: "absolute",
        width: "11px",
        height: "11px",
        overflow: "visible",
        ...style,
      }}
      viewBox="0 0 11 11"
      fill="none"
      {...props}
    >
      <path
        d="M 5.5 1 L 5.5 10 M 1 5.5 L 10 5.5"
        stroke="var(--nb-grid-crosshair)"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
