import React from "react";

export type ChipVariant = "default" | "active" | "accent" | "muted" | "primary";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChipVariant;
  pressFeedback?: boolean;
  /** Whether color and background-color transition smoothly between states. Defaults to true. */
  transition?: boolean;
  /** Whether hover styles are enabled. Defaults to false. */
  hoverFeedback?: boolean;
  children: React.ReactNode;
}
