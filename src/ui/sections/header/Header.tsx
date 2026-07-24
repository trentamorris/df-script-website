import React, { useState, useEffect, useRef } from "react";
import { Menu, Favorite } from "@mui/icons-material";
import type { DocsVersion } from "../../../types";

export interface HeaderProps {
  hash: string;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (val: boolean) => void;
  setIsMenuOpen: (val: boolean) => void;
  activeVersion: DocsVersion;
  setActiveVersion: (val: DocsVersion) => void;
  versionOptions?: DocsVersion[];
}

export function Header({
  hash,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  setIsMenuOpen,
  activeVersion,
  setActiveVersion,
  versionOptions = ["v1.7.0"]
}: HeaderProps) {
  const [isHeaderVersionDropdownOpen, setIsHeaderVersionDropdownOpen] = useState(false);
  const headerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        headerDropdownRef.current &&
        !headerDropdownRef.current.contains(e.target as Node)
      ) {
        setIsHeaderVersionDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsHeaderVersionDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <header className="flex items-center justify-between w-full p-4 border-b border-border-dark z-20 shrink-0 bg-[#060606]/85 backdrop-blur-md sticky top-0 px-6 md:px-12 select-none">
      {/* Left Side: Menu Trigger & App Links */}
      <div className="flex items-center gap-6 font-outfit text-[11px] tracking-widest text-text-muted select-none">
        <button
          onClick={() => {
            setIsSidebarCollapsed(!isSidebarCollapsed);
            if (window.innerWidth < 1024) {
              setIsMenuOpen(true);
            }
          }}
          className="flex items-center gap-2 text-[11px] font-outfit tracking-widest text-text-muted hover:text-white transition-colors cursor-pointer uppercase font-medium select-none text-left mr-2"
        >
          <Menu style={{ fontSize: "14px" }} />
          <span>MENU</span>
        </button>
        <a
          href="#/about"
          className={`${hash === "#/about" ? "text-white font-medium" : "hover:text-white"} transition-colors uppercase`}
        >
          ABOUT
        </a>
        <a
          href="#/notebook"
          className={`${hash === "#/notebook" || hash === "#/playground" ? "text-white font-medium" : "hover:text-white"} transition-colors uppercase`}
        >
          NOTEBOOK WORKSPACE
        </a>
      </div>

      {/* Center: centered df-script wordmark */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
        <a
          href="#/"
          onClick={() => {
            setIsMenuOpen(false);
          }}
          className="text-xl font-medium tracking-wide text-white font-outfit select-none lowercase hover:opacity-85 transition-opacity"
        >
          df-script
        </a>
        <div ref={headerDropdownRef} className="relative flex items-center select-none pt-0.5">
          <button
            onClick={() => setIsHeaderVersionDropdownOpen(!isHeaderVersionDropdownOpen)}
            className="text-[10px] font-mono text-text-dim hover:text-white transition-colors cursor-pointer select-none flex items-center gap-1 leading-none"
          >
            <span>{activeVersion}</span>
            <svg className="w-2.5 h-2.5 text-text-dim shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isHeaderVersionDropdownOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-24 bg-[#161616] border border-[#2e2e2e]/60 rounded-md shadow-xl z-50 py-1 flex flex-col font-outfit select-none overflow-hidden">
              {versionOptions.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setActiveVersion(v);
                    setIsHeaderVersionDropdownOpen(false);
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

      {/* Right Side: Support & Resource Links */}
      <nav className="flex items-center gap-6 font-outfit text-[11px] tracking-widest text-text-muted select-none">
        <a
          href="#/support"
          className={`${hash === "#/support" ? "text-white font-medium" : "hover:text-white"} transition-colors uppercase flex items-center gap-1.5 text-[#fb7185]/90 hover:text-[#fb7185]`}
        >
          <Favorite style={{ fontSize: "14px" }} />
          <span>SPONSOR</span>
        </a>
        <a
          href="https://www.npmjs.com/package/df-script"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors uppercase"
        >
          NPM
        </a>
        <a
          href="https://github.com/trentamorris/df-script"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors uppercase"
        >
          GITHUB
        </a>
      </nav>
    </header>
  );
}
