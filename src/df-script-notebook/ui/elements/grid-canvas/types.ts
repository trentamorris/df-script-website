import React from "react";
import { PageGridConfig, CanvasPageManagementProps } from "../../../types";

export interface GridCanvasProps extends Partial<CanvasPageManagementProps> {
  gridConfig: PageGridConfig;
  isInteracting?: boolean;
  onInteractionChange?: (isInteracting: boolean) => void;
  gapPx?: number;
  paddingPx?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  slotProps?: {
    toolbar?: React.ComponentProps<"div">;
  };
  slots?: {
    toolbar?: React.ReactNode;
  };
}

export interface GridCanvasContextValue extends Partial<CanvasPageManagementProps> {
  gridConfig: PageGridConfig;
  isInteracting?: boolean;
}
