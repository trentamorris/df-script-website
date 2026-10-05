import React from "react";
import { Tooltip, CircularProgress } from "@mui/material";
import { DragHandle } from "@mui/icons-material";
import {
  DraggableListContextValue,
  DraggableListProps,
  DragConfig,
  DraggableListItemHandleProps,
  DraggableListItemProps,
} from "./types";
import { mergeRefs } from "../../../utils/layoutUtils";
import {
  clamp,
  useDragAutoScroll,
} from "../../../utils/dragUtils";
import { usePointerDrag } from "../../../hooks/usePointerDrag";

const IDLE_DRAG_CONFIG: DragConfig = {
  draggedIndex: null,
  hoveredIndex: null,
  startClientY: null,
  currentClientY: null,
  startScrollTop: null,
  currentScrollTop: null,
};

// ============================================================================
// Context
// ============================================================================

export const DraggableListContext = React.createContext<DraggableListContextValue | null>(null);

export const useDraggableList = () => {
  const ctx = React.useContext(DraggableListContext);
  if (!ctx) throw new Error("Draggable List Item must be used within <DraggableList></DraggableList>");
  return ctx;
};

export const DraggableList = React.forwardRef<HTMLUListElement, DraggableListProps>(
  (
    {
      scrollParentRef,
      getScrollParent,
      onReorder,
      onDragStateChange,
      rowHeight = 40,
      scrollEdgeZone = 40,
      lazyLoad = false,
      lazyLoadIncrement = 20,
      maxRenderedItems,
      renderLazyLoadingIndicator,
      renderEndOfList,
      renderPreviewLimitReached,
      isLoading = false,
      renderLoadingState,
      slotProps,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLUListElement>(null);
    const setListRefs = React.useMemo(() => mergeRefs<HTMLUListElement>(ref, internalRef), [ref]);
    const activeScrollContainerRef = React.useRef<HTMLElement | null>(null);

    // Lazy Loading (incremental reveal as the user scrolls, similar to an
    // infinite-scroll "up next" queue - no page numbers or controls)

    const allChildrenArray = React.useMemo(() => React.Children.toArray(children), [children]);
    const totalCount = allChildrenArray.length;
    const maximumVisibleCount = Math.min(totalCount, maxRenderedItems ?? totalCount);
    const hiddenItemsCount = totalCount - maximumVisibleCount;

    const [visibleCount, setVisibleCount] = React.useState<number>(
      lazyLoad ? Math.min(lazyLoadIncrement, maximumVisibleCount) : maximumVisibleCount
    );

    React.useEffect(() => {
      setVisibleCount(lazyLoad ? Math.min(lazyLoadIncrement, maximumVisibleCount) : maximumVisibleCount);
    }, [lazyLoad, lazyLoadIncrement, maximumVisibleCount]);

    const renderedChildren = allChildrenArray.slice(0, lazyLoad ? visibleCount : maximumVisibleCount);
    const hasMoreToReveal = lazyLoad && visibleCount < maximumVisibleCount;
    const revealMore = React.useCallback(() => {
      setVisibleCount((previous) => Math.min(previous + lazyLoadIncrement, maximumVisibleCount));
    }, [lazyLoadIncrement, maximumVisibleCount]);

    const getActiveScrollParent = React.useCallback(() => {
      const listEl = internalRef.current;
      return scrollParentRef?.current || (listEl && getScrollParent?.(listEl)) || listEl;
    }, [scrollParentRef, getScrollParent]);

    React.useEffect(() => {
      if (!hasMoreToReveal) return;

      const scrollParent = getActiveScrollParent();
      if (!scrollParent) return;

      const handleScroll = () => {
        const remainingScrollDistance = scrollParent.scrollHeight - scrollParent.scrollTop - scrollParent.clientHeight;
        if (remainingScrollDistance <= 1) revealMore();
      };

      handleScroll();
      scrollParent.addEventListener("scroll", handleScroll, { passive: true });
      return () => scrollParent.removeEventListener("scroll", handleScroll);
    }, [hasMoreToReveal, getActiveScrollParent, revealMore]);

    const listedContent = hasMoreToReveal
      ? renderLazyLoadingIndicator?.() ?? <CircularProgress size={16} thickness={5} sx={{ opacity: 0.5 }} />
      : hiddenItemsCount > 0
      ? renderPreviewLimitReached?.(hiddenItemsCount)
      : renderEndOfList?.();

    // Drag State & Item Registration

    const childCount = renderedChildren.length;
    const itemIdMapRef = React.useRef<Map<number, string>>(new Map());

    const registerItemId = React.useCallback((index: number, id: string) => {
      itemIdMapRef.current.set(index, id);
    }, []);

    const [dragConfig, setDragConfig] = React.useState<DragConfig>(IDLE_DRAG_CONFIG);
    const dragConfigRef = React.useRef(dragConfig);
    dragConfigRef.current = dragConfig;

    const onReorderRef = React.useRef(onReorder);
    onReorderRef.current = onReorder;

    const layoutRef = React.useRef({ childCount, rowHeight });
    layoutRef.current = { childCount, rowHeight };

    const isDragActive = dragConfig.draggedIndex !== null;
    const pointerYRef = React.useRef<number | null>(null);

    React.useEffect(() => {
      onDragStateChange?.(isDragActive);
    }, [isDragActive, onDragStateChange]);

    // Drag Auto-Scroll (scrolls the container while dragging near its edges)

    const getAutoScrollContainer = React.useCallback(() => activeScrollContainerRef.current, []);
    const getAutoScrollPointer = React.useCallback(
      () => (pointerYRef.current === null ? null : { x: 0, y: pointerYRef.current }),
      []
    );

    const handleAutoScrolled = React.useCallback((container: HTMLElement) => {
      setDragConfig((prev) => ({ ...prev, currentScrollTop: container.scrollTop }));
    }, []);

    const { update: updateAutoScroll } = useDragAutoScroll({
      isActive: isDragActive,
      axes: ["y"],
      edgeZone: scrollEdgeZone,
      getContainer: getAutoScrollContainer,
      getPointer: getAutoScrollPointer,
      onScroll: handleAutoScrolled,
    });

    // Drag Session (shared window-pointer engine: one move per frame, Escape/pointercancel discard)

    const { startDragSession } = usePointerDrag();

    /** Single exit point for every reorder (pointer or keyboard). */
    const commitReorder = React.useCallback(
      (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        const getFromId = (idx: number) => itemIdMapRef.current.get(idx);
        onReorderRef.current?.(fromIndex, toIndex, getFromId(fromIndex), getFromId(toIndex));
      },
      [onReorderRef]
    );

    const moveItemBy = React.useCallback(
      (index: number, delta: number) => {
        commitReorder(index, clamp(index + delta, 0, layoutRef.current.childCount - 1));
      },
      [commitReorder, layoutRef]
    );

    /**
     * Row index under `clientY`. Measured from the list's content box: rows are translated while dragging,
     * so a row's own rect moves with the pointer and can't be used as the origin.
     */
    const getIndexAt = React.useCallback(
      (clientY: number) => {
        const listEl = internalRef.current;
        if (!listEl) return null;
        const top = listEl.getBoundingClientRect().top + parseFloat(getComputedStyle(listEl).paddingTop || "0");
        const { childCount: count, rowHeight: height } = layoutRef.current;
        return clamp(Math.floor((clientY - top) / height), 0, count - 1);
      },
      [layoutRef]
    );

    const handlePointerStart = React.useCallback(
      (event: React.PointerEvent<HTMLElement>, index: number) => {
        if (event.button !== 0) return;
        event.preventDefault();

        activeScrollContainerRef.current = getActiveScrollParent();
        const startScrollTop = activeScrollContainerRef.current?.scrollTop ?? 0;
        setDragConfig({
          draggedIndex: index,
          hoveredIndex: index,
          startClientY: event.clientY,
          currentClientY: event.clientY,
          startScrollTop,
          currentScrollTop: startScrollTop,
        });

        startDragSession({
          pointerId: event.pointerId,
          cursor: "grabbing",
          onMove: (evt) => {
            pointerYRef.current = evt.clientY;
            updateAutoScroll();
            const hoveredIndex = getIndexAt(evt.clientY);
            setDragConfig((prev) => ({
              ...prev,
              hoveredIndex: hoveredIndex ?? prev.hoveredIndex,
              currentClientY: evt.clientY,
              currentScrollTop: activeScrollContainerRef.current?.scrollTop ?? 0,
            }));
          },
          onEnd: (_evt, { cancelled }) => {
            const { draggedIndex, hoveredIndex } = dragConfigRef.current;
            if (!cancelled && draggedIndex !== null && hoveredIndex !== null) {
              commitReorder(draggedIndex, hoveredIndex);
            }
            setDragConfig(IDLE_DRAG_CONFIG);
            pointerYRef.current = null;
          },
        });
      },
      [commitReorder, dragConfigRef, getActiveScrollParent, getIndexAt, startDragSession, updateAutoScroll]
    );

    // Context Value

    const ctxValue = React.useMemo<DraggableListContextValue>(
      () => ({ ...dragConfig, setDragConfig, handlePointerStart, moveItemBy, registerItemId, rowHeight }),
      [dragConfig, handlePointerStart, moveItemBy, registerItemId, rowHeight]
    );

    // Render

    return (
      <DraggableListContext.Provider value={ctxValue}>
        {slotProps?.toolbar && (
          <div
            {...slotProps.toolbar}
            className={`flex items-center gap-[4px] px-[8px] pt-[4px] ${slotProps.toolbar.className ?? ""}`}
          />
        )}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[200px] p-[8px]">
            {renderLoadingState ? (
              renderLoadingState()
            ) : (
              <CircularProgress size={28} />
            )}
          </div>
        ) : (
          <ul
            ref={setListRefs}
            {...rest}
            className={`overflow-x-hidden list-none overflow-y-hidden p-[0px] ${className ?? ""}`}
            role="listbox"
          >
            {renderedChildren}
            {(lazyLoad || hiddenItemsCount > 0) && listedContent && (
              <li
                aria-hidden
                className="flex items-center justify-center select-none"
                style={{ height: `${rowHeight}px` }}
              >
                {listedContent}
              </li>
            )}
          </ul>
        )}
        {slotProps?.footer && (
          <div
            {...slotProps.footer}
            style={{ height: `${rowHeight}px`, ...slotProps.footer.style }}
            className={`sticky bottom-0 flex items-center shrink-0 border-t border-[var(--nb-border-default,rgba(255,255,255,0.08))] bg-inherit px-[8px] py-[4px] ${
              slotProps.footer.className ?? ""
            }`}
          />
        )}
      </DraggableListContext.Provider>
    );
  }
);

DraggableList.displayName = "DraggableList";

// ============================================================================
// DraggableListItemHandle
// ============================================================================

const NUDGE_KEY_DELTAS: Record<string, number | undefined> = { ArrowUp: -1, ArrowDown: 1 };

export const DraggableListItemHandle: React.FC<DraggableListItemHandleProps> = ({ idx }) => {
  const { handlePointerStart, moveItemBy } = useDraggableList();

  const handle = (
    <button
      type="button"
      className="drag-handle cursor-move border-none bg-transparent text-inherit p-0 flex items-center justify-center opacity-60 hover:opacity-100"
      style={{ touchAction: "none" }}
      onPointerDown={(e) => handlePointerStart(e, idx)}
      onKeyDown={(e) => {
        const delta = NUDGE_KEY_DELTAS[e.key];
        if (!delta) return;
        e.preventDefault();
        moveItemBy(idx, delta);
      }}
      aria-label={`Reorder item ${idx + 1}`}
      aria-keyshortcuts="ArrowUp ArrowDown"
    >
      <DragHandle fontSize="small" />
    </button>
  );

  return (
    <Tooltip
      title="Set Order"
      enterDelay={1000}
      leaveDelay={0}
    >
      {handle}
    </Tooltip>
  );
};

// ============================================================================
// DraggableListItem
// ============================================================================

export const DraggableListItem = React.forwardRef<HTMLLIElement, DraggableListItemProps>(
  (
    {
      index,
      itemId,
      selected,
      className,
      children,
      showHandle = true,
      orderLabel,
      renderHandle,
      expanded = false,
      expandContent,
      expandMaxHeight = 240,
      slotProps,
      ...rest
    },
    ref
  ) => {
    const {
      draggedIndex,
      hoveredIndex,
      registerItemId,
      rowHeight,
      startClientY,
      currentClientY,
      startScrollTop,
      currentScrollTop,
    } = useDraggableList();

    React.useEffect(() => {
      if (itemId !== undefined && itemId !== null) registerItemId(index, itemId);
    }, [index, itemId, registerItemId]);

    const isDragging = draggedIndex === index;
    const dragDeltaY = isDragging
      ? (currentClientY ?? 0) - (startClientY ?? 0) + ((currentScrollTop ?? 0) - (startScrollTop ?? 0))
      : 0;

    let neighborDy = 0;
    if (draggedIndex !== null && hoveredIndex !== null && !isDragging) {
      if (index > draggedIndex && index <= hoveredIndex) neighborDy = -rowHeight;
      else if (index < draggedIndex && index >= hoveredIndex) neighborDy = rowHeight;
    }

    const itemStyle = React.useMemo<React.CSSProperties>(
      () => ({
        minHeight: `${rowHeight}px`,
        height: expanded ? "auto" : `${rowHeight}px`,
        transform: `translate3d(0, ${isDragging ? dragDeltaY : neighborDy}px, 0)`,
        transition: isDragging || draggedIndex === null ? "none" : "transform 0.2s cubic-bezier(0.2, 0, 0, 1)",
        zIndex: isDragging ? 100 : 1,
        willChange: "transform",
        userSelect: "none",
        opacity: selected === false ? 0.5 : 1,
        backgroundColor:
          selected === true || (isDragging && selected !== false)
            ? "rgba(255, 255, 255, 0.08)"
            : "unset",
        pointerEvents: draggedIndex !== null ? (isDragging ? "auto" : "none") : "auto",
      }),
      [rowHeight, expanded, dragDeltaY, neighborDy, isDragging, draggedIndex, selected]
    );

    return (
      <li
        {...rest}
        ref={ref}
        data-dragging={isDragging}
        data-expanded={expanded}
        data-selected={selected}
        className={`flex flex-col w-[100%] ${className ?? ""}`}
        style={itemStyle}
      >
        <div
          {...slotProps?.inner}
          className={`flex items-center w-[100%] px-[12px] rounded-[4px] hover:bg-white/[0.04] transition-colors ${
            slotProps?.inner?.className ?? ""
          }`}
          style={{ minHeight: `${rowHeight}px`, ...slotProps?.inner?.style }}
        >
          {orderLabel !== null && orderLabel !== undefined && (
            <span className="mr-[2px] min-w-[20px] max-w-[20px] opacity-[0.7] flex items-center justify-center select-none text-[11px] font-mono">
              {orderLabel}
            </span>
          )}
          {children}
          {showHandle &&
            (renderHandle ? (
              renderHandle({ index })
            ) : (
              <div className="ml-auto shrink-0">
                <DraggableListItemHandle idx={index} />
              </div>
            ))}
        </div>
        {expanded && expandContent && (
          <div
            className="w-[100%] overflow-y-auto pb-[8px]"
            style={{ maxHeight: `${expandMaxHeight}px` }}
          >
            {expandContent}
          </div>
        )}
      </li>
    );
  }
);

DraggableListItem.displayName = "DraggableListItem";

export default DraggableList;
