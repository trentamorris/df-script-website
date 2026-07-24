import React, { useState, useEffect, useRef } from "react";
import { KeyboardArrowDown, KeyboardArrowRight, Close } from "@mui/icons-material";
import type { OperationItem, DocsVersion } from "../../../types";

export interface SidebarProps {
  activeVersion: DocsVersion;
  setActiveVersion: (val: DocsVersion) => void;
  currentOpName?: string;
  operationsIndex: OperationItem[];
  setIsMenuOpen?: (val: boolean) => void;
  isDrawer?: boolean;
  isMenuOpen?: boolean;
  versionOptions?: DocsVersion[];
}

export function Sidebar({
  activeVersion,
  setActiveVersion,
  currentOpName,
  operationsIndex,
  setIsMenuOpen,
  isDrawer = false,
  isMenuOpen = false,
  versionOptions = ["v1.7.0", "v1.6.0", "v1.5.0"]
}: SidebarProps) {
  const [explorerSearchQuery, setExplorerSearchQuery] = useState("");
  const [isVersionDropdownOpen, setIsVersionDropdownOpen] = useState(false);

  // Collapsing states
  const [isDfFolderOpen, setIsDfFolderOpen] = useState(false);
  const [isExprFolderOpen, setIsExprFolderOpen] = useState(false);
  const [isTypeFolderOpen, setIsTypeFolderOpen] = useState(false);
  const [isExceptionFolderOpen, setIsExceptionFolderOpen] = useState(false);

  const sidebarDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-expand folder when currentOpName changes (e.g. from routing)
  useEffect(() => {
    if (currentOpName) {
      const op = operationsIndex.find((o) => o.name === currentOpName);
      if (op) {
        if (op.category === "DataFrame") {
          setIsDfFolderOpen(true);
        } else if (op.category === "ColumnExpression") {
          setIsExprFolderOpen(true);
        } else if (op.category === "DataType") {
          setIsTypeFolderOpen(true);
        } else if (op.category === "Exception") {
          setIsExceptionFolderOpen(true);
        }
      }
    }
  }, [currentOpName, operationsIndex]);

  // Click outside and ESC handlers for version dropdown
  useEffect(() => {
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
  useEffect(() => {
    if (!isDrawer || !isMenuOpen || !setIsMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawer, isMenuOpen, setIsMenuOpen]);

  const filterByVersion = (opVersion: string) => {
    if (activeVersion === "v1.5.0") return opVersion === "v1.5.0";
    if (activeVersion === "v1.6.0") return opVersion === "v1.5.0" || opVersion === "v1.6.0";
    return true; // v1.7.0
  };

  const q = explorerSearchQuery.trim().toLowerCase();

  const dfOps = operationsIndex
    .filter((op) => op.category === "DataFrame" && filterByVersion(op.version))
    .filter((op) => !q || op.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  const exprOps = operationsIndex
    .filter((op) => op.category === "ColumnExpression" && filterByVersion(op.version))
    .filter((op) => !q || op.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  const dataTypeOps = operationsIndex
    .filter((op) => op.category === "DataType" && filterByVersion(op.version))
    .filter((op) => !q || op.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  const exceptionOps = operationsIndex
    .filter((op) => op.category === "Exception" && filterByVersion(op.version))
    .filter((op) => !q || op.name.toLowerCase().includes(q))
    .sort((a, b) => a.name.localeCompare(b.name));

  const isDfOpen = q ? dfOps.length > 0 : isDfFolderOpen;
  const isExprOpen = q ? exprOps.length > 0 : isExprFolderOpen;
  const isTypeOpen = q ? dataTypeOps.length > 0 : isTypeFolderOpen;
  const isExceptionOpen = q ? exceptionOps.length > 0 : isExceptionFolderOpen;

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

  const content = (
    <div className="flex-grow flex flex-col min-h-0 select-none bg-[#0c0c0c] h-full overflow-hidden">
      {/* Explorer Header with Interactive Version Selector (Sticky at the top) */}
      <div className="flex flex-col shrink-0 border-b border-border-dark/30 bg-[#0c0c0c] z-20">
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

        {/* Search/Filter Bar */}
        <div className="px-6 md:px-8 pb-2 pt-1 relative">
          <div className="relative flex items-center">
            <span className="absolute left-4 text-white pointer-events-none z-10">
              <svg className="w-5 h-5 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.0}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={explorerSearchQuery}
              onChange={(e) => setExplorerSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-[#161616] border border-[#2c2c2c]/40 rounded-full px-4 py-2.5 pl-12 pr-10 text-[15px] font-sans font-semibold text-white placeholder-text-muted focus:outline-none transition-all"
            />
            {explorerSearchQuery && (
              <button
                onClick={() => setExplorerSearchQuery("")}
                className="absolute right-4 text-white text-[13px] font-sans hover:opacity-80 cursor-pointer select-none z-10"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Container with Fade-Out Gradients */}
      <div className="relative flex-grow min-h-0 flex flex-col overflow-hidden bg-[#0c0c0c]">
        {/* Top Fade Gradient */}
        <div className="absolute top-0 left-0 right-[16px] h-10 bg-gradient-to-b from-bg-darker via-[#0c0c0c]/80 to-transparent pointer-events-none z-10" />

        {/* Scrollable Explorer List */}
        <div className="flex-grow overflow-y-auto select-none pt-2 pb-12 min-h-0 text-[11px] font-mono flex flex-col gap-4">
          <div className="flex flex-col gap-0 px-6 md:px-8">
            {/* Folder: DataFrame Operations */}
            {dfOps.length > 0 && (
              <div className="flex flex-col">
                <button
                  onClick={() => setIsDfFolderOpen(!isDfFolderOpen)}
                  className="sticky top-0 bg-[#0c0c0c] z-10 flex items-center gap-2.5 w-full text-left text-text-muted hover:text-white transition-colors cursor-pointer select-none py-2 border-b border-[#1a1a1a]/30"
                >
                  <span className="text-text-dim w-3 h-3 flex items-center justify-center shrink-0">
                    {isDfOpen ? (
                      <KeyboardArrowDown style={{ fontSize: "14px" }} />
                    ) : (
                      <KeyboardArrowRight style={{ fontSize: "14px" }} />
                    )}
                  </span>
                  <span className="font-semibold tracking-widest font-outfit text-[11px] uppercase text-[#e5e5e5]">DataFrame Operations</span>
                </button>

                {isDfOpen && (
                  <div className="pl-4 mt-2 border-l border-border-dark ml-1.5 flex flex-col gap-2">
                    {dfOps.map((op) => {
                      const isCurrent = op.name === currentOpName;
                      return (
                        <div key={op.name} className="flex flex-col">
                          <button
                            onClick={() => {
                              window.location.hash = "#/docs/" + encodeURIComponent(op.name);
                              setIsMenuOpen?.(false);
                            }}
                            className={`text-left hover:text-[#ffffff] transition-colors cursor-pointer font-mono text-[11px] py-0.5 ${isCurrent ? "text-white font-semibold" : "text-text-muted"}`}
                          >
                            <span>{renderHighlightedName(op.name)}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Folder: ColumnExpressions */}
            {exprOps.length > 0 && (
              <div className="flex flex-col">
                <button
                  onClick={() => setIsExprFolderOpen(!isExprFolderOpen)}
                  className="sticky top-0 bg-[#0c0c0c] z-10 flex items-center gap-2.5 w-full text-left text-text-muted hover:text-white transition-colors cursor-pointer select-none py-2 border-b border-[#1a1a1a]/30"
                >
                  <span className="text-text-dim w-3 h-3 flex items-center justify-center shrink-0">
                    {isExprOpen ? (
                      <KeyboardArrowDown style={{ fontSize: "14px" }} />
                    ) : (
                      <KeyboardArrowRight style={{ fontSize: "14px" }} />
                    )}
                  </span>
                  <span className="font-semibold tracking-widest font-outfit text-[11px] uppercase text-[#e5e5e5]">Column Expressions</span>
                </button>

                {isExprOpen && (
                  <div className="pl-4 mt-2 border-l border-border-dark ml-1.5 flex flex-col gap-2">
                    {exprOps.map((op) => {
                      const isCurrent = op.name === currentOpName;
                      return (
                        <div key={op.name} className="flex flex-col">
                          <button
                            onClick={() => {
                              window.location.hash = "#/docs/" + encodeURIComponent(op.name);
                              setIsMenuOpen?.(false);
                            }}
                            className={`text-left hover:text-[#ffffff] transition-colors cursor-pointer font-mono text-[11px] py-0.5 ${isCurrent ? "text-white font-semibold" : "text-text-muted"}`}
                          >
                            <span>{renderHighlightedName(op.name)}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Folder: DataTypes */}
            {dataTypeOps.length > 0 && (
              <div className="flex flex-col">
                <button
                  onClick={() => setIsTypeFolderOpen(!isTypeFolderOpen)}
                  className="sticky top-0 bg-[#0c0c0c] z-10 flex items-center gap-2.5 w-full text-left text-text-muted hover:text-white transition-colors cursor-pointer select-none py-2 border-b border-[#1a1a1a]/30"
                >
                  <span className="text-text-dim w-3 h-3 flex items-center justify-center shrink-0">
                    {isTypeOpen ? (
                      <KeyboardArrowDown style={{ fontSize: "14px" }} />
                    ) : (
                      <KeyboardArrowRight style={{ fontSize: "14px" }} />
                    )}
                  </span>
                  <span className="font-semibold tracking-widest font-outfit text-[11px] uppercase text-[#e5e5e5]">Data Types</span>
                </button>

                {isTypeOpen && (
                  <div className="pl-4 mt-2 border-l border-border-dark ml-1.5 flex flex-col gap-2">
                    {dataTypeOps.map((op) => {
                      const isCurrent = op.name === currentOpName;
                      return (
                        <div key={op.name} className="flex flex-col">
                          <button
                            onClick={() => {
                              window.location.hash = "#/docs/" + encodeURIComponent(op.name);
                              setIsMenuOpen?.(false);
                            }}
                            className={`text-left hover:text-[#ffffff] transition-colors cursor-pointer font-mono text-[11px] py-0.5 ${isCurrent ? "text-white font-semibold" : "text-text-muted"}`}
                          >
                            <span>{renderHighlightedName(op.name)}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Folder: Exceptions */}
            {exceptionOps.length > 0 && (
              <div className="flex flex-col">
                <button
                  onClick={() => setIsExceptionFolderOpen(!isExceptionFolderOpen)}
                  className="sticky top-0 bg-[#0c0c0c] z-10 flex items-center gap-2.5 w-full text-left text-text-muted hover:text-white transition-colors cursor-pointer select-none py-2 border-b border-[#1a1a1a]/30"
                >
                  <span className="text-text-dim w-3 h-3 flex items-center justify-center shrink-0">
                    {isExceptionOpen ? (
                      <KeyboardArrowDown style={{ fontSize: "14px" }} />
                    ) : (
                      <KeyboardArrowRight style={{ fontSize: "14px" }} />
                    )}
                  </span>
                  <span className="font-semibold tracking-widest font-outfit text-[11px] uppercase text-[#e5e5e5]">Exceptions</span>
                </button>

                {isExceptionOpen && (
                  <div className="pl-4 mt-2 border-l border-border-dark ml-1.5 flex flex-col gap-2">
                    {exceptionOps.map((op) => {
                      const isCurrent = op.name === currentOpName;
                      return (
                        <div key={op.name} className="flex flex-col">
                          <button
                            onClick={() => {
                              window.location.hash = "#/docs/" + encodeURIComponent(op.name);
                              setIsMenuOpen?.(false);
                            }}
                            className={`text-left hover:text-[#ffffff] transition-colors cursor-pointer font-mono text-[11px] py-0.5 ${isCurrent ? "text-white font-semibold" : "text-text-muted"}`}
                          >
                            <span>{renderHighlightedName(op.name)}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Fade Gradient */}
        <div className="absolute bottom-0 left-0 right-[16px] h-10 bg-gradient-to-t from-bg-darker via-[#0c0c0c]/80 to-transparent pointer-events-none z-10" />
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
          className={`absolute top-0 left-0 bottom-0 w-full sm:w-[380px] bg-[#0c0c0c] border-r border-border-dark flex flex-col justify-between pt-0 pb-6 px-0 transform transition-transform duration-300 ease-out z-50 ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
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
