import React from "react";
import { createPortal } from "react-dom";
import { ClickAwayListener } from "@mui/material";
import { Close } from "@mui/icons-material";
import { ModalSheetProps, DEFAULT_MODAL_SHEET_BACKDROP } from "./types";

export function ModalSheet({
  isOpen,
  onClose,
  title,
  children,
  className = "",
  backdropColor,
  backdropBlur = false,
  dismissOnClickOutside = true,
  showCloseButton = true,
  swipeToDismiss = false,
  maxHeight,
}: ModalSheetProps) {
  const [isRendered, setIsRendered] = React.useState(isOpen);
  const [isVisible, setIsVisible] = React.useState(false);
  const [dragOffsetY, setDragOffsetY] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isClosingFromDrag, setIsClosingFromDrag] = React.useState(false);
  const dragStartYRef = React.useRef(0);

  React.useEffect(() => {
    if (isOpen) {
      setDragOffsetY(0);
      setIsDragging(false);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      e.preventDefault();
      onClose();
    }
  };

  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeToDismiss) return;
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

  if (!isRendered) return null;

  const resolvedBackdropBg = backdropColor ?? DEFAULT_MODAL_SHEET_BACKDROP;
  const resolvedBackdropFilter = backdropBlur
    ? typeof backdropBlur === "string"
      ? backdropBlur
      : "blur(12px)"
    : undefined;

  const resolvedMaxHeight =
    maxHeight !== undefined
      ? typeof maxHeight === "number"
        ? `${maxHeight}px`
        : maxHeight
      : "85vh";

  const modalMarkup = (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center px-1 py-4 transition-opacity duration-200 ease-out ${
        isVisible && !isClosingFromDrag ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
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
          className={`w-[calc(100vw-8px)] max-w-sm flex justify-center ${
            isDragging ? "transition-none" : "transition-all duration-250 ease-[cubic-bezier(0.2,0.0,0.0,1.0)]"
          } ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
          style={{
            transform:
              dragOffsetY !== 0
                ? `translate3d(0, ${dragOffsetY}px, 0)`
                : undefined,
          }}
        >
          <div
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
            {title && (
              <div
                className={`sticky top-0 z-10 bg-[#212121] flex flex-col border-b border-white/10 select-none ${
                  swipeToDismiss ? "cursor-grab active:cursor-grabbing touch-none" : ""
                }`}
                onPointerDown={handleDragPointerDown}
                onPointerMove={handleDragPointerMove}
                onPointerUp={handleDragPointerUp}
                onPointerCancel={handleDragPointerUp}
              >
                {swipeToDismiss && (
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

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </div>
        </div>
      </ClickAwayListener>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalMarkup, document.body) : modalMarkup;
}

export default ModalSheet;
