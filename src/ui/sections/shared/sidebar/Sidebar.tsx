import React from "react";
import { KeyboardArrowDown, KeyboardArrowRight, Close } from "@mui/icons-material";
import type { OperationItem, DocsVersion } from "../../../../types";
import { $df } from "df-script";

import { getQualifiedPath } from "../../../../utils/routing";
import type { SidebarProps } from "./types";
import { SearchInput } from "@elements";
import { useLayout } from "../../../../hooks/useLayout";

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
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = React.useState(false);

  // Dynamic open folders state
  const [openFolders, setOpenFolders] = React.useState<Record<string, boolean>>({});

  const sidebarDropdownRef = React.useRef<HTMLDivElement>(null);

  // Auto-expand folder when currentOpName changes (e.g. from routing)
  React.useEffect(() => {
    if (currentOpName) {
      const op = operationsIndex.find((o) => o.name === currentOpName);
      if (op && op.category) {
        setOpenFolders((prev) => ({ ...prev, [op.category]: true }));
      }
    }
  }, [currentOpName, operationsIndex]);

  // Click outside and ESC handlers for version dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        sidebarDropdownRef.current &&
        !sidebarDropdownRef.current.contains(e.target as Node)
      ) {
        setIsVersionDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsVersionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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
  const df = operationsIndex.length > 0 ? $df.data(operationsIndex) : null;

  // Dynamically find categories present in the operations index
  const categoriesList: string[] = df
    ? (df.select("category").unique().sort({ by: "category" }).toArray("category") as string[])
    : [];

  const getFilteredOps = (category: string): OperationItem[] => {
    if (!df) return [];

    let filtered = df.filter($df.col("category").eq(category));

    if (q) {
      filtered = filtered.filter(
        $df.col("name").str.toLowerCase().str.contains(q)
      );
    }

    return filtered.sort({ by: "name" }).toDicts() as OperationItem[];
  };

  const getFolderDisplayName = (category: string) => {
    if (category === "DataFrame") return "DataFrame Operations";
    if (category === "ColumnExpression") return "Column Expressions";
    if (category === "DataType") return "Data Types";
    if (category === "Exception") return "Exceptions";
    return category; // fallback for any new/custom categories
  };

  const renderHighlightedName = (name: string) => {
    if (!q) return <span>{name}</span>;
    const index = name.toLowerCase().indexOf(q);
    if (index === -1) return <span>{name}</span>;
    const before = name.substring(0, index);
    const match = name.substring(index, index + q.length);
    const after = name.substring(index + q.length);
    return (
      <span>
        {before}
        <mark className="bg-emerald-500/25 text-emerald-400 font-bold px-0.5 rounded-sm">{match}</mark>
        {after}
      </span>
    );
  };

  const { isMobile } = useLayout();
  const effectiveBgColor = backgroundColor || (isMobile ? "#060606" : "#0c0c0c");

  const content = (
    <div
      className="flex-grow flex flex-col min-h-0 select-none h-full overflow-hidden"
      style={{ backgroundColor: effectiveBgColor }}
    >
      {/* Explorer Header with Interactive Version Selector (Sticky at the top) */}
      <div className="flex flex-col shrink-0 bg-transparent z-20">
        {showHeader && (
          <div className="flex items-center justify-between px-6 md:px-8 pt-2.5 pb-3">
            <span className="text-[9px] font-outfit text-text-dim uppercase tracking-widest select-none font-semibold">API EXPLORER</span>
            <div ref={sidebarDropdownRef} className="relative flex items-center select-none shrink-0">
              <button
                onClick={() => setIsVersionDropdownOpen(!isVersionDropdownOpen)}
                className="flex items-center gap-1 rounded-full bg-[#161616] px-2.5 py-1 text-[9px] font-outfit text-text-muted hover:text-white transition-colors cursor-pointer select-none font-semibold uppercase tracking-wider"
              >
                <span className="text-[8px] text-text-dim tracking-widest font-semibold mr-0.5">VERSION:</span>
                <span>{activeVersion}</span>
                <svg className="w-2.5 h-2.5 text-text-dim shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isVersionDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-24 bg-[#161616] border border-[#2e2e2e]/60 rounded-md shadow-xl z-40 py-1 flex flex-col font-outfit select-none overflow-hidden">
                  {versionOptions.map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        setActiveVersion(v);
                        setIsVersionDropdownOpen(false);
                      }}
                      className={`text-left px-3 py-1.5 text-[9px] tracking-wider uppercase transition-colors cursor-pointer select-none ${activeVersion === v
                        ? "bg-white/10 text-white font-semibold"
                        : "text-text-muted hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search/Filter Bar */}
        <div className="px-4 md:px-8 pb-0 pt-4 md:pt-1">
          <SearchInput
            value={explorerSearchQuery}
            onChange={setExplorerSearchQuery}
            placeholder="Type to Search"
            variant={isMobile ? "pill" : "underline"}
          />
        </div>
      </div>

      {/* Scrollable Container */}
      <div className="relative flex-grow min-h-0 flex flex-col overflow-hidden bg-transparent pt-3">
        {/* Scrollable Explorer List */}
        <div className="flex-grow overflow-y-auto select-none pt-0 pb-12 min-h-0 text-[11px] flex flex-col gap-4">
          <div className="flex flex-col gap-0 px-4 md:px-8">
            {categoriesList.map((cat) => {
              const ops = getFilteredOps(cat);
              if (ops.length === 0) return null;

              const isOpen = q ? true : openFolders[cat] !== false;

              return (
                <div key={cat} className="flex flex-col">
                  <button
                    onClick={() => setOpenFolders(prev => ({ ...prev, [cat]: openFolders[cat] === false }))}
                    style={{ backgroundColor: effectiveBgColor }}
                    className="sticky top-0 z-10 flex items-center gap-2.5 w-full text-left text-text-muted hover:text-white transition-colors cursor-pointer select-none py-2.5 md:py-2 before:content-[''] before:absolute before:-top-1.5 before:left-0 before:right-0 before:h-1.5 before:bg-inherit before:pointer-events-none"
                  >
                    <span className="text-text-dim w-3.5 h-3.5 flex items-center justify-center shrink-0">
                      {isOpen ? (
                        <KeyboardArrowDown className="!text-[16px] md:!text-[14px]" />
                      ) : (
                        <KeyboardArrowRight className="!text-[16px] md:!text-[14px]" />
                      )}
                    </span>
                    <span className="font-bold md:font-semibold tracking-widest font-outfit text-[13px] md:text-[11px] uppercase text-[#f0f0f0]">
                      {getFolderDisplayName(cat)}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pl-4 mt-2 border-l border-border-dark ml-1.5 flex flex-col gap-1 md:gap-2">
                      {ops.map((op) => {
                        const qualifiedPath = getQualifiedPath(op);
                        const isCurrent = qualifiedPath === currentOpName;
                        return (
                          <div key={op.name} className="flex flex-col">
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
                              className={`text-left hover:text-[#ffffff] transition-colors cursor-pointer text-[14px] md:text-[12px] py-1.5 md:py-0.5 ${isCurrent ? "text-white font-semibold" : "text-text-muted"}`}
                            >
                              <span>{renderHighlightedName(op.name)}</span>
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
