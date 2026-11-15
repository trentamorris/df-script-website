import React from "react";
import type { PopperPlacementType } from "@mui/material";

export interface NavigationPanelItem {
  id: string;
  label: string;
  value?: string | number;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  disabled?: boolean;
  hidden?: boolean;
  className?: string;
  subPanel?: React.ReactNode;
  onClick?: () => void;
  render?: (props: { isFocused: boolean; disabled: boolean }) => React.ReactNode;
}

export interface PanelItemProps {
  icon?: React.ReactNode;
  label?: React.ReactNode;
  value?: string | number;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  onMouseEnter?: () => void;
  render?: (props: { isFocused: boolean; disabled: boolean }) => React.ReactNode;
  children?: React.ReactNode | ((props: { isFocused: boolean; disabled: boolean }) => React.ReactNode);
}

export interface NavigationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  title?: React.ReactNode;
  items?: NavigationPanelItem[];
  children?: React.ReactNode;
  className?: string;
  itemsContainerClassName?: string;
  placement?: PopperPlacementType;
  initialItemId?: string | null;
  onNavigateBack?: () => void;
  constrainToWindow?: boolean;
  maxHeight?: number | string;
  dismissOnClickOutside?: boolean;
  blockOutsideClicks?: boolean;
  isModal?: boolean;
  backdropColor?: string;
  showCloseButton?: boolean;
  /** Whether the modal can be dismissed by swiping/dragging down on mobile. Defaults to false. */
  swipeToDismiss?: boolean;
  /** Alignment of the modal within the viewport. Defaults to "center". */
  modalAlign?: "center" | "bottom";
  /** Gap left at the top of the viewport when modal is aligned to bottom, in px or CSS length string. Defaults to "56px". */
  sheetTopGap?: number | string;
  /** Whether to blur the background backdrop in modal mode. Defaults to false. */
  backdropBlur?: boolean | string;
}

export const DEFAULT_PANEL_NAV_BACKDROP = "rgba(0, 0, 0, 0.6)";
