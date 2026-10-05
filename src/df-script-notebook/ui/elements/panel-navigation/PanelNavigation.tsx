import React from "react";
import { createPortal } from "react-dom";
import { Popper, ClickAwayListener } from "@mui/material";
import { ChevronRight, ArrowBack } from "@mui/icons-material";
import { NavigationPanelItem, NavigationPanelProps, PanelItemProps, DEFAULT_PANEL_NAV_BACKDROP } from "./types";

export function PanelItem({
  icon,
  label,
  value,
  rightElement,
  onClick,
  disabled = false,
  className = "",
  onMouseEnter,
  render,
  children,
}: PanelItemProps) {
  const baseStyle =
    "flex items-center justify-between px-4 py-2.5 cursor-pointer text-[13.5px] leading-snug transition-colors duration-150";
  const stateStyle = disabled
    ? "opacity-40 cursor-not-allowed pointer-events-none"
    : "text-[var(--panel-nav-text-primary)] hover:bg-[var(--panel-nav-hover)]";

  return (
    <div
      role="menuitem"
      aria-disabled={disabled}
      className={`${baseStyle} ${stateStyle} ${className}`}
      onMouseEnter={onMouseEnter}
      onClick={() => {
        if (!disabled && onClick) onClick();
      }}
    >
      {render ? (
        render({ isFocused: false, disabled })
      ) : typeof children === "function" ? (
        children({ isFocused: false, disabled })
      ) : children ? (
        children
      ) : (
        <>
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {icon && (
              <span className="flex items-center justify-center text-[var(--panel-nav-text-primary)] text-lg shrink-0 opacity-90">
                {icon}
              </span>
            )}
            <span className="truncate font-normal tracking-wide">{label}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[var(--panel-nav-text-secondary)] ml-3.5 shrink-0">
            {value && <span>{value}</span>}
            {rightElement}
          </div>
        </>
      )}
    </div>
  );
}

export default function PanelNavigation({
  isOpen,
  onClose,
  anchorEl,
  title,
  items,
  children,
  className = "",
  itemsContainerClassName,
  placement = "left-start",
  initialItemId = null,
  onNavigateBack,
  constrainToWindow = true,
  maxHeight,
  dismissOnClickOutside = true,
  blockOutsideClicks = false,
  isModal = false,
  backdropColor,
}: NavigationPanelProps) {
  // State to manage presence and exit animation
  const [isRendered, setIsRendered] = React.useState(isOpen);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      let frame1 = requestAnimationFrame(() => {
        let frame2 = requestAnimationFrame(() => {
          setIsVisible(true);
        });
        return () => cancelAnimationFrame(frame2);
      });
      return () => cancelAnimationFrame(frame1);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Track navigation stack of subpanel IDs/objects to allow multi-level drill-down
  const [navStack, setNavStack] = React.useState<{ id: string; label: string; subPanel: React.ReactNode }[]>([]);
  const [shouldAnimateSlide, setShouldAnimateSlide] = React.useState(false);
  const mainViewRef = React.useRef<HTMLDivElement>(null);
  const subViewRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = React.useState<number | undefined>(undefined);
  const [windowMaxHeight, setWindowMaxHeight] = React.useState<number | undefined>(undefined);

  const currentSubView = navStack.length > 0 ? navStack[navStack.length - 1] : null;

  const visibleItems = React.useMemo(() => {
    if (!items) return [];
    return items.filter((item: NavigationPanelItem) => !item.hidden);
  }, [items]);

  // Dynamically calculate available viewport height below/above anchor element with a safety margin
  const updateAvailableHeight = React.useCallback(() => {
    if (!isRendered) return;

    if (isModal) {
      setWindowMaxHeight(Math.floor(window.innerHeight * 0.85));
      return;
    }

    if (!constrainToWindow) {
      setWindowMaxHeight(undefined);
      return;
    }

    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom - 16;
      const spaceAbove = rect.top - 16;
      const isTopPlacement = typeof placement === "string" && placement.startsWith("top");
      const available = isTopPlacement ? spaceAbove : spaceBelow;
      setWindowMaxHeight(Math.max(200, Math.floor(available > 150 ? available : viewportHeight * 0.8)));
    } else {
      setWindowMaxHeight(Math.floor(window.innerHeight - 32));
    }
  }, [isRendered, anchorEl, placement, constrainToWindow, isModal]);

  React.useLayoutEffect(() => {
    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    window.addEventListener("scroll", updateAvailableHeight, { passive: true });
    return () => {
      window.removeEventListener("resize", updateAvailableHeight);
      window.removeEventListener("scroll", updateAvailableHeight);
    };
  }, [updateAvailableHeight]);

  // Dynamically sync container height with active panel view whenever its content changes or resizes
  React.useLayoutEffect(() => {
    if (!isRendered) return;

    const targetEl = currentSubView ? subViewRef.current : mainViewRef.current;
    if (!targetEl) return;

    const measure = () => {
      const measured = targetEl.scrollHeight || targetEl.offsetHeight;
      if (measured > 0) {
        setContentHeight(measured);
      }
    };

    measure();

    const ro = new ResizeObserver(measure);
    ro.observe(targetEl);

    const childWrapper = targetEl.querySelector<HTMLElement>(".p-3");
    if (childWrapper) {
      ro.observe(childWrapper);
    }

    return () => ro.disconnect();
  }, [currentSubView, isRendered, items, children, visibleItems]);

  // Reset or initialize stack only when open state or initialItemId prop changes
  React.useEffect(() => {
    if (!isOpen) {
      setNavStack([]);
      setShouldAnimateSlide(false);
      return;
    }

    if (initialItemId && items) {
      const match = items.find((it) => it.id === initialItemId);
      if (match?.subPanel) {
        setNavStack([{ id: match.id, label: match.label, subPanel: match.subPanel }]);
      }
    }

    const timer = setTimeout(() => setShouldAnimateSlide(true), 50);
    return () => clearTimeout(timer);
  }, [isOpen, initialItemId, items]);

  // Keyboard handler for Escape dismiss / back navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      e.preventDefault();
      if (navStack.length > 0) {
        setNavStack((prev) => prev.slice(0, -1));
        onNavigateBack?.();
      } else {
        onClose();
      }
    }
  };

  if (!isRendered) return null;

  const resolvedMaxHeight =
    maxHeight !== undefined
      ? typeof maxHeight === "number"
        ? `${maxHeight}px`
        : maxHeight
      : windowMaxHeight
        ? `${windowMaxHeight}px`
        : "calc(100vh - 32px)";

  const resolvedBackdropBg = backdropColor ?? (isModal ? DEFAULT_PANEL_NAV_BACKDROP : "transparent");

  const panelContent = (
    <div
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{
        height: contentHeight ? `${contentHeight}px` : "auto",
        maxHeight: resolvedMaxHeight,
      }}
      className={`relative min-w-[260px] max-w-[320px] flex flex-col rounded-xl overflow-hidden select-none font-sans outline-none
        bg-[var(--panel-nav-bg)] backdrop-blur-xl
        shadow-[var(--panel-nav-shadow)] text-[var(--panel-nav-text-primary)]
        transition-[height,width] duration-250 ease-[cubic-bezier(0.2,0.0,0.0,1.0)]
        animate-in fade-in zoom-in-95 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Two-panel horizontal sliding track */}
      <div
        className={`flex w-[200%] items-start max-h-full overflow-hidden ${
          shouldAnimateSlide ? "transition-transform duration-250 ease-[cubic-bezier(0.2,0.0,0.0,1.0)]" : "transition-none"
        } ${currentSubView ? "-translate-x-1/2" : "translate-x-0"}`}
      >
        {/* Main Menu Panel */}
        <div
          ref={mainViewRef}
          style={{ maxHeight: resolvedMaxHeight }}
          className="w-1/2 shrink-0 box-border overflow-y-auto overscroll-contain"
        >
          {title && (
            <div className="sticky top-0 z-10 bg-[var(--panel-nav-bg)] backdrop-blur-md px-4 py-2.5 border-b border-[var(--panel-nav-border)] text-xs font-semibold text-[var(--panel-nav-text-primary)]">
              {title}
            </div>
          )}

          {items && items.length > 0 && (
            <div className={itemsContainerClassName ?? "p-3 flex flex-col gap-0.5"}>
              {visibleItems.map((item: NavigationPanelItem) => (
                <PanelItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  disabled={item.disabled}
                  className={item.className ?? "!px-2.5 !py-2 rounded-lg"}
                  render={item.render}
                  rightElement={
                    <>
                      {item.rightElement}
                      {item.subPanel && (
                        <ChevronRight sx={{ fontSize: 18, color: "var(--panel-nav-text-secondary)" }} />
                      )}
                    </>
                  }
                  onClick={() => {
                    if (item.subPanel) {
                      setNavStack((prev) => [...prev, { id: item.id, label: item.label, subPanel: item.subPanel }]);
                    } else if (item.onClick) {
                      item.onClick();
                    }
                  }}
                />
              ))}
            </div>
          )}

          {children && (
            <div className="p-3">
              {children}
            </div>
          )}
        </div>

        {/* Sub-menu Drill-down Panel */}
        <div
          ref={subViewRef}
          style={{ maxHeight: resolvedMaxHeight }}
          className="w-1/2 shrink-0 box-border overflow-y-auto overscroll-contain"
        >
          <div
            className="sticky top-0 z-10 bg-[var(--panel-nav-bg)] backdrop-blur-md flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--panel-nav-border)] text-xs font-medium cursor-pointer
              text-[var(--panel-nav-text-primary)] hover:bg-[var(--panel-nav-hover)] transition-colors duration-150"
            onClick={() => {
              setNavStack((prev) => prev.slice(0, -1));
              onNavigateBack?.();
            }}
          >
            <ArrowBack sx={{ fontSize: 18 }} />
            <span>{currentSubView?.label || ""}</span>
          </div>
          <div className="p-3 text-xs text-[var(--panel-nav-text-primary)]">
            {currentSubView?.subPanel}
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    const modalMarkup = (
      <div
        className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 backdrop-blur-[16px] transition-opacity duration-200 ease-out ${
          isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{
          backgroundColor: resolvedBackdropBg,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && dismissOnClickOutside) {
            onClose();
          }
        }}
      >
        <ClickAwayListener
          onClickAway={() => {
            if (dismissOnClickOutside && isVisible) {
              onClose();
            }
          }}
        >
          <div
            className={`transition-opacity duration-200 ease-out ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {panelContent}
          </div>
        </ClickAwayListener>
      </div>
    );

    return typeof document !== "undefined" ? createPortal(modalMarkup, document.body) : modalMarkup;
  }

  return (
    <>
      {/* Optional dismiss-mask backdrop that blocks and consumes outside clicks */}
      {blockOutsideClicks && (
        <div
          className="fixed inset-0 z-[9998]"
          style={{ backgroundColor: resolvedBackdropBg }}
          onClick={(e) => {
            e.stopPropagation();
            if (dismissOnClickOutside) onClose();
          }}
          onMouseDown={(e) => e.stopPropagation()}
        />
      )}

      <Popper
        open={isOpen}
        anchorEl={anchorEl}
        placement={placement}
        modifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 8], // 8px spacing from anchor button
            },
          },
          {
            name: "preventOverflow",
            options: {
              padding: 8,
            },
          },
        ]}
        style={{ zIndex: 9999 }}
      >
        <ClickAwayListener
          onClickAway={() => {
            if (dismissOnClickOutside && !blockOutsideClicks) {
              onClose();
            }
          }}
        >
          {panelContent}
        </ClickAwayListener>
      </Popper>
    </>
  );
}

PanelNavigation.Item = PanelItem;

