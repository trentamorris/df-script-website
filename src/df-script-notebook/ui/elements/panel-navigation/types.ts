import React from "react";
import { PopperPlacementType } from "@mui/material";

export interface NavigationPanelItem {
  id: string;
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  /** Sub-panel content to navigate into */
  subPanel?: React.ReactNode;
  /** If true, item is accessible for programmatic subpanel routing (e.g. initialItemId) but not rendered as a list row in main view */
  hidden?: boolean;
}

export interface NavigationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  title?: string;
  items?: NavigationPanelItem[];
  children?: React.ReactNode;
  className?: string;
  placement?: PopperPlacementType;
  initialItemId?: string | null;
  /** Optional callback fired when navigating back in the stack or exiting a subpanel */
  onNavigateBack?: () => void;
  /** Whether the panel dynamically clamps its height to never bleed past the window boundary. Default: true */
  constrainToWindow?: boolean;
  /** Custom max-height constraint (e.g. 500, '60vh'). When omitted, calculates dynamically based on window. */
  maxHeight?: number | string;
  /**
   * If true (default), clicking anywhere outside automatically closes the panel.
   */
  dismissOnClickOutside?: boolean;
  /**
   * If true, renders a transparent backdrop overlay that absorbs the outside click,
   * requiring the user to dismiss the menu first before interacting with underlying elements.
   * If false (default), outside clicks immediately pass through to interact with underlying elements.
   */
  blockOutsideClicks?: boolean;
}

export interface NavigationPanelHeaderProps {
  title: string;
  onBack: () => void;
}
