import React from "react";
import { createPortal } from "react-dom";
import { Popper, ClickAwayListener } from "@mui/material";
import { ChevronRight, ArrowBack, Close } from "@mui/icons-material";
import { NavigationPanelItem, NavigationPanelProps, PanelItemProps, DEFAULT_PANEL_NAV_BACKDROP } from "./types";

// ============================================================================
// Antigravity PanelNavigation (Diff Review Verification Test)
// ============================================================================
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
    "flex items-center justify-between px-4 py-2.5 cursor-pointer text-[13.5px] leading-snug transition-colors duration-150 select-none";
  const stateStyle = disabled
    ? "opacity-40 cursor-not-allowed pointer-events-none"
    : "text-[var(--panel-nav-text-primary,#f1f1f1)] hover:bg-[var(--panel-nav-hover,rgba(255,255,255,0.08))]";

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
              <span className="flex items-center justify-center text-[var(--panel-nav-text-primary,#f1f1f1)] text-lg shrink-0 opacity-90">
                {icon}
              </span>
            )}
            <span className="truncate font-normal tracking-wide">{label}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[var(--panel-nav-text-secondary,#aaaaaa)] ml-3.5 shrink-0">
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
  placement = "top",
  initialItemId = null,
  onNavigateBack,
  constrainToWindow = true,
  maxHeight,
  dismissOnClickOutside = true,
  blockOutsideClicks = false,
  isModal = false,
  backdropColor,
  showCloseButton = true,
  swipeToDismiss = false,
  modalAlign = "center",
  sheetTopGap = 56,
  backdropBlur = false,
}: NavigationPanelProps) {
  const [isRendered, setIsRendered] = React.useState(isOpen);
  const [isVisible, setIsVisible] = React.useState(false);
  const [dragOffsetY, setDragOffsetY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isClosingFromDrag, setIsClosingFromDrag] = React.useState(false);
  const dragStartYRef = React.useRef(0);
  const touchStartClientYRef = React.useRef(0);
  const touchStartScrollTopRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);
  const dragOffsetYRef = React.useRef(0);

  // Sync ref to state
  React.useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  React.useEffect(() => {
    dragOffsetYRef.current = dragOffsetY;
  }, [dragOffsetY]);

  React.useEffect(() => {
    if (isOpen) {
      setDragOffsetY(0);
      dragOffsetYRef.current = 0;
      setIsDragging(false);
      isDraggingRef.current = false;
      setIsClosingFromDrag(false);
      setIsRendered(true);
      const frame1 = requestAnimationFrame(() => {
        const frame2 = requestAnimationFrame(() => {
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

  const [navStack, setNavStack] = React.useState<{ id: string; label: string; subPanel: React.ReactNode }[]>([]);
  const [shouldAnimateSlide, setShouldAnimateSlide] = React.useState(false);
  const mainViewRef = React.useRef<HTMLDivElement>(null);
  const subViewRef = React.useRef<HTMLDivElement>(null);
  const [windowMaxHeight, setWindowMaxHeight] = React.useState<number | undefined>(undefined);

  const currentSubView = navStack.length > 0 ? navStack[navStack.length - 1] : null;

  const visibleItems = React.useMemo(() => {
    if (!items) return [];
    return items.filter((item: NavigationPanelItem) => !item.hidden);
  }, [items]);

  const updateAvailableHeight = React.useCallback(() => {
    if (!isRendered) return;

    if (isModal) {
      if (modalAlign === "bottom") {
        return;
      }
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

  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    if (!isRendered) return;

    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    const updateDimensions = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const targetEl = currentSubView ? subViewRef.current : mainViewRef.current;
        if (!targetEl || !container) return;

        const targetHeight = targetEl.scrollHeight || targetEl.offsetHeight;
        if (targetHeight > 0) {
          container.style.height = `${targetHeight}px`;
        }
      });
    };

    updateDimensions();

    const targetEl = currentSubView ? subViewRef.current : mainViewRef.current;
    const ro = new ResizeObserver(() => {
      updateDimensions();
    });

    if (targetEl) {
      ro.observe(targetEl);
      const child = targetEl.firstElementChild as HTMLElement;
      if (child) ro.observe(child);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [currentSubView, isRendered, items]);

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

  // Coordinated native touch gesture on the container to properly dismiss sheet
  // React's onTouchMove is passive by default, so we attach native listeners with { passive: false }
  React.useEffect(() => {
    if (!isModal || !swipeToDismiss || !isRendered) return;
    const container = containerRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchStartClientYRef.current = touch.clientY;
      const currentScrollEl = currentSubView ? subViewRef.current : mainViewRef.current;
      touchStartScrollTopRef.current = currentScrollEl ? currentScrollEl.scrollTop : 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      const currentScrollEl = currentSubView ? subViewRef.current : mainViewRef.current;
      const currentScrollTop = currentScrollEl ? currentScrollEl.scrollTop : 0;
      const deltaY = touch.clientY - touchStartClientYRef.current;

      if (isDraggingRef.current) {
        if (e.cancelable) e.preventDefault();
        const nextOffset = deltaY > 0 ? deltaY : deltaY * 0.2;
        dragOffsetYRef.current = nextOffset;
        setDragOffsetY(nextOffset);
        return;
      }

      // Drag begins if user started gesture while at the top (or reached top) and pulls down
      if (deltaY > 6 && (touchStartScrollTopRef.current <= 0 || currentScrollTop <= 0)) {
        isDraggingRef.current = true;
        setIsDragging(true);
        touchStartClientYRef.current = touch.clientY; // re-anchor start
        dragStartYRef.current = touch.clientY;
        dragOffsetYRef.current = 0;
        setDragOffsetY(0);
        if (e.cancelable) e.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);

      if (dragOffsetYRef.current > 100) {
        setIsClosingFromDrag(true);
        setDragOffsetY(window.innerHeight);
        setTimeout(() => {
          onClose();
        }, 250);
      } else {
        dragOffsetYRef.current = 0;
        setDragOffsetY(0);
      }
    };

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isModal, swipeToDismiss, isRendered, currentSubView, onClose]);

  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isModal || !swipeToDismiss) return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button, a, input, [role='button']")) {
      return;
    }
    setIsDragging(true);
    dragStartYRef.current = e.clientY - dragOffsetY;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleDragPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaY = e.clientY - dragStartYRef.current;
    if (deltaY > 0) {
      setDragOffsetY(deltaY);
    } else {
      setDragOffsetY(deltaY * 0.2);
    }
  };

  const handleDragPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignored
    }
    if (dragOffsetY > 100) {
      setIsClosingFromDrag(true);
      setDragOffsetY(window.innerHeight);
      setTimeout(() => {
        onClose();
      }, 250);
    } else {
      setDragOffsetY(0);
    }
  };

  const resolvedSheetTopGap = typeof sheetTopGap === "number" ? `${sheetTopGap}px` : sheetTopGap;

  const resolvedMaxHeight =
    maxHeight !== undefined
      ? typeof maxHeight === "number"
        ? `${maxHeight}px`
        : maxHeight
      : isModal && modalAlign === "bottom"
        ? `calc(100dvh - 16px - ${resolvedSheetTopGap})`
        : windowMaxHeight
          ? `${windowMaxHeight}px`
          : "calc(100vh - 32px)";

  const resolvedBackdropBg = backdropColor ?? (isModal ? DEFAULT_PANEL_NAV_BACKDROP : "transparent");
  const resolvedBackdropFilter = backdropBlur
    ? typeof backdropBlur === "string"
      ? backdropBlur
      : "blur(12px)"
    : undefined;

  if (!isRendered) return null;

  const panelContent = (
    <div
      ref={containerRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      style={{
        maxHeight: resolvedMaxHeight,
      }}
      className={`relative w-full flex flex-col rounded-2xl overflow-hidden select-none font-sans outline-none
        bg-[#212121] backdrop-blur-xl
        shadow-[0_16px_50px_rgba(0,0,0,0.85)] text-[var(--panel-nav-text-primary,#f1f1f1)]
        transition-[height,width] duration-250 ease-[cubic-bezier(0.2,0.0,0.0,1.0)]
        animate-in fade-in zoom-in-95 ${className}`}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Two-panel horizontal sliding track */}
      <div
        className={`flex w-[200%] items-start max-h-full overflow-hidden ${shouldAnimateSlide ? "transition-transform duration-250 ease-[cubic-bezier(0.2,0.0,0.0,1.0)]" : "transition-none"
          } ${currentSubView ? "-translate-x-1/2" : "translate-x-0"}`}
      >
        {/* Main Menu Panel */}
        <div
          ref={mainViewRef}
          style={{ maxHeight: resolvedMaxHeight }}
          className="w-1/2 shrink-0 box-border overflow-y-auto overscroll-contain"
        >
          {title && (
            <div
              className={`sticky top-0 z-10 bg-[#212121] flex flex-col border-b border-white/10 select-none ${isModal && swipeToDismiss ? "cursor-grab active:cursor-grabbing touch-none" : ""
                }`}
              onPointerDown={handleDragPointerDown}
              onPointerMove={handleDragPointerMove}
              onPointerUp={handleDragPointerUp}
              onPointerCancel={handleDragPointerUp}
            >
              {isModal && swipeToDismiss && (
                <div className="w-full flex items-center justify-center pt-2.5 pb-1">
                  <div className="w-9 h-1 rounded-full bg-white/25 hover:bg-white/40 transition-colors" />
                </div>
              )}
              <div className="px-4 py-3 flex items-center justify-between text-sm font-semibold tracking-wide text-white">
                <span className="truncate flex-1 pr-2">{title}</span>
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    aria-label="Close"
                  >
                    <Close sx={{ fontSize: 18 }} />
                  </button>
                )}
              </div>
            </div>
          )}

          {items && items.length > 0 && (
            <div className={itemsContainerClassName ?? "p-2 flex flex-col gap-0.5"}>
              {visibleItems.map((item: NavigationPanelItem) => (
                <PanelItem
                  key={item.id}
                  icon={item.icon}
                  label={item.label}
                  value={item.value}
                  disabled={item.disabled}
                  className={item.className ?? "!px-3.5 !py-2.5 rounded-xl"}
                  render={item.render}
                  rightElement={
                    <>
                      {item.rightElement}
                      {item.subPanel && (
                        <ChevronRight sx={{ fontSize: 18, color: "var(--panel-nav-text-secondary,#aaaaaa)" }} />
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
            className="sticky top-0 z-10 bg-[#212121] flex items-center gap-3 px-4 py-3.5 text-xs font-semibold cursor-pointer
              text-white hover:bg-white/5 transition-colors duration-150"
            onClick={() => {
              setNavStack((prev) => prev.slice(0, -1));
              onNavigateBack?.();
            }}
          >
            <ArrowBack sx={{ fontSize: 18 }} />
            <span>{currentSubView?.label || "Back"}</span>
          </div>
          <div className="p-3 text-xs text-zinc-200">
            {currentSubView?.subPanel}
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    const alignClass = modalAlign === "bottom" ? "items-end" : "items-center";

    const modalMarkup = (
      <div
        className={`fixed inset-0 z-[99999] flex ${alignClass} justify-center p-2 transition-opacity duration-200 ease-out ${isVisible && !isClosingFromDrag ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        style={{
          backgroundColor: resolvedBackdropBg,
          backdropFilter: resolvedBackdropFilter,
          WebkitBackdropFilter: resolvedBackdropFilter,
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget && dismissOnClickOutside && !isDragging) {
            onClose();
          }
        }}
      >
        <ClickAwayListener
          onClickAway={() => {
            if (dismissOnClickOutside && isVisible && !isDragging) {
              onClose();
            }
          }}
        >
          <div
            className={`w-[calc(100vw-16px)] max-w-sm flex justify-center ${isDragging ? "transition-none pointer-events-none select-none" : "transition-all duration-250 ease-[cubic-bezier(0.2,0.0,0.0,1.0)]"
              } ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
            style={{
              transform:
                dragOffsetY !== 0
                  ? `translate3d(0, ${dragOffsetY}px, 0)`
                  : undefined,
            }}
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
              offset: [0, 10],
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
