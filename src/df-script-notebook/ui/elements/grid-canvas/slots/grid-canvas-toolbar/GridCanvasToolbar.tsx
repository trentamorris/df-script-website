import React from "react";
import {
  DashboardCustomize,
  Close,
  Add,
  Tune,
  AutoAwesomeMosaic,
  MoreHoriz,
} from "@mui/icons-material";
import { ScrollableCanvas, ScrollableCanvasHandle } from "../../../../../../ui/elements";
import { Chip, PanelNavigation } from "../../../..";
import { useGridCanvas } from "../../hooks/useGridCanvas";
import {
  GridCanvasToolbarProps,
  GridCanvasDimensionsFlyoutProps,
  GridCanvasDimensionsButtonProps,
  GridCanvasPageSectionProps,
} from "./types";

const GRID_PRESETS = [
  { label: "10x10", cols: 10, rows: 10 },
  { label: "12x24", cols: 12, rows: 24 },
  { label: "20x20", cols: 20, rows: 20 },
  { label: "40x40", cols: 40, rows: 40 },
];

/**
 * Collapsible configuration panel above the toolbar for modifying
 * columns, rows, row height, and quick presets.
 */
export const GridCanvasDimensionsFlyout = React.forwardRef<
  HTMLDivElement,
  GridCanvasDimensionsFlyoutProps
>(({ gridConfig: propGridConfig, onUpdateGridConfig: propOnUpdateGridConfig, show: propShow, className = "", ...props }, ref) => {
  const ctx = useGridCanvas();
  const gridConfig = propGridConfig ?? ctx.gridConfig;
  const onUpdateGridConfig = propOnUpdateGridConfig ?? ctx.onUpdateGridConfig;
  const isVisible = propShow !== undefined ? propShow : Boolean(ctx.showGridConfigModal);

  if (!isVisible) return null;

  return (
    <div
      ref={ref}
      className={`bg-[var(--nb-bg-surface)] border-t border-[var(--nb-border-default)] px-4 md:px-8 py-2.5 animate-fade-in select-none shrink-0 z-30 ${className}`}
      {...props}
    >
      <div className="w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4 text-[var(--nb-text-secondary)]">
          <span className="font-bold text-[var(--nb-text-primary)] uppercase tracking-wider text-[10px] flex items-center gap-1">
            <AutoAwesomeMosaic sx={{ fontSize: 13 }} /> Grid Dimensions:
          </span>
          <label className="flex items-center gap-1.5">
            <span className="text-[var(--nb-text-muted)]">Columns:</span>
            <input
              type="number"
              min={2}
              max={50}
              value={gridConfig.columns}
              onChange={(e) =>
                onUpdateGridConfig?.({
                  columns: Math.max(2, Math.min(50, parseInt(e.target.value) || 12)),
                })
              }
              className="w-14 bg-black/60 border border-[var(--nb-border-strong)] rounded px-2 py-0.5 text-[var(--nb-text-primary)] outline-none focus:border-[var(--nb-border-focus)]"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-[var(--nb-text-muted)]">Rows:</span>
            <input
              type="number"
              min={4}
              max={100}
              value={gridConfig.rows}
              onChange={(e) =>
                onUpdateGridConfig?.({
                  rows: Math.max(4, Math.min(100, parseInt(e.target.value) || 24)),
                })
              }
              className="w-14 bg-black/60 border border-[var(--nb-border-strong)] rounded px-2 py-0.5 text-[var(--nb-text-primary)] outline-none focus:border-[var(--nb-border-focus)]"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-[var(--nb-text-muted)]">Row Height (px):</span>
            <input
              type="number"
              min={20}
              max={150}
              value={gridConfig.rowHeight}
              onChange={(e) =>
                onUpdateGridConfig?.({
                  rowHeight: Math.max(20, Math.min(150, parseInt(e.target.value) || 48)),
                })
              }
              className="w-14 bg-black/60 border border-[var(--nb-border-strong)] rounded px-2 py-0.5 text-[var(--nb-text-primary)] outline-none focus:border-[var(--nb-border-focus)]"
            />
          </label>
        </div>

        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-[var(--nb-text-subtle)] mr-1">Presets:</span>
          {GRID_PRESETS.map((preset) => (
            <Chip
              key={preset.label}
              variant="muted"
              onClick={() =>
                onUpdateGridConfig?.({ columns: preset.cols, rows: preset.rows })
              }
              className="!h-6 !px-2 font-mono text-[11px]"
            >
              {preset.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
});
GridCanvasDimensionsFlyout.displayName = "GridCanvasDimensionsFlyout";

/**
 * Button indicating grid dimensions (e.g. 12 × 24) and toggling the dimensions flyout.
 */
export const GridCanvasDimensionsButton = React.forwardRef<
  HTMLButtonElement,
  GridCanvasDimensionsButtonProps
>(({ gridConfig: propGridConfig, active: propActive, onToggle, render, className = "", ...props }, ref) => {
  const ctx = useGridCanvas();
  const gridConfig = propGridConfig ?? ctx.gridConfig;
  const isActive = propActive !== undefined ? propActive : Boolean(ctx.showGridConfigModal);
  const handleToggle = onToggle ?? ctx.onToggleGridModal;

  return (
    <Chip
      ref={ref}
      variant={isActive ? "active" : "default"}
      onClick={handleToggle}
      title="Configure Grid Dimensions (Columns x Rows)"
      className={`!h-7 !px-2.5 !text-xs font-mono ${className}`}
      {...props}
    >
      {render ? (
        render(gridConfig.columns, gridConfig.rows)
      ) : (
        <>
          <Tune sx={{ fontSize: 13 }} />
          <span>
            {gridConfig.columns} &times; {gridConfig.rows}
          </span>
        </>
      )}
    </Chip>
  );
});
GridCanvasDimensionsButton.displayName = "GridCanvasDimensionsButton";

/**
 * Single unified page section containing the scrollable sheet tabs,
 * the page switcher dropdown ('...'), and the add page button ('+').
 */
export const GridCanvasPageSection = React.forwardRef<
  HTMLDivElement,
  GridCanvasPageSectionProps
>(({
  pages: propPages,
  activePageId: propActivePageId,
  editingPageId: propEditingPageId,
  onSelectPage: propOnSelectPage,
  onRenamePage: propOnRenamePage,
  onDeletePage: propOnDeletePage,
  onSetEditingPageId: propOnSetEditingPageId,
  onAddPage: propOnAddPage,
  showAddButton = true,
  showNavigator = true,
  className = "",
  ...props
}, ref) => {
  const ctx = useGridCanvas();
  const pages = propPages ?? ctx.pages ?? [];
  const activePageId = propActivePageId ?? ctx.activePageId ?? "";
  const editingPageId = propEditingPageId !== undefined ? propEditingPageId : ctx.editingPageId;
  const onSelectPage = propOnSelectPage ?? ctx.onSelectPage;
  const onRenamePage = propOnRenamePage ?? ctx.onRenamePage;
  const onDeletePage = propOnDeletePage ?? ctx.onDeletePage;
  const onSetEditingPageId = propOnSetEditingPageId ?? ctx.onSetEditingPageId;
  const onAddPage = propOnAddPage ?? ctx.onAddPage;

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const moreButtonRef = React.useRef<HTMLButtonElement>(null);
  const scrollableRef = React.useRef<ScrollableCanvasHandle>(null);
  const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());

  React.useEffect(() => {
    const activeEl = tabRefs.current.get(activePageId);
    if (activeEl && scrollableRef.current) {
      requestAnimationFrame(() => {
        scrollableRef.current?.scrollToElement(activeEl, "smooth");
      });
    }
  }, [activePageId]);

  return (
    <div
      ref={ref}
      className={`min-w-0 flex-1 flex items-center gap-1.5 ${className}`}
      {...props}
    >
      {/* Scrollable Tabs */}
      <ScrollableCanvas
        ref={scrollableRef}
        gap={6}
        className="min-w-0 flex-1"
        arrowBackgroundColor="var(--nb-bg-app)"
        arrowColor="var(--nb-text-heading)"
      >
        {pages.map((p) => {
          const isSelected = p.id === activePageId;
          const isEditing = editingPageId === p.id;

          return (
            <Chip
              key={p.id}
              ref={(el: HTMLButtonElement | null) => {
                if (el) {
                  tabRefs.current.set(p.id, el);
                } else {
                  tabRefs.current.delete(p.id);
                }
              }}
              variant={isSelected ? "active" : "default"}
              onClick={() => {
                onSelectPage?.(p.id);
                const el = tabRefs.current.get(p.id);
                if (el && scrollableRef.current) {
                  scrollableRef.current.scrollToElement(el, "smooth");
                }
              }}
              className={`group relative !h-7 !px-2.5 !text-xs font-sans ${
                isSelected ? "shadow-sm font-semibold" : "opacity-80 hover:opacity-100"
              }`}
            >
              <DashboardCustomize
                sx={{ fontSize: 13, opacity: isSelected ? 0.9 : 0.5 }}
                className="shrink-0"
              />
              {isEditing ? (
                <input
                  type="text"
                  defaultValue={p.title}
                  onBlur={(e) => onRenamePage?.(p.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRenamePage?.(p.id, (e.target as HTMLInputElement).value);
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  className="bg-black/60 border border-[var(--nb-border-strong)] rounded px-1.5 py-0.5 text-xs text-[var(--nb-text-primary)] outline-none w-24 shrink-0 font-medium"
                />
              ) : (
                <span
                  onDoubleClick={() => onSetEditingPageId?.(p.id)}
                  title="Double click to rename"
                  className="whitespace-nowrap select-none"
                >
                  {p.title}
                </span>
              )}

              {pages.length > 1 && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePage?.(p.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-[var(--cell-accent-rose)] p-0.5 rounded transition-opacity shrink-0 flex items-center ml-0.5"
                  title="Delete Page"
                >
                  <Close sx={{ fontSize: 11 }} />
                </span>
              )}
            </Chip>
          );
        })}
      </ScrollableCanvas>

      {/* Navigator & Add Actions */}
      {(showNavigator || showAddButton) && (
        <div className="flex items-center gap-1 shrink-0 pl-1.5 border-l border-[var(--nb-border-default)]">
          {showNavigator && (
            <>
              <Chip
                ref={moreButtonRef}
                variant={isMenuOpen ? "active" : "default"}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title="Navigate Canvas Pages"
                className="!h-7 !px-1.5"
              >
                <MoreHoriz sx={{ fontSize: 16 }} />
              </Chip>

              <PanelNavigation
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                anchorEl={moreButtonRef.current}
                placement="top-start"
                title="Canvas Pages"
                items={pages.map((p, idx) => ({
                  id: p.id,
                  icon: (
                    <DashboardCustomize
                      sx={{
                        fontSize: 16,
                        color: p.id === activePageId ? "var(--panel-nav-accent)" : "inherit",
                      }}
                    />
                  ),
                  label: p.title || `Canvas ${idx + 1}`,
                  value: p.id === activePageId ? "Active" : undefined,
                  onClick: () => {
                    onSelectPage?.(p.id);
                    setIsMenuOpen(false);
                  },
                }))}
              />
            </>
          )}

          {showAddButton && (
            <Chip
              variant="default"
              onClick={onAddPage}
              title="Add New Canvas Page"
              className="!h-7 !px-1.5"
            >
              <Add sx={{ fontSize: 16 }} />
            </Chip>
          )}
        </div>
      )}
    </div>
  );
});
GridCanvasPageSection.displayName = "GridCanvasPageSection";

/**
 * Composable GridCanvasToolbar container.
 * When rendered with children, it hosts whatever composition of modules the user desires.
 * When rendered without children, it renders the default complete toolbar layout.
 */
export const GridCanvasToolbar = React.forwardRef<
  HTMLDivElement,
  GridCanvasToolbarProps
>(({ children, className = "", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`w-full flex flex-col shrink-0 ${className}`}
      {...props}
    >
      {children ? (
        children
      ) : (
        <>
          <GridCanvasDimensionsFlyout />
          <div className="bg-[var(--nb-bg-app)] border-t border-[var(--nb-border-cell)] px-3 md:px-5 py-1.5 flex items-center justify-between select-none shrink-0 z-30 animate-fade-in">
            <div className="w-full flex items-center justify-between gap-3">
              <GridCanvasPageSection />
              <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap pl-2 border-l border-[var(--nb-border-default)]">
                <GridCanvasDimensionsButton />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});
GridCanvasToolbar.displayName = "GridCanvasToolbar";

export default GridCanvasToolbar;
