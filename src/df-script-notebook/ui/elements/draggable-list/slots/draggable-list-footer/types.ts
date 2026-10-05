import React from "react";

export type DraggableListFooterButtonProps = Omit<React.ComponentProps<"button">, "children"> & {
  label?: string;
  render?: () => React.ReactNode;
};
