import React from "react";
import {
  DashboardCustomize,
  Close,
  Add,
  GridOn,
  GridOff,
  Tune,
  AutoAwesomeMosaic,
  MoreHoriz,
} from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { ScrollableCanvas, ScrollableCanvasHandle } from "../../../../ui/elements";
import { PanelNavigation } from "../../elements";
import { CanvasPageBarProps } from "./types";

export default function CanvasPageBar({
  pages,
  activePageId,
  editingPageId,
  gridConfig,
  showGridConfigModal,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onRenamePage,
  onSetEditingPageId,
  onToggleGridLines,
  onToggleGridModal,
  onUpdateGridConfig,
}: CanvasPageBarProps) {
  const [showPageMenu, setShowPageMenu] = React.useState(false);
  const moreButtonRef = React.useRef<HTMLButtonElement>(null);
  const scrollableRef = React.useRef<ScrollableCanvasHandle>(null);
  const tabRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  React.useEffect(() => {
    const activeEl = tabRefs.current.get(activePageId);
    if (activeEl && scrollableRef.current) {
      // Defer slightly with requestAnimationFrame to ensure layout measurements are exact
      requestAnimationFrame(() => {
        scrollableRef.current?.scrollToElement(activeEl, "smooth");
      });
    }
  }, [activePageId]);

  const PRESETS = [
    { label: "10x10", cols: 10, rows: 10 },
    { label: "12x24", cols: 12, rows: 24 },
    { label: "20x20", cols: 20, rows: 20 },
    { label: "40x40", cols: 40, rows: 40 },
  ];

  return (
    <>
      <div className="bg-[var(--nb-bg-app)] border-b border-white/[0.04] px-4 md:px-6 py-1.5 flex items-center justify-between select-none shrink-0 animate-fade-in">
        <div className="w-full flex items-center justify-between gap-3">
          {/* Scrollable Canvas Tabs Area */}
          <div className="min-w-0 flex-1 flex items-center gap-1.5">
            <ScrollableCanvas
              ref={scrollableRef}
              gap={4}
              className="min-w-0 flex-1"
              arrowBackgroundColor="var(--nb-bg-app)"
              arrowColor="var(--nb-text-heading)"
            >
              {pages.map((p) => {
                const isSelected = p.id === activePageId;
                const isEditing = editingPageId === p.id;

                return (
                  <div
                    key={p.id}
                    ref={(el) => {
                      if (el) {
                        tabRefs.current.set(p.id, el);
                      } else {
                        tabRefs.current.delete(p.id);
                      }
                    }}
                    onClick={() => {
                      onSelectPage(p.id);
                      const el = tabRefs.current.get(p.id);
                      if (el && scrollableRef.current) {
                        scrollableRef.current.scrollToElement(el, "smooth");
                      }
                    }}
                    className={`group relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all whitespace-nowrap shrink-0 ${
                      isSelected
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    <DashboardCustomize sx={{ fontSize: 13, opacity: isSelected ? 0.9 : 0.4 }} className="shrink-0" />
                    {isEditing ? (
                      <input
                        type="text"
                        defaultValue={p.title}
                        onBlur={(e) => onRenamePage(p.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onRenamePage(p.id, (e.target as HTMLInputElement).value);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="bg-black/60 border border-white/20 rounded px-1.5 py-0.5 text-xs text-white outline-none w-24 shrink-0"
                      />
                    ) : (
                      <span
                        onDoubleClick={() => onSetEditingPageId(p.id)}
                        title="Double click to rename"
                        className="whitespace-nowrap select-none"
                      >
                        {p.title}
                      </span>
                    )}

                    {pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(p.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 p-0.5 rounded transition-opacity shrink-0"
                        title="Delete Page"
                      >
                        <Close sx={{ fontSize: 11 }} />
                      </button>
                    )}
                  </div>
                );
              })}
            </ScrollableCanvas>

            {/* Persistent ... and + Actions on the Right */}
            <div className="flex items-center gap-0.5 shrink-0 pl-1 border-l border-white/[0.08]">
              <IconButton
                ref={moreButtonRef}
                size="small"
                onClick={() => setShowPageMenu(!showPageMenu)}
                title="Navigate Canvas Pages"
                sx={{
                  color: showPageMenu ? "var(--nb-text-primary)" : "var(--nb-text-muted)",
                  backgroundColor: showPageMenu ? "rgba(255,255,255,0.1)" : "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "var(--nb-text-primary)",
                  },
                  width: 26,
                  height: 26,
                  borderRadius: "6px",
                }}
              >
                <MoreHoriz sx={{ fontSize: 16 }} />
              </IconButton>

              <IconButton
                size="small"
                onClick={onAddPage}
                title="Add New Canvas Page"
                sx={{
                  color: "var(--nb-text-muted)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.08)",
                    color: "var(--nb-text-primary)",
                  },
                  width: 26,
                  height: 26,
                  borderRadius: "6px",
                }}
              >
                <Add sx={{ fontSize: 16 }} />
              </IconButton>

              {/* Navigation Menu for All Canvas Pages */}
              <PanelNavigation
                isOpen={showPageMenu}
                onClose={() => setShowPageMenu(false)}
                anchorEl={moreButtonRef.current}
                placement="bottom-start"
                title="Canvas Pages"
                items={pages.map((p, idx) => ({
                  id: p.id,
                  icon: <DashboardCustomize sx={{ fontSize: 16, color: p.id === activePageId ? "var(--panel-nav-accent)" : "inherit" }} />,
                  label: p.title || `Canvas ${idx + 1}`,
                  value: p.id === activePageId ? "Active" : undefined,
                  onClick: () => {
                    onSelectPage(p.id);
                    setShowPageMenu(false);
                  },
                }))}
              />
            </div>
          </div>

          {/* Grid Settings Options */}
          <div className="flex items-center gap-2 text-xs font-mono shrink-0 whitespace-nowrap">
            <button
              onClick={onToggleGridLines}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                gridConfig.showGridLines ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
              title="Toggle Visual Grid Guidelines"
            >
              {gridConfig.showGridLines ? <GridOn sx={{ fontSize: 13 }} /> : <GridOff sx={{ fontSize: 13 }} />}
              <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              onClick={onToggleGridModal}
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded transition-colors ${
                showGridConfigModal ? "bg-white/15 text-white" : "bg-white/5 text-zinc-400 hover:text-white"
              }`}
              title="Configure Grid Dimensions (Columns x Rows)"
            >
              <Tune sx={{ fontSize: 13 }} />
              <span>
                {gridConfig.columns} x {gridConfig.rows}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Flyout Modal */}
      {showGridConfigModal && (
        <div className="bg-[var(--nb-bg-surface)] border-b border-[var(--nb-border-default)] px-4 md:px-8 py-2.5 animate-fade-in select-none">
          <div className="w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-4 text-zinc-300">
              <span className="font-bold text-white uppercase tracking-wider text-[10px] flex items-center gap-1">
                <AutoAwesomeMosaic sx={{ fontSize: 13 }} /> Grid Dimensions:
              </span>
              <label className="flex items-center gap-1.5">
                <span className="text-zinc-400">Columns:</span>
                <input
                  type="number"
                  min={2}
                  max={50}
                  value={gridConfig.columns}
                  onChange={(e) =>
                    onUpdateGridConfig({ columns: Math.max(2, Math.min(50, parseInt(e.target.value) || 12)) })
                  }
                  className="w-14 bg-black/60 border border-white/20 rounded px-2 py-0.5 text-white outline-none"
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-zinc-400">Rows:</span>
                <input
                  type="number"
                  min={4}
                  max={100}
                  value={gridConfig.rows}
                  onChange={(e) =>
                    onUpdateGridConfig({ rows: Math.max(4, Math.min(100, parseInt(e.target.value) || 24)) })
                  }
                  className="w-14 bg-black/60 border border-white/20 rounded px-2 py-0.5 text-white outline-none"
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-zinc-400">Row Height (px):</span>
                <input
                  type="number"
                  min={20}
                  max={150}
                  value={gridConfig.rowHeight}
                  onChange={(e) =>
                    onUpdateGridConfig({ rowHeight: Math.max(20, Math.min(150, parseInt(e.target.value) || 48)) })
                  }
                  className="w-14 bg-black/60 border border-white/20 rounded px-2 py-0.5 text-white outline-none"
                />
              </label>
            </div>

            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-zinc-500 mr-1">Presets:</span>
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => onUpdateGridConfig({ columns: preset.cols, rows: preset.rows })}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
