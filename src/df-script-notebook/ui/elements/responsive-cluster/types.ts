import React from "react";

export type ShowAsAction = "always" | "ifRoom" | "never";

export interface ResponsiveClusterItem {
  id: string;
  element: React.ReactNode;

  /**
   * Row alignment: 'start' (left), 'center', or 'end' (right). Default: 'start'.
   */
  align?: "start" | "center" | "end";

  /**
   * Visual display order within its alignment zone (lower numbers render first). Default: array order.
   */
  order?: number;

  /**
   * Collapse priority when space runs out. Lower numbers collapse first. Default: 0.
   */
  priority?: number;

  /**
   * If false or permanent is true, this item will never collapse or hide.
   */
  collapsible?: boolean;
  permanent?: boolean;

  /**
   * Android-style action policy:
   * - 'always': Never collapses (alias for collapsible: false)
   * - 'ifRoom': Collapses when width is constrained (default)
   * - 'never': Strictly placed into overflow menu
   */
  showAsAction?: ShowAsAction;

  // Metadata for overflow menu rendering
  label?: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  subPanel?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

export interface ResponsiveClusterProps {
  /** Single uniform list of items with order, alignment, priority, and display policy */
  items: ResponsiveClusterItem[];

  /** Whether to show the '...' overflow menu button when items collapse (default: true). Set false to simply hide collapsed items */
  showOverflowMenu?: boolean;
  /** Minimum parent height in pixels before the entire cluster fades out */
  minParentHeight?: number;
  /** Minimum parent width in pixels before the entire cluster fades out */
  minParentWidth?: number;
  /** Gap between items in pixels (default: 8) */
  gap?: number;
  /** Custom class for the cluster container */
  className?: string;
}

// Backwards compatibility aliases
export type ResponsiveToolbarItem = ResponsiveClusterItem;
export type ResponsiveToolbarProps = ResponsiveClusterProps;
