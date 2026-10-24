import React from "react";
import { KeyboardArrowDown, OpenInFull, Close } from "@mui/icons-material";
import { DraggableSection } from "../../../../df-script-notebook/ui/elements/draggable-section/DraggableSection";
import type {
  DraggableSectionOnPointerMove,
  DraggableSectionOnPointerUp,
} from "../../../../df-script-notebook/ui/elements/draggable-section/types";

export interface MobileBottomPanelProps {
  /** If false or no content, panel is hidden */
  isOpen: boolean;
  onClose: () => void;
  /** Summary view displayed in the condensed mini-bar (analogous to the song title & artist) */
  collapsedSummary?: React.ReactNode;
  /** Callback with progress from 0 (condensed/closed) to 1 (full screen expanded) */
  onProgress?: (progress: number) => void;
  /** Key/identifier of the selected item to trigger re-expansion on new selections */
  selectedItemKey?: string;
  /** Expanded main view rendered inside the full sheet */
  children: React.ReactNode;
}

export function MobileBottomPanel({
  isOpen,
  onClose,
  collapsedSummary,
  onProgress,
  selectedItemKey,
  children,
}: MobileBottomPanelProps) {
  // progress: 0 (condensed mini-bar above nav) -> 1 (fully expanded full-screen)
  const [progress, setProgress] = React.useState<number>(1);
  const [isDragging, setIsDragging] = React.useState(false);
  const startYRef = React.useRef(0);
  const startProgressRef = React.useRef(1);

  // When a new item is selected or opened, expand to full screen
  React.useEffect(() => {
    if (isOpen) {
      setProgress(1);
      setIsDragging(false);
      onProgress?.(1);
    } else {
      onProgress?.(0);
    }
  }, [isOpen, selectedItemKey]);

  if (!isOpen) return null;

  // Pointer drag gestures for dragging the sheet up and down smoothly
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startProgressRef.current = progress;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaY = e.clientY - startYRef.current;
    const screenH = window.innerHeight;
    // Dragging down reduces progress; dragging up increases progress
    const deltaProgress = -deltaY / (screenH - 112);
    const newProgress = Math.max(0, Math.min(1, startProgressRef.current + deltaProgress));
    setProgress(newProgress);
    onProgress?.(newProgress);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Snap to condensed or expanded based on 0.5 threshold
    const finalProgress = progress > 0.4 ? 1 : 0;
    setProgress(finalProgress);
    onProgress?.(finalProgress);
  };

  const isCondensed = progress <= 0.05;

  return (
    <div
      style={{
        // translateY(0%) when progress = 1 (full screen)
        // translateY(calc(100% - 3.5rem - env(safe-area-inset-bottom, 0px) - 3.5rem)) when progress = 0 (peeking above nav)
        transform: `translateY(calc((100% - 7rem - env(safe-area-inset-bottom, 0px)) * ${1 - progress}))`,
      }}
      className={`fixed inset-0 z-40 flex flex-col bg-bg-pitch select-none will-change-transform ${
        isDragging ? "transition-none" : "transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      }`}
    >
      {/* HEADER / DRAG HANDLE: crossfades between condensed mini-bar and expanded header */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={() => {
          if (isCondensed) {
            setProgress(1);
            onProgress?.(1);
          }
        }}
        className={`shrink-0 w-full relative h-14 overflow-hidden border-b border-white/[0.06] touch-none cursor-grab active:cursor-grabbing ${
          isCondensed ? "bg-[#1D1D1D] cursor-pointer" : "bg-bg-pitch"
        }`}
      >
        {/* Condensed Mini-Bar (visible when resting on bottom nav: progress near 0) */}
        <div
          style={{
            opacity: progress <= 0.2 ? (0.2 - progress) / 0.2 : 0,
            pointerEvents: isCondensed ? "auto" : "none",
          }}
          className="absolute inset-0 flex items-center justify-between px-4 transition-opacity duration-150"
        >
          <div className="flex items-center min-w-0 flex-1">
            {collapsedSummary}
          </div>
          <div className="flex items-center gap-1 shrink-0 text-text-muted">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setProgress(1);
                onProgress?.(1);
              }}
              className="p-2 hover:text-white transition-colors cursor-pointer"
              title="Expand"
              aria-label="Expand Panel"
            >
              <OpenInFull style={{ fontSize: "16px" }} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 hover:text-white transition-colors cursor-pointer"
              title="Close"
              aria-label="Close Panel"
            >
              <Close style={{ fontSize: "18px" }} />
            </button>
          </div>
        </div>

        {/* Expanded Header: Down Arrow & Pill Handle (visible when progress near 1) */}
        <div
          style={{
            opacity: progress >= 0.7 ? (progress - 0.7) / 0.3 : 0,
            pointerEvents: progress >= 0.8 ? "auto" : "none",
          }}
          className="absolute inset-0 flex items-center justify-between px-4 transition-opacity duration-150"
        >
          <button
            type="button"
            onClick={() => {
              setProgress(0);
              onProgress?.(0);
            }}
            className="p-1 -ml-1 text-text-muted hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            title="Minimize"
            aria-label="Minimize Panel"
          >
            <KeyboardArrowDown style={{ fontSize: "28px" }} />
          </button>

          <div className="w-10 h-1 rounded-full bg-white/20 my-auto" />

          <div className="w-8 shrink-0" />
        </div>
      </div>

      {/* EXPANDED CONTENT: fills screen down into the safe area */}
      <div
        style={{
          opacity: progress >= 0.6 ? (progress - 0.6) / 0.4 : 0,
          pointerEvents: progress >= 0.8 ? "auto" : "none",
        }}
        className={`flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y pb-[calc(2rem+env(safe-area-inset-bottom,0px))] px-2 ${
          isDragging ? "transition-none" : "transition-opacity duration-150"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
