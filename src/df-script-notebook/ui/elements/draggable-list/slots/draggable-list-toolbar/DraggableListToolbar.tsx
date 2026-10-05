import React from "react";
import { Search, Close, ArrowUpward, UnfoldMoreDouble, UnfoldLessDouble, Refresh } from "@mui/icons-material";
import {
  DraggableListToolbarSearchInputProps,
  DraggableListToolbarSortButtonProps,
  DraggableListToolbarExpandAllButtonProps,
  DraggableListToolbarRefreshButtonProps,
} from "./types";
import styles from "./draggableListToolbar.module.css";

export const DraggableListToolbarSearchInput = React.forwardRef<HTMLInputElement, DraggableListToolbarSearchInputProps>(
  ({ visible = true, variant = "base", className, ...props }, ref) => {
    const hasValue = Boolean(String(props.value ?? "").length > 0);

    if (!visible) return null;

    return (
      <div className={`px-[8px] pb-[4px] pt-[4px] ${className ?? ""}`}>
        <div
          className={`flex items-center gap-[4px] w-[100%] px-[10px] py-[3px] text-[0.875rem] rounded-[14px] bg-[var(--nb-bg-raised,rgba(255,255,255,0.06))] text-[var(--nb-text-primary,white)] ${styles.searchInputWrapper}`}
          data-variant={variant}
        >
          <Search className={`shrink-0 opacity-[0.5] text-[1.25rem] ${styles.searchInputIcon}`} />
          <input
            ref={ref}
            type="text"
            autoComplete="off"
            placeholder={props.placeholder ?? "Search..."}
            className={`flex-1 bg-transparent outline-none border-none text-inherit placeholder:opacity-50 ${styles.searchInputField}`}
            {...props}
          />
          {hasValue && (
            <button
              type="button"
              className="flex items-center justify-center shrink-0 rounded-[50%] min-h-[14px] min-w-[14px] cursor-pointer border-none bg-transparent hover:opacity-100 opacity-60 text-inherit"
              onClick={() => {
                const nativeEvent = new Event("change", { bubbles: true });
                props.onChange?.({
                  target: { value: "" },
                  currentTarget: { value: "" },
                  nativeEvent,
                } as React.ChangeEvent<HTMLInputElement>);
              }}
            >
              <Close className={`opacity-[0.5] text-[1.25rem] ${styles.searchInputClearIcon}`} />
            </button>
          )}
        </div>
      </div>
    );
  }
);

DraggableListToolbarSearchInput.displayName = "DraggableListToolbarSearchInput";

export const DraggableListToolbarSortButton = React.forwardRef<HTMLButtonElement, DraggableListToolbarSortButtonProps>(
  ({ direction, render, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`flex items-center justify-center shrink-0 rounded-[50%] min-h-[36px] min-w-[36px] border-none bg-transparent text-inherit cursor-pointer hover:bg-white/10 active:bg-white/15 ${className ?? ""}`}
        {...props}
      >
        {render ? (
          render(direction)
        ) : (
          <ArrowUpward
            fontSize="small"
            sx={{
              transition: "transform 0.2s ease",
              transform: direction === "desc" ? "rotate(180deg)" : undefined,
            }}
          />
        )}
      </button>
    );
  }
);

DraggableListToolbarSortButton.displayName = "DraggableListToolbarSortButton";

export const DraggableListToolbarExpandAllButton = React.forwardRef<
  HTMLButtonElement,
  DraggableListToolbarExpandAllButtonProps
>(
  ({ expanded, render, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={`flex items-center justify-center shrink-0 rounded-[50%] min-h-[36px] min-w-[36px] border-none bg-transparent text-inherit cursor-pointer hover:bg-white/10 active:bg-white/15 ${className ?? ""}`}
        {...props}
      >
        {render ? (
          render(expanded)
        ) : expanded ? (
          <UnfoldLessDouble fontSize="small" />
        ) : (
          <UnfoldMoreDouble fontSize="small" />
        )}
      </button>
    );
  }
);

DraggableListToolbarExpandAllButton.displayName = "DraggableListToolbarExpandAllButton";

export const DraggableListToolbarRefreshButton = React.forwardRef<
  HTMLButtonElement,
  DraggableListToolbarRefreshButtonProps
>(
  ({ refreshing = false, render, className, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        aria-disabled={refreshing}
        aria-busy={refreshing}
        onClick={refreshing ? undefined : onClick}
        className={`flex items-center justify-center shrink-0 rounded-[50%] min-h-[36px] min-w-[36px] border-none bg-transparent text-inherit cursor-pointer hover:bg-white/10 active:bg-white/15 ${
          refreshing ? "pointer-events-none opacity-[0.5]" : ""
        } ${className ?? ""}`}
        {...props}
        disabled={refreshing || props.disabled}
      >
        {render ? (
          render(refreshing)
        ) : (
          <Refresh
            fontSize="small"
            className={refreshing ? "animate-spin" : undefined}
          />
        )}
      </button>
    );
  }
);

DraggableListToolbarRefreshButton.displayName = "DraggableListToolbarRefreshButton";
