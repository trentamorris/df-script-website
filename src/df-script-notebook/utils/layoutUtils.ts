/**
 * Layout utility functions for box models and pixel parsing.
 */

export interface BoxModelSides {
  padding: number;
  border: number;
  margin: number;
}

export interface BoxModel {
  top: BoxModelSides;
  right: BoxModelSides;
  bottom: BoxModelSides;
  left: BoxModelSides;
}

/**
 * Resolves computed padding, border, and margin for an HTMLElement.
 */
export function resolveBoxModel(element: HTMLElement): BoxModel {
  const style = window.getComputedStyle(element);
  return {
    top: {
      padding: parseFloat(style.paddingTop) || 0,
      border: parseFloat(style.borderTopWidth) || 0,
      margin: parseFloat(style.marginTop) || 0,
    },
    right: {
      padding: parseFloat(style.paddingRight) || 0,
      border: parseFloat(style.borderRightWidth) || 0,
      margin: parseFloat(style.marginRight) || 0,
    },
    bottom: {
      padding: parseFloat(style.paddingBottom) || 0,
      border: parseFloat(style.borderBottomWidth) || 0,
      margin: parseFloat(style.marginBottom) || 0,
    },
    left: {
      padding: parseFloat(style.paddingLeft) || 0,
      border: parseFloat(style.borderLeftWidth) || 0,
      margin: parseFloat(style.marginLeft) || 0,
    },
  };
}

/**
 * Converts a number or css dimension string (e.g. 100, "100px", "50%") to pixels.
 */
export function parseToPx(
  value: number | string | undefined | null,
  options?: { axisSize?: number }
): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "number") return value;

  const trimmed = value.trim();
  if (trimmed.endsWith("%")) {
    const percent = parseFloat(trimmed);
    if (isNaN(percent)) return undefined;
    return options?.axisSize !== undefined ? (percent / 100) * options.axisSize : undefined;
  }

  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? undefined : parsed;
}

export interface GetScrollableAncestorOptions {
  el: HTMLElement | null;
  stopEl?: HTMLElement | null;
  checkScrollbounds?: boolean;
  includeSelf?: boolean;
  axis?: "x" | "y";
}

/**
 * Finds the nearest scrollable ancestor element within the DOM hierarchy.
 */
export function getScrollableAncestor(options: GetScrollableAncestorOptions): HTMLElement | null {
  const { el, stopEl, checkScrollbounds = true, includeSelf = true, axis = "y" } = options;
  if (!el) return null;

  let current: HTMLElement | null = includeSelf ? el : el.parentElement;

  while (current && current !== stopEl && current !== document.body) {
    const style = window.getComputedStyle(current);
    const overflow = axis === "x" ? style.overflowX : style.overflowY;
    const isScrollable = overflow === "auto" || overflow === "scroll";

    if (isScrollable) {
      if (!checkScrollbounds) return current;
      const hasScrollableContent =
        axis === "x"
          ? current.scrollWidth > current.clientWidth
          : current.scrollHeight > current.clientHeight;
      if (hasScrollableContent) return current;
    }

    current = current.parentElement;
  }

  return null;
}

/**
 * Merges multiple React refs into a single callback ref.
 */
export function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined | null)[]
): React.RefCallback<T> {
  return (value: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(value);
      } else {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}

/**
 * Type guard to check if a target is a Window element across realms.
 */
export function isWindowElement(value: unknown): value is Window {
  return (
    typeof window !== "undefined" &&
    (value === window ||
      (value != null &&
        typeof value === "object" &&
        "window" in value &&
        (value as { window: unknown }).window === value))
  );
}

/**
 * Type guard to check if a target is a Document element across realms.
 */
export function isDocumentElement(value: unknown): value is Document {
  return (
    value != null &&
    typeof value === "object" &&
    (value as Node).nodeType === 9
  );
}

export interface ScrollOffset {
  top: number;
  left: number;
  maxTop: number;
  maxLeft: number;
  progressTop: number; // 0 to 100 percentage
  progressLeft: number; // 0 to 100 percentage
  isScrolledTop: boolean;
  isScrolledBottom: boolean;
  isScrolledLeft: boolean;
  isScrolledRight: boolean;
}

export interface GetScrollOffsetOptions {
  element: HTMLElement | Window | Document | null;
  threshold?: number;
  tolerance?: number;
}

/**
 * Resolves comprehensive scroll metrics, percentages (0-100), and directional threshold states.
 */
export function getScrollOffset(options: GetScrollOffsetOptions): ScrollOffset {
  const { element, threshold = 0, tolerance = 1 } = options;

  if (!element) {
    return {
      top: 0,
      left: 0,
      maxTop: 0,
      maxLeft: 0,
      progressTop: 0,
      progressLeft: 0,
      isScrolledTop: false,
      isScrolledBottom: false,
      isScrolledLeft: false,
      isScrolledRight: false,
    };
  }

  const targetIsWindow = isWindowElement(element);
  const targetEl = targetIsWindow
    ? document.documentElement
    : isDocumentElement(element)
      ? element.documentElement
      : element;

  const rawTop = targetIsWindow ? window.scrollY : targetEl.scrollTop;
  const rawLeft = targetIsWindow ? window.scrollX : targetEl.scrollLeft;

  const top = Math.max(0, rawTop);
  const left = Math.max(0, Math.abs(rawLeft));

  const scrollWidth = targetEl.scrollWidth;
  const scrollHeight = targetEl.scrollHeight;
  const clientWidth = targetIsWindow ? window.innerWidth : targetEl.clientWidth;
  const clientHeight = targetIsWindow ? window.innerHeight : targetEl.clientHeight;

  const maxTop = Math.max(0, scrollHeight - clientHeight);
  const maxLeft = Math.max(0, scrollWidth - clientWidth);

  const progressTop = maxTop > 0 ? Math.min(100, Math.max(0, (top / maxTop) * 100)) : 0;
  const progressLeft = maxLeft > 0 ? Math.min(100, Math.max(0, (left / maxLeft) * 100)) : 0;

  return {
    top,
    left,
    maxTop,
    maxLeft,
    progressTop,
    progressLeft,
    isScrolledTop: top > threshold,
    isScrolledBottom: maxTop > 0 && top >= maxTop - tolerance,
    isScrolledLeft: left > threshold,
    isScrolledRight: maxLeft > 0 && left >= maxLeft - tolerance,
  };
}
