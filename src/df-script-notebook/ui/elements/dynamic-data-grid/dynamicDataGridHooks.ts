/* 
import React from "react";
import { useElementScrollState } from "../../../hooks/useLayoutHooks";
import {
  DynamicDataGridScrollControlsHookParams,
  DynamicDataGridScrollControlsHookResult,
  DataGridCssMetrics,
  UseDataGridCssMetricsParams,
} from "./dynamicDataGridTypes";
import { resolveDataGridCssMetrics } from "./dynamicDataGridUtils";
import { DATA_GRID_SELECTORS } from "./dynamicDataGridConstants";

export const useDynamicDataGridScrollControls = ({
  gridRef,
  gridLayoutShiftTrigger,
}: DynamicDataGridScrollControlsHookParams): DynamicDataGridScrollControlsHookResult => {
  const [scrollViewport, setScrollViewport] = React.useState<HTMLDivElement | null>(null);
  const [scrollerOffsets, setScrollerOffsets] = React.useState({ left: 0, right: 0, top: 0, bottom: 0 });
  const updateOffsetsRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    let frameId = 0;
    let attempts = 0;
    const MAX_ATTEMPTS = 600;
    const find = () => {
      const el = gridRef.current?.querySelector<HTMLDivElement>(DATA_GRID_SELECTORS.virtualScroller) ?? null;
      if (el) {
        setScrollViewport(el);
        return;
      }
      attempts += 1;
      if (attempts < MAX_ATTEMPTS) {
        frameId = window.requestAnimationFrame(find);
      }
    };
    find();
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [gridRef]);

  const cssMetrics = useDataGridCssMetrics({ gridRef, trigger: gridLayoutShiftTrigger });

  const scrollState = useElementScrollState({
    scrollElement: scrollViewport,
    observeElements: gridRef.current ? [gridRef.current] : [],
    forceHasScrollY: cssMetrics.hasScrollY === 1 ? true : undefined,
    forceHasScrollX: cssMetrics.hasScrollX === 1 ? true : undefined,
    trigger: gridLayoutShiftTrigger,
  });

  React.useEffect(() => {
    const container = gridRef.current;
    const scroller = scrollViewport;
    if (!container || !scroller) return;

    const updateOffsets = () => {
      const containerRect = container.getBoundingClientRect();
      const scrollerRect = scroller.getBoundingClientRect();

      setScrollerOffsets({
        left: Math.max(0, scrollerRect.left - containerRect.left),
        right: Math.max(0, containerRect.right - scrollerRect.right),
        top: Math.max(0, scrollerRect.top - containerRect.top),
        bottom: Math.max(0, containerRect.bottom - scrollerRect.bottom),
      });
    };

    updateOffsetsRef.current = updateOffsets;
    updateOffsets();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(updateOffsets);
      });
      resizeObserver.observe(container);
      resizeObserver.observe(scroller);
    }

    window.addEventListener("resize", updateOffsets);

    let scrollFrame = 0;
    const handleScroll = () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(updateOffsets);
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      updateOffsetsRef.current = null;
      resizeObserver?.disconnect();
      window.cancelAnimationFrame(scrollFrame);
      window.removeEventListener("resize", updateOffsets);
      scroller.removeEventListener("scroll", handleScroll);
    };
  }, [gridRef, scrollViewport]);

  React.useEffect(() => {
    window.requestAnimationFrame(() => {
      updateOffsetsRef.current?.();
    });
  }, [gridLayoutShiftTrigger]);

  return {
    ...scrollState,
    ...cssMetrics,
    virtualScrollerInsetLeft: scrollerOffsets.left,
    virtualScrollerInsetRight: scrollerOffsets.right,
    virtualScrollerInsetTop: scrollerOffsets.top,
    virtualScrollerInsetBottom: scrollerOffsets.bottom,
  };
};

export const useDataGridCssMetrics = ({ gridRef, trigger }: UseDataGridCssMetricsParams): DataGridCssMetrics => {
  const [metrics, setMetrics] = React.useState<DataGridCssMetrics>(() =>
    resolveDataGridCssMetrics({ gridElement: null })
  );

  React.useEffect(() => {
    const element = gridRef.current;
    if (!element) return;

    const update = () => {
      setMetrics(resolveDataGridCssMetrics({ gridElement: element }));
    };

    update();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(update);
      });
      resizeObserver.observe(element);
    }

    let mutationObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== "undefined") {
      mutationObserver = new MutationObserver(() => {
        window.requestAnimationFrame(update);
      });
      mutationObserver.observe(element, { attributes: true, attributeFilter: ["style"] });
    }

    window.addEventListener("resize", update);

    return () => {
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [gridRef, trigger]);

  return metrics;
};
*/