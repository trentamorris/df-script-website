import React from "react";
import { Popper, ClickAwayListener } from "@mui/material";
import { ChevronRight, ArrowBack } from "@mui/icons-material";
import { NavigationPanelItem, NavigationPanelProps } from "./types";

export default function PanelNavigation({
  isOpen,
  onClose,
  anchorEl,
  title,
  items,
  children,
  className = "",
  placement = "left-start",
  initialItemId = null,
  onNavigateBack,
  constrainToWindow = true,
  maxHeight,
  dismissOnClickOutside = true,
  blockOutsideClicks = false,
}: NavigationPanelProps) {
  // Track navigation stack of subpanel IDs/objects to allow multi-level drill-down (Global -> Cell -> Editor)
  const [navStack, setNavStack] = React.useState<{ id: string; label: string; subPanel: React.ReactNode }[]>([]);
  const [shouldAnimateSlide, setShouldAnimateSlide] = React.useState(false);
  const mainViewRef = React.useRef<HTMLDivElement>(null);
  const subViewRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = React.useState<number | undefined>(undefined);
  const [windowMaxHeight, setWindowMaxHeight] = React.useState<number | undefined>(undefined);

  const currentSubView = navStack.length > 0 ? navStack[navStack.length - 1] : null;

  // Dynamically calculate available viewport height below/above anchor element with a safety margin
  const updateAvailableHeight = React.useCallback(() => {
    if (!isOpen) return;

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
      // Guarantee at least 200px or fallback to 80% viewport
      setWindowMaxHeight(Math.max(200, Math.floor(available > 150 ? available : viewportHeight * 0.8)));
    } else {
      setWindowMaxHeight(Math.floor(window.innerHeight - 32));
    }
  }, [isOpen, anchorEl, placement, constrainToWindow]);

  React.useLayoutEffect(() => {
    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    window.addEventListener("scroll", updateAvailableHeight, { passive: true });
    return () => {
      window.removeEventListener("resize", updateAvailableHeight);
      window.removeEventListener("scroll", updateAvailableHeight);
    };
  }, [updateAvailableHeight]);

  // Sync container height with active panel view for fluid height transition
  React.useLayoutEffect(() => {
    if (!isOpen) return;

    if (currentSubView && subViewRef.current) {
      setContentHeight(subViewRef.current.offsetHeight);
    } else if (mainViewRef.current) {
      setContentHeight(mainViewRef.current.offsetHeight);
    }
  }, [currentSubView, isOpen, items, children]);

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

  if (!isOpen) return null;

  const resolvedMaxHeight =
    maxHeight !== undefined
      ? typeof maxHeight === "number"
        ? `${maxHeight}px`
        : maxHeight
      : windowMaxHeight
        ? `${windowMaxHeight}px`
        : "calc(100vh - 32px)";

  return (
    <>
      {/* Optional dismiss-mask backdrop that blocks and consumes outside clicks */}
      {blockOutsideClicks && (
        <div
          className="fixed inset-0 z-[9998] bg-transparent"
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
          <div
            style={{
              height: contentHeight ? `${contentHeight}px` : "auto",
              maxHeight: resolvedMaxHeight,
            }}
            className={`relative min-w-[260px] max-w-[320px] flex flex-col rounded-xl overflow-hidden select-none font-sans
              bg-[var(--panel-nav-bg)] backdrop-blur-xl border border-[var(--panel-nav-border)]
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
                <div className="py-1">
                  {items
                    .filter((item: NavigationPanelItem) => !item.hidden)
                    .map((item: NavigationPanelItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-2.5 cursor-pointer text-[13.5px] leading-snug
                        text-[var(--panel-nav-text-primary)] hover:bg-[var(--panel-nav-hover)] transition-colors duration-150"
                      onClick={() => {
                        if (item.subPanel) {
                          setNavStack((prev) => [...prev, { id: item.id, label: item.label, subPanel: item.subPanel }]);
                        } else if (item.onClick) {
                          item.onClick();
                        }
                      }}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {item.icon && (
                          <span className="flex items-center justify-center text-[var(--panel-nav-text-primary)] text-lg shrink-0 opacity-90">
                            {item.icon}
                          </span>
                        )}
                        <span className="truncate font-normal tracking-wide">{item.label}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-[var(--panel-nav-text-secondary)] ml-3.5 shrink-0">
                        {item.value && <span>{item.value}</span>}
                        {item.rightElement}
                        {item.subPanel && (
                          <ChevronRight sx={{ fontSize: 18, color: "var(--panel-nav-text-secondary)" }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {children && (
                <div className={items && items.length > 0 ? "border-t border-[var(--panel-nav-border)] p-3" : "p-3"}>
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
      </ClickAwayListener>
    </Popper>
    </>
  );
}
