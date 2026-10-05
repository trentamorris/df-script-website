import React from "react";
import { PopperPlacementType } from "@mui/material";

export interface PanelItemRenderProps {
  isFocused: boolean;
  disabled?: boolean;
}

export interface PanelItemProps {
  id?: string;
  icon?: React.ReactNode;
  label?: React.ReactNode;
  value?: React.ReactNode;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  isFocused?: boolean;
  className?: string;
  onMouseEnter?: () => void;
  /**
   * Optional custom render function to render whatever you want inside the item,
   * receiving keyboard focus and disabled state.
   */
  render?: (props: PanelItemRenderProps) => React.ReactNode;
  children?: React.ReactNode | ((props: PanelItemRenderProps) => React.ReactNode);
}

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
  /** Disable interaction */
  disabled?: boolean;
  /** Optional custom class name for the item */
  className?: string;
  /** Optional custom render function for this row */
  render?: (props: PanelItemRenderProps) => React.ReactNode;
}

export interface NavigationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  title?: string;
  items?: NavigationPanelItem[];
  children?: React.ReactNode;
  className?: string;
  /** Optional custom class name for the items container list (defaults to 'p-3 flex flex-col gap-0.5') */
  itemsContainerClassName?: string;
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
  /**
   * If true, centers the panel in the viewport as a modal dialog with a backdrop
   * rather than anchoring to anchorEl with Popper. Default: false
   */
  isModal?: boolean;
  /**
   * Custom backdrop background styling when isModal or blockOutsideClicks is enabled.
   * Defaults to 'rgba(0, 0, 0, 0.5)' when isModal is true, or 'transparent' when false.
   */
  backdropColor?: string;
}

export const DEFAULT_PANEL_NAV_BACKDROP = "var(--panel-nav-backdrop, rgba(0, 0, 0, 0.6))";

export interface NavigationPanelHeaderProps {
  title: string;
  onBack: () => void;
}

