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

