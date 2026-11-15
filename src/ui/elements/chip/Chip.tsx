import React from "react";
import { ChipProps } from "./types";

const VARIANT_STYLES = {
  default:
    "bg-[#181818] text-white font-normal",
  active:
    "bg-white text-black font-medium",
  muted:
    "bg-[#141414] text-zinc-400 font-normal",
  accent:
    "bg-white/15 text-white font-medium",
  primary:
    "bg-white text-black font-medium shadow-sm",
} as const;

const HOVER_STYLES = {
  default: "hover:bg-[#222222]",
  active: "hover:bg-zinc-200",
  muted: "hover:bg-[#1a1a1a]",
  accent: "hover:bg-white/20",
  primary: "hover:bg-zinc-200",
} as const;

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  (
    {
      variant = "default",
      pressFeedback = true,
      hoverFeedback = false,
      transition = true,
      children,
      className = "",
      type = "button",
      ...rest
    },
    ref
  ) => {
    const feedbackClass = pressFeedback ? "press-fdbk" : "";
    const hoverClass = hoverFeedback ? HOVER_STYLES[variant] : "";
    const transitionClass = transition ? "transition-colors duration-150 ease-out" : "";
    return (
      <button
        ref={ref}
        type={type}
        className={`h-8 px-3 rounded-[8px] text-xs tracking-wide cursor-pointer border-0 outline-none select-none whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5 ${transitionClass} ${feedbackClass} ${hoverClass} ${VARIANT_STYLES[variant]} ${className}`}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

Chip.displayName = "Chip";
