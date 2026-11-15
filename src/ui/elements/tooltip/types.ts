import type React from "react";
import type { TooltipProps as MuiTooltipProps } from "@mui/material/Tooltip";

export interface TooltipProps extends Omit<MuiTooltipProps, "title" | "content"> {
  content: React.ReactNode;
  children: React.ReactElement;
  shortcut?: string;
  className?: string;
}
