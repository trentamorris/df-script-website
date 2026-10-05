import React from "react";
import { Add, DeleteSweep } from "@mui/icons-material";
import { DraggableListFooterButtonProps } from "./types";

export const DraggableListFooterButton = React.forwardRef<HTMLButtonElement, DraggableListFooterButtonProps>(
  ({ className, label, render, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={props["aria-label"] ?? label}
        className={`inline-flex min-w-0 max-w-full items-center justify-center gap-[4px] h-[24px] px-[12px] text-[0.8125rem] font-medium whitespace-nowrap rounded-[8px] cursor-pointer text-[var(--mui-palette-text-primary,white)] border-none hover:bg-white/10 active:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 [&:open]:min-w-0 [&:open]:truncate ${className ?? ""}`}
        {...props}
      >
        {render?.()}
      </button>
    );
  }
);

DraggableListFooterButton.displayName = "DraggableListFooterButton";

export const DraggableListFooterAddRowButton = React.forwardRef<
  HTMLButtonElement,
  DraggableListFooterButtonProps
>(
  (
    {
      label = "Add Row",
      render = () => (
        <>
          <Add sx={{ fontSize: "1.125rem" }} />
          <span>{label}</span>
        </>
      ),
      className,
      ...props
    },
    ref
  ) => {
    return (
      <DraggableListFooterButton
        ref={ref}
        className={className}
        render={render}
        {...props}
      />
    );
  }
);

DraggableListFooterAddRowButton.displayName = "DraggableListFooterAddRowButton";

export const DraggableListFooterRemoveAllRowsButton = React.forwardRef<
  HTMLButtonElement,
  DraggableListFooterButtonProps
>(
  (
    {
      label = "Remove All Rows",
      render = () => (
        <>
          <DeleteSweep sx={{ fontSize: "1.125rem" }} />
          <span>{label}</span>
        </>
      ),
      className,
      ...props
    },
    ref
  ) => {
    return (
      <DraggableListFooterButton
        ref={ref}
        className={className}
        render={render}
        {...props}
      />
    );
  }
);

DraggableListFooterRemoveAllRowsButton.displayName = "DraggableListFooterRemoveAllRowsButton";
