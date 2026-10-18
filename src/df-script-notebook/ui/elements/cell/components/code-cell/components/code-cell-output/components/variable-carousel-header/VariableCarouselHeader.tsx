import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ContentCopy,
  Check,
  UnfoldMore,
} from "@mui/icons-material";
import {
  CarouselDots,
  PanelNavigation,
  NavigationPanelItem,
  Chip,
  ResponsiveCluster,
  ResponsiveClusterItem,
} from "@elements";
import { VariableCarouselHeaderProps } from "./types";

export const VariableCarouselHeader: React.FC<VariableCarouselHeaderProps> = ({
  items,
  activeIndex,
  onSelectIndex,
  canCopy,
  copied,
  onCopy,
  loop = true,
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  if (items.length === 0) return null;

  const currentItem = items[activeIndex] || items[0];
  const total = items.length;
  const isFirst = activeIndex <= 0;
  const isLast = activeIndex >= total - 1;
  const isPrevDisabled = !loop && isFirst;
  const isNextDisabled = !loop && isLast;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (loop) {
      onSelectIndex((activeIndex - 1 + total) % total);
    } else if (!isFirst) {
      onSelectIndex(activeIndex - 1);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (loop) {
      onSelectIndex((activeIndex + 1) % total);
    } else if (!isLast) {
      onSelectIndex(activeIndex + 1);
    }
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setIsMenuOpen(true);
  };

  const panelItems: NavigationPanelItem[] = items.map((item, idx) => ({
    id: item.id || `var-${item.name}-${idx}`,
    icon: (
      <span className="w-4 h-4 flex items-center justify-center shrink-0">
        {idx === activeIndex && (
          <Check sx={{ fontSize: 16, color: "var(--panel-nav-text-primary, currentColor)" }} />
        )}
      </span>
    ),
    label: item.name,
    value: item.typeLabel,
    onClick: () => {
      onSelectIndex(idx);
      setIsMenuOpen(false);
    },
  }));

  const clusterItems: ResponsiveClusterItem[] = React.useMemo(() => {
    const list: ResponsiveClusterItem[] = [
      // Left: Variable Selector & Progress Dots (permanent, never collapses)
      {
        id: "variable-info",
        align: "start",
        permanent: true,
        collapsible: false,
        element: (
          <div className="flex flex-col gap-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={total > 1 ? handleOpenMenu : undefined}
                disabled={total <= 1}
                title={total > 1 ? "Select variable" : undefined}
                className={`flex items-center gap-1.5 text-left bg-transparent border-0 p-0 transition-colors select-none ${
                  total > 1 ? "cursor-pointer group" : "cursor-default"
                }`}
              >
                <span className="font-mono text-xs font-semibold text-white/95 tracking-wide truncate max-w-[200px] flex items-center gap-1.5 group-hover:text-white">
                  {currentItem.isConsole && (
                    <span className="text-[10px] text-white/50 font-mono font-normal">{">_"}</span>
                  )}
                  {currentItem.name}
                </span>
                {total > 1 && (
                  <UnfoldMore
                    sx={{
                      fontSize: 14,
                      color: "rgba(255, 255, 255, 0.4)",
                      transition: "color 0.15s ease",
                      ".group:hover &": { color: "rgba(255, 255, 255, 0.8)" },
                    }}
                  />
                )}
              </button>
            </div>

            {total > 1 && (
              <CarouselDots
                total={total}
                activeIndex={activeIndex}
                onSelect={onSelectIndex}
              />
            )}
          </div>
        ),
      },
    ];

    // Right Steppers: previous & next
    if (total > 1) {
      list.push(
        {
          id: "prev-output",
          align: "end",
          priority: 5,
          label: "Previous Output",
          icon: <ChevronLeft sx={{ fontSize: 16 }} />,
          disabled: isPrevDisabled,
          onClick: handlePrev,
          element: (
            <Chip
              disabled={isPrevDisabled}
              onClick={handlePrev}
              aria-label="Previous output item"
              className={`!w-7 !h-7 !p-0 !rounded-full !flex !items-center !justify-center ${
                isPrevDisabled ? "!opacity-25 !cursor-not-allowed" : "!cursor-pointer"
              }`}
            >
              <ChevronLeft sx={{ fontSize: 16 }} />
            </Chip>
          ),
        },
        {
          id: "next-output",
          align: "end",
          priority: 5,
          label: "Next Output",
          icon: <ChevronRight sx={{ fontSize: 16 }} />,
          disabled: isNextDisabled,
          onClick: handleNext,
          element: (
            <Chip
              disabled={isNextDisabled}
              onClick={handleNext}
              aria-label="Next output item"
              className={`!w-7 !h-7 !p-0 !rounded-full !flex !items-center !justify-center ${
                isNextDisabled ? "!opacity-25 !cursor-not-allowed" : "!cursor-pointer"
              }`}
            >
              <ChevronRight sx={{ fontSize: 16 }} />
            </Chip>
          ),
        }
      );
    }

    // Right Copy Output action
    if (onCopy) {
      list.push({
        id: "copy-output",
        align: "end",
        priority: 3,
        label: copied ? "Copied" : "Copy Output",
        icon: copied ? (
          <Check sx={{ fontSize: 14, color: "var(--cell-indicator-success)" }} />
        ) : (
          <ContentCopy sx={{ fontSize: 13 }} />
        ),
        disabled: !canCopy,
        onClick: canCopy ? () => onCopy() : undefined,
        element: (
          <Chip
            disabled={!canCopy}
            onClick={canCopy ? onCopy : undefined}
            title={
              !canCopy
                ? "Copy not available for this output"
                : copied
                  ? "Copied to clipboard"
                  : "Copy output"
            }
            aria-label={!canCopy ? "Copy not available" : "Copy output"}
            className={`!w-7 !h-7 !p-0 !rounded-full !flex !items-center !justify-center ${
              !canCopy ? "!opacity-25 !cursor-not-allowed" : "!cursor-pointer"
            }`}
          >
            {copied ? (
              <Check sx={{ fontSize: 14, color: "var(--cell-indicator-success)" }} />
            ) : (
              <ContentCopy sx={{ fontSize: 13 }} />
            )}
          </Chip>
        ),
      });
    }

    return list;
  }, [
    currentItem.isConsole,
    currentItem.name,
    total,
    activeIndex,
    onSelectIndex,
    isPrevDisabled,
    isNextDisabled,
    onCopy,
    canCopy,
    copied,
  ]);

  return (
    <div className="relative z-10 shrink-0 px-1 py-1.5 select-none w-full">
      <ResponsiveCluster
        items={clusterItems}
        gap={6}
        className="w-full"
      />

      <PanelNavigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        anchorEl={anchorEl}
        placement="bottom-start"
        title="Variables"
        items={panelItems}
      />
    </div>
  );
};

export default VariableCarouselHeader;

