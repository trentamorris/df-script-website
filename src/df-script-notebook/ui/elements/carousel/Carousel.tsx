import React from "react";
import { CarouselProps } from "./types";

interface TransitionState {
  fromIndex: number;
  toIndex: number;
  direction: "next" | "prev";
  phase: "start" | "running";
}

export const Carousel = <T = any,>({
  activeIndex,
  items,
  renderSlide,
  children,
  duration = 350,
  easing = "cubic-bezier(0.25, 1, 0.5, 1)",
  className = "",
  trackClassName = "",
  slideClassName = "",
  loop = true,
  style,
  ...rest
}: CarouselProps<T>) => {
  const slides = React.useMemo(() => {
    if (items && renderSlide) {
      return items.map((item, idx) => renderSlide(item, idx));
    }
    return React.Children.toArray(children);
  }, [items, renderSlide, children]);

  const total = slides.length;
  const clampedIndex = total > 0 ? Math.max(0, Math.min(activeIndex, total - 1)) : 0;

  const [displayIndex, setDisplayIndex] = React.useState<number>(clampedIndex);
  const [transition, setTransition] = React.useState<TransitionState | null>(null);

  const prevActiveRef = React.useRef<number>(clampedIndex);
  const prevTotalRef = React.useRef<number>(total);
  const rafIdRef = React.useRef<number | null>(null);
  const timeoutIdRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync / trigger transition whenever activeIndex or total changes
  React.useEffect(() => {
    const prevActive = prevActiveRef.current;
    const prevTotal = prevTotalRef.current;

    prevActiveRef.current = clampedIndex;
    prevTotalRef.current = total;

    if (total <= 1) {
      setDisplayIndex(clampedIndex);
      setTransition(null);
      return;
    }

    if (prevTotal !== total) {
      setDisplayIndex(clampedIndex);
      setTransition(null);
      return;
    }

    if (clampedIndex === displayIndex && !transition) {
      return;
    }

    // Determine direction
    let direction: "next" | "prev" = clampedIndex > displayIndex ? "next" : "prev";
    if (loop && total > 2) {
      if (displayIndex === total - 1 && clampedIndex === 0) {
        direction = "next";
      } else if (displayIndex === 0 && clampedIndex === total - 1) {
        direction = "prev";
      }
    }

    // Clean up any pending RAF/timer
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

    setTransition({
      fromIndex: displayIndex,
      toIndex: clampedIndex,
      direction,
      phase: "start",
    });

    // Double RAF ensures the initial "start" transform is painted before transitioning to "running"
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = requestAnimationFrame(() => {
        setTransition((prev) => (prev ? { ...prev, phase: "running" } : null));
      });
    });

    // Safety timeout in case transitionend does not fire (e.g. background tab)
    timeoutIdRef.current = setTimeout(() => {
      setDisplayIndex(clampedIndex);
      setTransition(null);
    }, duration + 60);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    };
  }, [clampedIndex, total, loop, duration]);

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (transition) {
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
      setDisplayIndex(transition.toIndex);
      setTransition(null);
    }
  };

  if (total === 0) return null;

  // Render slides based on transition state (2-slide virtual window during transition, 1 slide when idle)
  let renderedSlides: { node: React.ReactNode; originalIndex: number; isActive: boolean }[] = [];
  let trackTransform = "translateX(0%)";
  let trackTransition = "none";

  if (transition) {
    const isNext = transition.direction === "next";
    const isRunning = transition.phase === "running";

    if (isNext) {
      // Slide [Current, Incoming]
      renderedSlides = [
        {
          node: slides[transition.fromIndex],
          originalIndex: transition.fromIndex,
          isActive: false,
        },
        {
          node: slides[transition.toIndex],
          originalIndex: transition.toIndex,
          isActive: true,
        },
      ];
      trackTransform = isRunning ? "translateX(-100%)" : "translateX(0%)";
      trackTransition = isRunning
        ? `transform ${duration}ms ${easing}`
        : "none";
    } else {
      // Slide [Incoming, Current]
      renderedSlides = [
        {
          node: slides[transition.toIndex],
          originalIndex: transition.toIndex,
          isActive: true,
        },
        {
          node: slides[transition.fromIndex],
          originalIndex: transition.fromIndex,
          isActive: false,
        },
      ];
      trackTransform = isRunning ? "translateX(0%)" : "translateX(-100%)";
      trackTransition = isRunning
        ? `transform ${duration}ms ${easing}`
        : "none";
    }
  } else {
    // Idle: only render the 1 active slide
    const safeIdx = Math.max(0, Math.min(displayIndex, total - 1));
    renderedSlides = [
      {
        node: slides[safeIdx],
        originalIndex: safeIdx,
        isActive: true,
      },
    ];
    trackTransform = "translateX(0%)";
    trackTransition = "none";
  }

  return (
    <div
      className={`relative w-full h-full min-h-0 min-w-0 overflow-hidden flex flex-col ${className}`}
      style={style}
      {...rest}
    >
      <div
        onTransitionEnd={handleTransitionEnd}
        className={`flex flex-row w-full h-full grow min-h-0 min-w-0 ${trackClassName}`}
        style={{
          transform: trackTransform,
          transition: trackTransition,
          willChange: transition ? "transform" : "auto",
        }}
      >
        {renderedSlides.map((item, idx) => (
          <div
            key={`${item.originalIndex}-${idx}`}
            className={`w-full h-full shrink-0 min-h-0 min-w-0 flex flex-col overflow-hidden ${slideClassName}`}
            aria-hidden={!item.isActive}
            {...(!item.isActive ? { inert: "" } : {})}
          >
            {item.node}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
