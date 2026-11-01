import React from "react";
import type { TabContextValue, TabShelfProps, TabProps } from "./types";

const TabContext = React.createContext<TabContextValue<any> | undefined>(undefined);

export function TabShelf<V>({ children, activeValue, onChange, className, ...rest }: TabShelfProps<V>) {
  const contextValue = React.useMemo(
    () => ({
      activeValue,
      onSelect: (value: V) => {
        if (onChange) onChange(value);
      },
    }),
    [activeValue, onChange]
  );

  const tabCount = React.Children.count(children);
  const childrenArray = React.Children.toArray(children);
  const activeIndex = childrenArray.findIndex(
    (child) => React.isValidElement<TabProps<V>>(child) && child.props.value === activeValue
  );

  const safeIndex = Math.min(Math.max(activeIndex, 0), Math.max(tabCount - 1, 0));
  const widthFraction = tabCount > 0 ? 1 / tabCount : 1;
  const translateFraction = safeIndex * widthFraction;

  return (
    <TabContext.Provider value={contextValue}>
      <div
        role="tablist"
        className={`relative overflow-hidden whitespace-nowrap flex items-center w-fit ${
          className ?? ""
        }`}
        {...rest}
      >
        {children}

        {/* Selection Indicator */}
        <div
          className="selection-bar absolute bottom-0 left-0 h-[2px] w-full bg-white rounded-full pointer-events-none"
          style={{
            transformOrigin: "left center",
            transition: "transform 200ms cubic-bezier(0.16, 1, 0.3, 1)",
            transform: `translateX(${translateFraction * 100}%) scaleX(${widthFraction})`,
          }}
        />
      </div>
    </TabContext.Provider>
  );
}

export function Tab<V>({ value, children, className, ...rest }: TabProps<V>) {
  const context = React.useContext(TabContext);
  if (!context) throw new Error("Tab must be used within TabShelf");

  const isActive = context.activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => context.onSelect(value)}
      className={`inline-flex relative pb-3 px-4 text-xs font-semibold transition-colors cursor-pointer select-none items-center justify-center whitespace-nowrap ${
        isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
      } ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
