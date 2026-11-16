import React from "react";
import { KeyboardArrowDown, KeyboardArrowRight, ChevronRight, Close, Check } from "@mui/icons-material";
import type { OperationItem, DocsVersion } from "../../../../types";
import { $df } from "df-script";

import { getQualifiedPath } from "../../../../utils/routing";
import type { SidebarProps } from "./types";
import { SearchInput, ScrollableCanvas, Chip } from "../../../elements";
import { useLayout } from "../../../../hooks/useLayout";
import styles from "./sidebar.module.css";

export function Sidebar({
  activeVersion,
  setActiveVersion,
  currentOpName,
  operationsIndex,
  setIsMenuOpen,
  isDrawer = false,
  isMenuOpen = false,
  versionOptions = [],
  backgroundColor,
  showHeader = true,
  onSelectOp,
}: SidebarProps) {
  const [explorerSearchQuery, setExplorerSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  // Dynamic open folders state
  const [openFolders, setOpenFolders] = React.useState<Record<string, boolean>>({});
  const [stuckCategories, setStuckCategories] = React.useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const chipsNavRef = React.useRef<HTMLDivElement>(null);
  const targetCategoryRef = React.useRef<string | null>(null);
  const scrollEndTimerRef = React.useRef<number | null>(null);

  // Auto-expand folder when currentOpName changes (e.g. from routing)
  React.useEffect(() => {
    if (currentOpName) {
      const op = operationsIndex.find((o) => (o.callExpression || o.name) === currentOpName);
      if (op && op.category) {
        setOpenFolders((prev) => ({ ...prev, [op.category]: true }));
      }
    }
  }, [currentOpName, operationsIndex]);

  // Listen to Escape key to close the drawer overlay
  React.useEffect(() => {
    if (!isDrawer || !isMenuOpen || !setIsMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawer, isMenuOpen, setIsMenuOpen]);

  const q = explorerSearchQuery.trim().toLowerCase();

  // Create DataFrame from the list of operations for dogfooding!
  const df = React.useMemo(() => {
    return operationsIndex.length > 0 ? $df.data(operationsIndex) : null;
  }, [operationsIndex]);

  const allAvailableCategories: string[] = React.useMemo(() => {
    if (!df) return [];
    return df.select("category").unique().sort({ by: "category" }).toArray("category") as string[];
  }, [df]);

  const getFilteredOps = React.useCallback((category: string): OperationItem[] => {
    if (!df) return [];

    let filtered = df.filter($df.col("category").eq(category));

    if (q) {
      filtered = filtered.filter(
        $df.col("callExpression").str.toLowerCase().str.contains(q)
          .or($df.col("desc").str.toLowerCase().str.contains(q))
      );
    }

    return filtered.sort({ by: "callExpression" }).toDicts() as OperationItem[];
  }, [df, q]);

  // Dynamically find categories present in the operations index that have matching operations
  const categoriesList: string[] = React.useMemo(() => {
    if (!q) return allAvailableCategories;
    return allAvailableCategories.filter((cat) => getFilteredOps(cat).length > 0);
  }, [allAvailableCategories, q, getFilteredOps]);
  React.useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root) return;

    const handleScroll = () => {
      const rootRect = root.getBoundingClientRect();
      const offsetTop = rootRect.top;

      let currentActive: string | null = categoriesList[0] || null;
      for (const cat of categoriesList) {
        const el = document.getElementById(`sidebar-section-${cat}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If top of section is at or above the sticky threshold
          if (rect.top - offsetTop <= 48) {
            currentActive = cat;
          } else {
            break;
          }
        }
      }

      // If a click target was set, don't update active category until we've reached it (or user takes over with touch)
      if (targetCategoryRef.current) {
        if (currentActive === targetCategoryRef.current) {
          targetCategoryRef.current = null;
        } else {
          return;
        }
      }

      setActiveCategory(currentActive);
    };

    const handleUserInteraction = () => {
      // If user touches or wheels manually, dismiss keyboard and cancel programmatic lock
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      targetCategoryRef.current = null;
    };

    root.addEventListener("scroll", handleScroll, { passive: true });
    root.addEventListener("touchstart", handleUserInteraction, { passive: true });
    root.addEventListener("wheel", handleUserInteraction, { passive: true });
    handleScroll();
    return () => {
      root.removeEventListener("scroll", handleScroll);
      root.removeEventListener("touchstart", handleUserInteraction);
      root.removeEventListener("wheel", handleUserInteraction);
    };
  }, [categoriesList]);

  // Keep active category synced if current one is filtered out
  React.useEffect(() => {
    if (categoriesList.length === 0) {
      setActiveCategory(null);
      return;
    }
    if (!activeCategory || !categoriesList.includes(activeCategory)) {
      setActiveCategory(categoriesList[0]);
    }
  }, [categoriesList, activeCategory]);

  // Auto-scroll the active chip into view horizontally
  React.useEffect(() => {
    const nav = chipsNavRef.current;
    if (!nav || !activeCategory) return;
    const chipBtn = nav.querySelector(`[data-chip-key="${activeCategory}"]`) as HTMLElement | null;
    if (chipBtn) {
      chipBtn.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeCategory]);

  const scrollToCategory = (cat: string) => {
    const root = scrollContainerRef.current;
    if (!root) return;

    // Immediately highlight the target chip and pin it
    setActiveCategory(cat);
    targetCategoryRef.current = cat;

    if (scrollEndTimerRef.current) {
      clearTimeout(scrollEndTimerRef.current);
    }

    const el = document.getElementById(`sidebar-section-${cat}`);
    if (el) {
      const rootTop = root.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      const relativeTop = elTop - rootTop + root.scrollTop;
      root.scrollTo({ top: relativeTop, behavior: "smooth" });
    }

    // Fallback release if target is reached or after smooth scroll settles
    scrollEndTimerRef.current = setTimeout(() => {
      targetCategoryRef.current = null;
    }, 1500);
  };

  // Detect when sticky headers are stuck using an IntersectionObserver on 1px sentinels
  React.useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        setStuckCategories((prev) => {
          let changed = false;
          const next = { ...prev };
          entries.forEach((entry) => {
            const cat = entry.target.getAttribute("data-sentinel-for");
            if (cat) {
              const isStuck = !entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0);
              if (next[cat] !== isStuck) {
                next[cat] = isStuck;
                changed = true;
              }
            }
          });
          return changed ? next : prev;
        });
      },
      { root, threshold: 0 }
    );

    const sentinels = root.querySelectorAll("[data-sentinel-for]");
    sentinels.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [categoriesList]);

  const getFolderDisplayName = (category: string) => {
    if (category === "DataFrame") return "DataFrame Operations";
    if (category === "ColumnExpression") return "Column Expressions";
    if (category === "Function") return "Functions";
    if (category === "DataType") return "Data Types";
    if (category === "Exception") return "Exceptions";
    return category; // fallback for any new/custom categories
  };

  const { isMobile } = useLayout();
  const effectiveBgColor = backgroundColor || (isMobile ? "#060606" : "#0c0c0c");

  const content = (
    <div
      className="flex-1 flex flex-col min-h-0 select-none h-full overflow-hidden"
      style={{ backgroundColor: effectiveBgColor }}
    >
      {/* Explorer Header with Interactive Version Selector (Sticky at the top) */}
      <div className="flex flex-col shrink-0 bg-transparent z-20 scrollbar-placeholder">
        {showHeader && (
          <div className="flex items-center justify-between px-4 md:px-5 pt-2.5 pb-3">
            <span className="text-[9px] font-outfit text-zinc-400 uppercase tracking-widest select-none font-semibold">API EXPLORER</span>
            <div className="flex items-center gap-1 text-[9px] font-outfit text-zinc-400 select-none font-semibold uppercase tracking-wider shrink-0 bg-transparent py-1">
              <span className="text-[8px] text-zinc-500 tracking-widest font-semibold mr-0.5">VERSION:</span>
              <span className="text-zinc-200 font-medium">{activeVersion}</span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="px-4 md:px-5 pb-0 pt-1">
          <SearchInput
            value={explorerSearchQuery}
            onChange={setExplorerSearchQuery}
            placeholder="Type to Search"
            variant="base"
          />
        </div>

        {/* Category Navigation Chips: mobile only jump-nav table of contents */}
        {isMobile && allAvailableCategories.length > 0 && (
          <div ref={chipsNavRef} className="pt-4 pb-2 w-full">
            <ScrollableCanvas
              showArrows={false}
              gap={6}
              scrollContentStartOffset={isMobile ? 16 : 32}
              scrollContentEndOffset={isMobile ? 16 : 32}
              className="w-full select-none overflow-visible"
            >
              {
                categoriesList.map((cat) => {
                  const isSelected = activeCategory === cat;
                  return (
                    <Chip
                      key={cat}
                      variant={isSelected ? "active" : "default"}
                      pressFeedback
                      onClick={() => scrollToCategory(cat)}
                      data-chip-key={cat}
                      className="!rounded-[8px] !border-0 !font-semibold"
                    >
                      <span>{getFolderDisplayName(cat)}</span>
                    </Chip>
                  );
                })
              }
            </ScrollableCanvas>
          </div>
        )}
      </div>

      {/* Scrollable Container */}
      <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden bg-transparent pt-0 md:pt-3">
        {/* Scrollable Explorer List */}
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto select-none pt-0 pb-8 min-h-0 text-[11px] flex flex-col gap-4 ${styles.sidebarScrollContainer}`}
        >
          <div className="flex flex-col gap-0 w-full">
            {categoriesList.map((cat) => {
              const ops = getFilteredOps(cat);
              if (ops.length === 0) return null;

              const isOpen = isMobile || q ? true : openFolders[cat] !== false;
              const isStuck = stuckCategories[cat];

              return (
                <div id={`sidebar-section-${cat}`} key={cat} className="flex flex-col relative w-full">
                  {/* Invisible 1px sentinel placed right before the sticky header */}
                  <div data-sentinel-for={cat} className="h-[1px] -mb-[1px] pointer-events-none opacity-0" />
                  <div
                    onClick={() => {
                      if (!isMobile) {
                        setOpenFolders(prev => ({ ...prev, [cat]: openFolders[cat] === false }));
                      }
                    }}
                    style={{ backgroundColor: effectiveBgColor }}
                    className={`sticky top-0 z-10 flex items-center justify-between w-full px-4 md:px-5 text-left text-text-muted transition-colors select-none py-2.5 md:py-2 border-b ${isStuck ? "border-white/10" : "border-transparent"
                      } before:content-[''] before:absolute before:-top-1.5 before:left-0 before:right-0 before:h-1.5 before:bg-inherit before:pointer-events-none ${isMobile ? "cursor-default" : "hover:text-white cursor-pointer"
                      }`}
                  >
                    <span className="font-bold md:font-semibold tracking-widest font-outfit text-[14px] uppercase text-[#f0f0f0]">
                      {getFolderDisplayName(cat)}
                    </span>
                    {!isMobile && (
                      <span className="text-zinc-400 group-hover:text-white w-5 h-5 flex items-center justify-center shrink-0 transition-colors">
                        <ChevronRight
                          sx={{ fontSize: { xs: 20, md: 18 }, stroke: "currentColor", strokeWidth: 1.2 }}
                          className={`transition-transform duration-200 ${isOpen ? "rotate-90" : "rotate-0"}`}
                        />
                      </span>
                    )}
                  </div>

                  {isOpen && (
                    <div className="px-4 md:px-5 mt-1 flex flex-col gap-1 md:gap-1">
                      {ops.map((op) => {
                        const qualifiedPath = getQualifiedPath(op);
                        const isCurrent = qualifiedPath === currentOpName;
                        return (
                          <div key={op.callExpression || op.name} className="flex flex-col">
                            <button
                              onClick={() => {
                                if (onSelectOp) {
                                  onSelectOp(op);
                                } else {
                                  const url = `/docs/${activeVersion}/${qualifiedPath}`;
                                  window.history.pushState ? window.history.pushState({}, "", url) : (window.location.pathname = url);
                                  window.dispatchEvent(new Event("popstate"));
                                }
                                setIsMenuOpen?.(false);
                              }}
                              className="group text-left flex items-center justify-between gap-3 hover:text-white transition-colors cursor-pointer py-2 md:py-0.5 text-white h-[56px] md:h-auto font-semibold"
                            >
                              <div className="flex flex-col justify-center min-w-0 flex-1 overflow-hidden">
                                <span className={`text-[16px] md:text-[12px] font-semibold leading-snug truncate ${isCurrent ? "text-white" : isMobile ? "text-white" : "text-zinc-400 group-hover:text-white"}`}>
                                  {op.callExpression || op.name || ""}
                                </span>
                                {isMobile && op.desc && (
                                  <span className="text-[12px] text-zinc-400 font-sans font-normal leading-tight mt-0.5 truncate">
                                    {op.desc}
                                  </span>
                                )}
                              </div>
                              <span className="w-5 h-5 flex items-center justify-center shrink-0">
                                <ChevronRight
                                    sx={{ fontSize: { xs: 20, md: 18 }, stroke: "currentColor", strokeWidth: 1.2 }}
                                  className={`transition-all shrink-0 ${isCurrent
                                    ? "text-white opacity-100"
                                    : isMobile
                                      ? "text-zinc-500 group-hover:text-zinc-300"
                                      : "text-zinc-400 group-hover:text-white opacity-0 group-hover:opacity-100"
                                    }`}
                                />
                              </span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Fade Gradient */}
        <div
          className="absolute bottom-0 left-0 right-[16px] h-10 pointer-events-none z-10"
          style={{
            background: `linear-gradient(to top, ${effectiveBgColor} 0%, ${effectiveBgColor}cc 60%, transparent 100%)`
          }}
        />
      </div>
    </div>
  );

  if (isDrawer) {
    return (
      <div className={`fixed inset-0 z-50 select-none transition-all duration-300 ${isMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        {/* Backdrop overlay */}
        <div
          onClick={() => setIsMenuOpen?.(false)}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
        />

        {/* Side Panel Drawer - Pinned scrollbar layout */}
        <div
          style={{ backgroundColor: effectiveBgColor }}
          className={`absolute top-0 left-0 bottom-0 w-full sm:w-[380px] border-r border-border-dark flex flex-col justify-between pt-0 pb-6 px-0 transform transition-transform duration-300 ease-out z-50 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between w-full p-4 border-b border-border-dark shrink-0 px-6 md:px-12">
            <button
              onClick={() => setIsMenuOpen?.(false)}
              className="flex items-center gap-2 text-[11px] font-outfit tracking-widest text-text-muted hover:text-white transition-colors cursor-pointer uppercase font-medium select-none text-left mr-2"
            >
              <Close style={{ fontSize: "14px" }} />
              <span>CLOSE</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xl font-medium tracking-wide text-white font-outfit lowercase leading-none">
                df-script
              </span>
              <span className="text-[10px] font-mono text-text-dim leading-none">{activeVersion}</span>
            </div>
          </div>

          {/* Drawer Explorer */}
          {content}
        </div>
      </div>
    );
  }

  return content;
}
