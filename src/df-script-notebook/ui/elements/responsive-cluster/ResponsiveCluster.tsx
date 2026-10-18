import React from "react";
import { MoreHoriz } from "@mui/icons-material";
import { Chip } from "../chip/Chip";
import PanelNavigation from "../panel-navigation/PanelNavigation";
import { NavigationPanelItem } from "../panel-navigation/types";
import { ResponsiveClusterProps, ResponsiveClusterItem } from "./types";

/**
 * Generic responsive cluster with ResizeObserver measurement.
 * Items collapse smoothly in priority order as container width contracts.
 * If showOverflowMenu is true (default), collapsed items are accessible via '...'.
 * If showOverflowMenu is false, collapsed items smoothly fade & scale to 0.
 * Also supports fading out entirely when below minParentHeight or minParentWidth.
 */
export const ResponsiveCluster: React.FC<ResponsiveClusterProps> = ({
  items = [],
  showOverflowMenu = true,
  minParentHeight,
  minParentWidth,
  gap = 8,
  className = "",
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const moreBtnRef = React.useRef<HTMLButtonElement>(null);
  const [collapsedIds, setCollapsedIds] = React.useState<Set<string>>(new Set());
  const [isDimmedOut, setIsDimmedOut] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Cached measurements map ref to retain natural element widths across collapse/re-expand cycles
  const itemWidthsRef = React.useRef<Map<string, number>>(new Map());

  // Measure parent / available space and determine how many items must overflow
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const checkOverflow = () => {
      const containerWidth = el.clientWidth;
      if (containerWidth <= 0) return;

      const isCollapsible = (item: ResponsiveClusterItem) =>
        item.collapsible !== false && !item.permanent && item.showAsAction !== "always";

      // Calculate width for each item using accurately pre-measured widths
      const getItemWidth = (item: ResponsiveClusterItem) => {
        const measured = itemWidthsRef.current.get(item.id);
        if (measured && measured > 0) return measured + gap;
        return (item.label && item.label.length > 5 ? 70 : 32) + gap;
      };

      const totalRequired = items.reduce((acc, it) => acc + getItemWidth(it), 0);

      // Check if everything fits
      if (containerWidth >= totalRequired) {
        setCollapsedIds(new Set());
        return;
      }

      const moreBtnWidth = showOverflowMenu ? 28 + gap : 0;
      const availableSpace = Math.max(0, containerWidth - (showOverflowMenu ? moreBtnWidth : 0));

      // Items marked showAsAction: "never" are always collapsed
      const nextCollapsed = new Set<string>();
      items.forEach((it) => {
        if (it.showAsAction === "never") {
          nextCollapsed.add(it.id);
        }
      });

      // Filter collapsible candidate items
      const candidates = items
        .map((item, index) => ({ item, index, width: getItemWidth(item) }))
        .filter(({ item }) => isCollapsible(item) && item.showAsAction !== "never");

      // Sort: lowest priority collapses first; if equal priority, higher index (rightmost) collapses first
      candidates.sort((a, b) => {
        const pA = a.item.priority ?? 0;
        const pB = b.item.priority ?? 0;
        if (pA !== pB) return pA - pB;
        return b.index - a.index;
      });

      let currentWidth = totalRequired;
      for (const cand of candidates) {
        if (currentWidth <= availableSpace) {
          break;
        }
        nextCollapsed.add(cand.item.id);
        currentWidth -= cand.width;
      }

      setCollapsedIds(nextCollapsed);
    };

    const observer = new ResizeObserver(() => {
      checkOverflow();
    });

    observer.observe(el);
    if (el.parentElement) {
      observer.observe(el.parentElement);
    }
    checkOverflow();

    return () => observer.disconnect();
  }, [items, showOverflowMenu, minParentHeight, minParentWidth, gap]);

  const isItemVisible = (item: ResponsiveClusterItem) => {
    if (item.showAsAction === "never") return false;
    if (item.collapsible === false || item.permanent || item.showAsAction === "always") return true;
    return !collapsedIds.has(item.id);
  };

  const hiddenItems = items.filter((it) => collapsedIds.has(it.id));

  // Convert hidden items to PanelNavigation items
  const menuItems: NavigationPanelItem[] = React.useMemo(() => {
    if (!showOverflowMenu) return [];
    return hiddenItems.map((item) => ({
      id: item.id,
      label: item.label || item.id,
      value: item.value,
      icon: item.icon,
      disabled: item.disabled,
      subPanel: item.subPanel,
      onClick: (e?: any) => {
        if (!item.subPanel) {
          setIsMenuOpen(false);
        }
        item.onClick?.(e);
      },
    }));
  }, [showOverflowMenu, hiddenItems]);

  const hasOverflow = showOverflowMenu && hiddenItems.length > 0;

  const sortByOrder = (a: ResponsiveClusterItem, b: ResponsiveClusterItem) => {
    if (a.order !== undefined || b.order !== undefined) {
      return (a.order ?? 0) - (b.order ?? 0);
    }
    return 0;
  };

  const startItems = items.filter((it) => (it.align ?? "start") === "start").sort(sortByOrder);
  const centerItems = items.filter((it) => it.align === "center").sort(sortByOrder);
  const endItems = items.filter((it) => it.align === "end").sort(sortByOrder);

  const renderItemNode = (item: ResponsiveClusterItem, origin: string) => {
    const isVisible = isItemVisible(item);
    return (
      <div
        key={item.id}
        style={{
          maxWidth: isVisible ? 240 : 0,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0.85)",
          pointerEvents: isVisible ? "auto" : "none",
          marginLeft: isVisible ? undefined : 0,
          marginRight: isVisible ? gap : 0,
        }}
        className={`overflow-hidden whitespace-nowrap transition-all duration-200 ease-out flex items-center shrink-0 ${origin}`}
      >
        {item.element}
      </div>
    );
  };

  return (
    <>
      {/* Off-screen measurement scratchpad to capture natural element widths */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -9999,
          left: -9999,
          visibility: "hidden",
          pointerEvents: "none",
          display: "flex",
          whiteSpace: "nowrap",
        }}
      >
        {items.map((item) => (
          <div
            key={`meas-${item.id}`}
            ref={(node) => {
              if (node && node.offsetWidth > 0) {
                itemWidthsRef.current.set(item.id, node.offsetWidth);
              }
            }}
          >
            {item.element}
          </div>
        ))}
      </div>

      <div
        ref={containerRef}
        style={{
          opacity: isDimmedOut ? 0 : 1,
          pointerEvents: isDimmedOut ? "none" : "auto",
        }}
        className={`flex items-center ${endItems.length > 0 || centerItems.length > 0 ? "justify-between" : "justify-start"} w-full min-w-0 whitespace-nowrap transition-opacity duration-200 ease-out ${className}`}
      >
        {/* Start cluster */}
        <div className="flex items-center shrink-0 whitespace-nowrap">
          {startItems.map((item) => renderItemNode(item, "origin-left"))}
        </div>

        {/* Center cluster */}
        {centerItems.length > 0 && (
          <div className="flex items-center justify-center shrink-0 whitespace-nowrap">
            {centerItems.map((item) => renderItemNode(item, "origin-center"))}
          </div>
        )}

        {/* End cluster */}
        <div className="flex items-center justify-end shrink-0 whitespace-nowrap">
          {endItems.map((item) => renderItemNode(item, "origin-right"))}

          {/* Overflow '...' Button */}
          {showOverflowMenu && (
            <div
              style={{
                maxWidth: hasOverflow ? 40 : 0,
                opacity: hasOverflow ? 1 : 0,
                transform: hasOverflow ? "scale(1)" : "scale(0.85)",
                pointerEvents: hasOverflow ? "auto" : "none",
              }}
              className="overflow-hidden whitespace-nowrap transition-all duration-200 ease-out flex items-center shrink-0"
            >
              <Chip
                ref={moreBtnRef}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setIsMenuOpen((prev) => !prev);
                }}
                title="More actions"
                className="!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center cursor-pointer"
              >
                <MoreHoriz sx={{ fontSize: 16 }} />
              </Chip>

              <div
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <PanelNavigation
                  isOpen={isMenuOpen}
                  onClose={() => setIsMenuOpen(false)}
                  anchorEl={moreBtnRef.current}
                  placement="bottom-end"
                  title="More Actions"
                  items={menuItems}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Backwards compatibility alias
export const ResponsiveToolbar = ResponsiveCluster;
export default ResponsiveCluster;
