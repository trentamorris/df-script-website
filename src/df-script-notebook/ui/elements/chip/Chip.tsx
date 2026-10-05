import React from "react";
import { ChipProps } from "./types";

const VARIANT_STYLES = {
  default:
    "bg-[var(--nb-bg-hover)] text-[var(--nb-text-heading)] hover:bg-[var(--cell-badge-hover)] hover:text-[var(--nb-text-primary)] font-medium",
  active:
    "bg-[var(--cell-bg-chip-hover)] text-[var(--cell-text-dark)] hover:bg-[var(--cell-bg-chip-hover)]/90 font-medium",
  muted:
    "bg-[var(--nb-bg-hover)] text-[var(--nb-text-muted)] hover:bg-[var(--cell-badge-hover)] hover:text-[var(--nb-text-primary)] font-medium",
  accent:
    "bg-[var(--cell-accent-blue)]/20 text-[var(--cell-accent-blue)] hover:bg-[var(--cell-accent-blue)]/30 font-semibold",
  primary:
    "bg-[var(--cell-bg-chip-hover)] text-[var(--cell-text-dark)] hover:bg-[var(--cell-bg-chip-hover)]/90 font-semibold shadow-[var(--cell-shadow-float)]",
} as const;

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      variant = "default",
      pressFeedback = true,
      children,
      className = "",
      type = "button",
      ...rest
    },
    ref
  ) => {
    const feedbackClass = pressFeedback ? "press-fdbk" : "";
    return (
      <button
        ref={ref}
        type={type}
        className={`h-8 px-3 rounded-lg text-[14px] font-sans tracking-tight transition-colors cursor-pointer border-0 select-none whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${feedbackClass} ${VARIANT_STYLES[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Chip.displayName = "Chip";
