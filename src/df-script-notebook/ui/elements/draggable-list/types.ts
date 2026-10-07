import React from "react";
import { StateSetter } from "../../../types";

export type DragConfig = {
  draggedIndex: number | null;
  hoveredIndex: number | null;
  startClientY: number | null;
  currentClientY: number | null;
  startScrollTop: number | null;
  currentScrollTop: number | null;
};

export type DraggableListContextValue = DragConfig & {
  setDragConfig: StateSetter<DragConfig>;
  handlePointerStart: (event: React.PointerEvent<HTMLElement>, index: number) => void;
  /** Keyboard reorder: moves the item at `index` by `delta` rows (clamped to the list). */
  moveItemBy: (index: number, delta: number) => void;
  registerItemId: (index: number, id: string) => void;
  rowHeight: number;
};

export type OnReorderFn = (
  draggedIndex: number,
  hoveredIndex: number,
  draggedId?: string,
  hoveredId?: string
) => void;

export type DraggableListProps = React.HTMLAttributes<HTMLUListElement> & {
  scrollParentRef?: React.RefObject<HTMLElement | null>;
  getScrollParent?: (el: HTMLUListElement) => HTMLElement | null;
  rowHeight?: number;
  scrollEdgeZone?: number;
  onReorder?: OnReorderFn;
  onDragStateChange?: (isDragging: boolean) => void;
  /** Enables incremental rendering of items as the user scrolls near the end of the list (like YouTube's "up next" queue), instead of mounting every item up front. */
  lazyLoad?: boolean;
  /** Number of additional items to reveal each time the end of the list is reached. */
  lazyLoadIncrement?: number;
  /** Maximum number of items that may be rendered. Items beyond this limit remain available in the source data but are not mounted. */
  maxRenderedItems?: number;
  /** Optional content displayed while more items can be revealed. Renders a compact spinner by default. */
  renderLazyLoadingIndicator?: () => React.ReactNode;
  /** Optional content rendered once after the last item, when lazy loading has revealed everything (e.g. "You're all caught up"). Renders nothing by default. */
  renderEndOfList?: () => React.ReactNode;
  /** Optional content rendered when the maximum-rendered-items preview cap is reached. Receives the number of items not rendered. */
  renderPreviewLimitReached?: (hiddenItemsCount: number) => React.ReactNode;
  /** When true, replaces the entire list content with a loading state (e.g. while the underlying data source is refetching), instead of showing stale items. */
  isLoading?: boolean;
  /** Custom loading state renderer used when `isLoading` is true. Renders a centered spinner by default. */
  renderLoadingState?: () => React.ReactNode;
  slotProps?: {
    toolbar?: React.ComponentProps<"div">;
    footer?: React.ComponentProps<"div">;
  };
};

export type DraggableListItemProps = React.LiHTMLAttributes<HTMLLIElement> & {
  index: number;
  itemId?: string;
  selected?: boolean;
  showHandle?: boolean;
  orderLabel?: React.ReactNode;
  renderHandle?: (ctx: { index: number }) => React.ReactNode;
  expanded?: boolean;
  expandContent?: React.ReactNode;
  expandMaxHeight?: number;
  slotProps?: {
    inner?: React.ComponentProps<"div">;
  };
};

export type DraggableListItemHandleProps = {
  idx: number;
};
