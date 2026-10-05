import React from "react";

export type ChipVariant = "default" | "active" | "accent" | "muted" | "primary";

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChipVariant;
  pressFeedback?: boolean;
  children: React.ReactNode;
}
