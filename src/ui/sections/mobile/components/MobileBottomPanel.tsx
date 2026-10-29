import React from "react";
import { KeyboardArrowDown, OpenInFull, Close } from "@mui/icons-material";
import { DraggableSection } from "../../../elements/draggable-section/DraggableSection";
import type {
  DraggableSectionOnPointerMove,
  DraggableSectionOnPointerUp,
} from "../../../elements/draggable-section/types";
import { MOBILE_MINIBAR_HEIGHT } from "../constants";

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
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  // Panel height in pixels. Initially full height (e.g. window.innerHeight - 56)
  const [panelHeight, setPanelHeight] = React.useState<number>(0);
  const [isCondensed, setIsCondensed] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const miniBarHeight = MOBILE_MINIBAR_HEIGHT;

  // Initialize to full screen (minus bottom nav) whenever opened or a new item is selected
  React.useEffect(() => {
    if (isOpen) {
      const fullHeight = (containerRef.current?.clientHeight || window.innerHeight);
      setPanelHeight(Math.max(300, fullHeight));
      setIsCondensed(false);
      setIsDragging(false);
      onProgress?.(1);
    } else {
      onProgress?.(0);
    }
  }, [isOpen, selectedItemKey]);

  if (!isOpen) return null;

  const fullScreenHeight = (containerRef.current?.clientHeight || window.innerHeight);
  const travelRange = Math.max(1, fullScreenHeight - miniBarHeight);
  // progress: 0 when panelHeight is miniBarHeight (condensed), 1 when fullScreenHeight (expanded)
  const progress = Math.min(1, Math.max(0, (panelHeight - miniBarHeight) / travelRange));

  // When panel is condensed (progress 0), it rests on top of the bottom nav (bottom: 56px).
  // As it expands (progress -> 1), the bottom nav translates out by 100%, so the panel bottom smoothly shifts down to 0px!
  const panelBottomPx = (1 - progress) * miniBarHeight;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-40 select-none overflow-hidden"
    >
      <DraggableSection
        containerRef={containerRef}
        orientation="vertical"
        anchor="bottom"
        clampMin={miniBarHeight}
        clampMax={fullScreenHeight}
        snapPoints={[miniBarHeight, fullScreenHeight]}
        onPointerDown={() => {
          setIsDragging(true);
        }}
        onPointerMove={(data: Parameters<DraggableSectionOnPointerMove>[0]) => {
          setPanelHeight(data.px);
          const currentProgress = Math.min(1, Math.max(0, (data.px - miniBarHeight) / travelRange));
          onProgress?.(currentProgress);
          setIsCondensed(data.px <= miniBarHeight + 20);
        }}
        onPointerUp={(data: Parameters<DraggableSectionOnPointerUp>[0]) => {
          setIsDragging(false);
          const targetHeight = data.snap?.px ?? data.px;
          setPanelHeight(targetHeight);
          const finalProgress = Math.min(1, Math.max(0, (targetHeight - miniBarHeight) / travelRange));
          onProgress?.(finalProgress);
          setIsCondensed(targetHeight <= miniBarHeight + 20);
        }}
        style={{
          height: `${panelHeight}px`,
          bottom: `${panelBottomPx}px`,
        }}
        className={`absolute left-0 right-0 pointer-events-auto flex flex-col shadow-2xl overflow-hidden ${isCondensed && !isDragging ? "bg-[#1D1D1D]" : "bg-[#060606]"
          } ${isDragging ? "transition-none" : "transition-[height,bottom,background-color] duration-300 ease-[var(--mobile-panel-easing)]"
          }`}
      >
        {/* TOP BAR / HEADER (Cross-fades between condensed summary and expanded controls) */}
        <div
          onClick={() => {
            if (isCondensed) {
              setPanelHeight(fullScreenHeight);
              setIsCondensed(false);
              onProgress?.(1);
            }
          }}
          className={`shrink-0 w-full relative h-14 transition-colors cursor-grab active:cursor-grabbing overflow-hidden ${isCondensed && !isDragging ? "bg-[#1D1D1D] cursor-pointer" : "bg-[#060606]"
            }`}
        >
          {/* Condensed Mini-Bar Header View (only fades in near the very bottom: progress 0.2 -> 0) */}
          <div
            style={{
              opacity: progress <= 0.2 ? (0.2 - progress) / 0.2 : 0,
              pointerEvents: progress <= 0.1 ? "auto" : "none",
            }}
            className="absolute inset-0 flex items-center justify-between px-4 transition-opacity duration-75"
          >
            <div className="flex items-center min-w-0 flex-1">
              {collapsedSummary}
            </div>
            <div className="flex items-center gap-1 shrink-0 text-text-muted">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPanelHeight(fullScreenHeight);
                  setIsCondensed(false);
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

          {/* Expanded Header View: Down Arrow and Centered Drag Pill (fades out rapidly as user pulls down from 1.0 to 0.7) */}
          <div
            style={{
              opacity: progress >= 0.7 ? (progress - 0.7) / 0.3 : 0,
              pointerEvents: progress >= 0.7 ? "auto" : "none",
            }}
            className="absolute inset-0 flex items-center justify-between px-4 transition-opacity duration-75"
          >
            <button
              type="button"
              onClick={() => {
                setPanelHeight(miniBarHeight);
                setIsCondensed(true);
                onProgress?.(0);
              }}
              className="p-1 -ml-1 text-text-muted hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              title="Minimize"
              aria-label="Minimize Panel"
            >
              <KeyboardArrowDown style={{ fontSize: "28px" }} />
            </button>

            <div className="w-10 h-1 rounded-full bg-white/20 my-auto cursor-grab active:cursor-grabbing" />

            <div className="w-8 shrink-0" />
          </div>
        </div>

        {/* AGNOSTIC EXPANDED CONTENT AREA:
            Fades to 0 rapidly as user starts pulling down (progress 1.0 -> 0.7).
            Below 0.7, opacity is 0 (clean blank section during intermediate drag). */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            opacity: progress >= 0.7 ? (progress - 0.7) / 0.3 : 0,
            pointerEvents: progress >= 0.9 ? "auto" : "none",
          }}
          className={`flex-1 min-h-0 overflow-y-auto bg-bg-pitch overscroll-contain touch-pan-y ${isDragging ? "transition-none" : "transition-opacity duration-150"
            }`}
        >
          {children}
        </div>
      </DraggableSection>
    </div>
  );
}
