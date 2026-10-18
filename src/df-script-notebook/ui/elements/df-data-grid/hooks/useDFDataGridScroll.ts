import React from 'react';
import { getScrollOffset, ScrollOffset } from '../../../../utils/layoutUtils';
import { SCROLL_CSS_VARS, SCROLL_DATA_ATTRS, VIRTUAL_SCROLLER_SELECTOR } from '../constants';

export interface UseDFDataGridScrollOptions {
  rowsCount: number;
  scrollThreshold?: number;
  onScroll?: (offset: ScrollOffset) => void;
}

/**
 * High-performance rAF-throttled scroll listener that synchronizes
 * DOM metrics, CSS variables, and data-attributes for DFDataGrid.
 */
export function useDFDataGridScroll(options: UseDFDataGridScrollOptions) {
  const { rowsCount, scrollThreshold = 0, onScroll } = options;
  const rootRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLElement | null>(null);
  const rafIdRef = React.useRef<number | null>(null);

  const updateScrollMetrics = React.useCallback(() => {
    const root = rootRef.current;
    const scroller = scrollerRef.current;
    if (!root || !scroller) return;

    const offset = getScrollOffset({
      element: scroller,
      threshold: scrollThreshold,
    });

    root.style.setProperty(SCROLL_CSS_VARS.scrollTop, `${offset.top}px`);
    root.style.setProperty(SCROLL_CSS_VARS.scrollLeft, `${offset.left}px`);
    root.style.setProperty(SCROLL_CSS_VARS.progressTop, `${offset.progressTop}`);
    root.style.setProperty(SCROLL_CSS_VARS.progressLeft, `${offset.progressLeft}`);

    root.setAttribute(SCROLL_DATA_ATTRS.scrolledTop, String(offset.isScrolledTop));
    root.setAttribute(SCROLL_DATA_ATTRS.scrolledBottom, String(offset.isScrolledBottom));
    root.setAttribute(SCROLL_DATA_ATTRS.scrolledLeft, String(offset.isScrolledLeft));
    root.setAttribute(SCROLL_DATA_ATTRS.scrolledRight, String(offset.isScrolledRight));

    onScroll?.(offset);
  }, [scrollThreshold, onScroll]);

  const handleScroll = React.useCallback(() => {
    if (rafIdRef.current != null) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      updateScrollMetrics();
    });
  }, [updateScrollMetrics]);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scroller = root.querySelector<HTMLElement>(VIRTUAL_SCROLLER_SELECTOR);
    scrollerRef.current = scroller;
    if (!scroller) return;

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollMetrics();

    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      scrollerRef.current = null;
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [handleScroll, updateScrollMetrics, rowsCount]);

  return rootRef;
}

