import React from 'react';
import { DEFAULT_OVERSCAN, DEFAULT_ROW_HEIGHT } from '../constants';

export interface UseVirtualScrollOptions {
  totalCount: number;
  rowHeight?: number;
  overscan?: number;
}

export interface UseVirtualScrollResult {
  containerRef: React.RefObject<HTMLDivElement>;
  startIndex: number;
  endIndex: number;
  offsetY: number;
  totalHeight: number;
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
}

export function useVirtualScroll({
  totalCount,
  rowHeight = DEFAULT_ROW_HEIGHT,
  overscan = DEFAULT_OVERSCAN,
}: UseVirtualScrollOptions): UseVirtualScrollResult {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = React.useState<number>(0);
  const [containerHeight, setContainerHeight] = React.useState<number>(400);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    setContainerHeight(el.clientHeight);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const totalHeight = totalCount * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const endIndex = Math.min(totalCount, startIndex + visibleCount + overscan * 2);
  const offsetY = startIndex * rowHeight;

  return {
    containerRef,
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    handleScroll,
  };
}
