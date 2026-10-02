import React from "react";

export type DraggableListToolbarSearchInputVariant = "base" | "filled";

export type DraggableListToolbarSearchInputProps = React.ComponentProps<"input"> & {
  visible?: boolean;
  variant?: DraggableListToolbarSearchInputVariant;
};

export type DraggableListToolbarSortButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  direction: "asc" | "desc";
  render?: (direction: "asc" | "desc") => React.ReactNode;
};

export type DraggableListToolbarExpandAllButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  expanded: boolean;
  render?: (expanded: boolean) => React.ReactNode;
};

export type DraggableListToolbarRefreshButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  refreshing?: boolean;
  render?: (refreshing: boolean) => React.ReactNode;
};
