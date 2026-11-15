import React from "react";

export interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  backdropColor?: string;
  backdropBlur?: boolean | string;
  dismissOnClickOutside?: boolean;
  showCloseButton?: boolean;
  swipeToDismiss?: boolean;
  maxHeight?: number | string;
}

export const DEFAULT_MODAL_SHEET_BACKDROP = "rgba(0, 0, 0, 0.6)";
