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
}: NavigationPanelProps) {
  // Track active subpanel by ID rather than caching static ReactNode content
  const [activeSubPanelId, setActiveSubPanelId] = React.useState<string | null>(initialItemId);
  const [shouldAnimateSlide, setShouldAnimateSlide] = React.useState(false);
  const mainViewRef = React.useRef<HTMLDivElement>(null);
  const subViewRef = React.useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = React.useState<number | undefined>(undefined);

  // Derive the active subpanel dynamically on each render so cell layout updates are live
  const activeItem = React.useMemo(() => {
    if (!activeSubPanelId || !items) return null;
    return items.find((it) => it.id === activeSubPanelId) ?? null;
  }, [activeSubPanelId, items]);

  // Sync container height with active panel view for YouTube's fluid height transition
  React.useLayoutEffect(() => {
    if (!isOpen) return;

    if (activeItem && subViewRef.current) {
      setContentHeight(subViewRef.current.offsetHeight);
    } else if (mainViewRef.current) {
      setContentHeight(mainViewRef.current.offsetHeight);
    }
  }, [activeItem, isOpen, items, children]);

  // Reset or initialize subpanel ID only when open state or initialItemId prop changes
  React.useEffect(() => {
    if (!isOpen) {
      setActiveSubPanelId(null);
      setShouldAnimateSlide(false);
      return;
    }

    if (initialItemId) {
      setActiveSubPanelId(initialItemId);
    }

    // Enable smooth sliding transitions for subsequent user navigations after mount
    const timer = setTimeout(() => setShouldAnimateSlide(true), 50);
    return () => clearTimeout(timer);
  }, [isOpen, initialItemId]);

  if (!isOpen) return null;

  return (
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
      <ClickAwayListener onClickAway={onClose}>
        <div
          style={{ height: contentHeight ? `${contentHeight}px` : "auto" }}
          className={`relative min-w-[260px] max-w-[320px] rounded-xl overflow-hidden select-none font-sans
            bg-[var(--panel-nav-bg)] backdrop-blur-xl border border-[var(--panel-nav-border)]
            shadow-[var(--panel-nav-shadow)] text-[var(--panel-nav-text-primary)]
            transition-[height,width] duration-250 ease-[cubic-bezier(0.2,0.0,0.0,1.0)]
            animate-in fade-in zoom-in-95 ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Two-panel horizontal sliding track */}
          <div
            className={`flex w-[200%] items-start ${
              shouldAnimateSlide ? "transition-transform duration-250 ease-[cubic-bezier(0.2,0.0,0.0,1.0)]" : "transition-none"
            } ${activeItem ? "-translate-x-1/2" : "translate-x-0"}`}
          >
            {/* Main Menu Panel */}
            <div ref={mainViewRef} className="w-1/2 shrink-0 box-border">
              {title && (
                <div className="px-4 py-2.5 border-b border-[var(--panel-nav-border)] text-xs font-semibold text-[var(--panel-nav-text-primary)]">
                  {title}
                </div>
              )}

              {items && items.length > 0 && (
                <div className="py-1 max-h-[360px] overflow-y-auto overscroll-contain">
                  {items.map((item: NavigationPanelItem) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-4 py-2.5 cursor-pointer text-[13.5px] leading-snug
                        text-[var(--panel-nav-text-primary)] hover:bg-[var(--panel-nav-hover)] transition-colors duration-150"
                      onClick={() => {
                        if (item.subPanel) {
                          setActiveSubPanelId(item.id);
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
            <div ref={subViewRef} className="w-1/2 shrink-0 box-border">
              <div
                className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[var(--panel-nav-border)] text-xs font-medium cursor-pointer
                  text-[var(--panel-nav-text-primary)] hover:bg-[var(--panel-nav-hover)] transition-colors duration-150"
                onClick={() => setActiveSubPanelId(null)}
              >
                <ArrowBack sx={{ fontSize: 18 }} />
                <span>{activeItem?.label || ""}</span>
              </div>
              <div className="p-3 text-xs text-[var(--panel-nav-text-primary)]">
                {activeItem?.subPanel}
              </div>
            </div>
          </div>
        </div>
      </ClickAwayListener>
    </Popper>
  );
}
