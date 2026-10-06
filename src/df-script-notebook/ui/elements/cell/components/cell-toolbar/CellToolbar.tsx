import React from "react";

export interface CellToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const CellToolbar = React.forwardRef<HTMLDivElement, CellToolbarProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-between mb-3 select-none pl-1 w-full gap-2 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CellToolbar.displayName = "CellToolbar";

export default CellToolbar;
