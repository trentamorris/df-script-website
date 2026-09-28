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
}

export interface NavigationPanelHeaderProps {
  title: string;
  onBack: () => void;
}
