import React from "react";
import MuiTooltip from "@mui/material/Tooltip";
import type { TooltipProps } from "./types";

export function Tooltip({
  content,
  shortcut,
  children,
  placement = "bottom",
  enterDelay = 200,
  leaveDelay = 0,
  className = "",
  ...props
}: TooltipProps) {
  if (!content) {
    return children;
  }

  return (
    <MuiTooltip
      placement={placement}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      arrow={false}
      slotProps={{
        popper: {
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [0, 6],
              },
            },
          ],
        },
        tooltip: {
          className: `!bg-[#141414]/95 !backdrop-blur-md !border !border-white/10 !text-zinc-200 !text-[11.5px] !font-outfit !py-1 !px-2.5 !rounded-md !shadow-2xl !tracking-normal !leading-tight select-none ${className}`,
        },
      }}
      title={
        <div className="flex items-center gap-2">
          <span>{content}</span>
          {shortcut && (
            <kbd className="px-1 py-0.5 bg-white/10 border border-white/10 rounded text-[9px] font-mono text-zinc-400 leading-none">
              {shortcut}
            </kbd>
          )}
        </div>
      }
      {...props}
    >
      {children}
    </MuiTooltip>
  );
}
