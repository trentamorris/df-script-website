import React from "react";
import { Menu, Favorite } from "@mui/icons-material";
import { GITHUB_REPO_URL, NPM_PACKAGE_URL } from "../../../../../constants";
import { NOTEBOOK_PATH, ABOUT_PATH, SUPPORT_PATH, LLM_PATH } from "../../../constants";
import { useBackgroundTheme } from "../../../../../hooks/useBackgroundTheme";
import type { HeaderProps } from "./types";

export function Header({
  path,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  setIsMenuOpen,
  activeVersion,
  setActiveVersion,
  versionOptions = []
}: HeaderProps) {
  const { backgroundTheme } = useBackgroundTheme();
  const isNotebookPage = path === NOTEBOOK_PATH;
  const isLlmPage = path.startsWith(LLM_PATH);
  const isHomePage = path === "/" || (!path.startsWith("/docs") && path !== ABOUT_PATH && path !== SUPPORT_PATH && path !== NOTEBOOK_PATH && !isLlmPage);

  return (
    <header className={`flex items-center justify-between w-full h-[var(--header-height,56px)] border-0 z-20 shrink-0 sticky top-0 px-6 md:px-8 select-none transition-all duration-300 ease-in-out ${isNotebookPage
      ? "bg-[#030303] backdrop-blur-none"
      : isHomePage
        ? "bg-transparent hover:bg-[#060606]/90 backdrop-blur-none hover:backdrop-blur-md"
        : "bg-[#060606]/90 backdrop-blur-md"
      }`}>
      {/* Left Side: Menu Trigger & App Links */}
      <div className={`flex items-center gap-6 font-outfit text-[11px] tracking-widest transition-colors select-none ${isHomePage && backgroundTheme === "wave" ? "text-slate-200/90" : "text-text-muted"
        }`}>
        <button
          onClick={() => {
            setIsSidebarCollapsed(!isSidebarCollapsed);
          }}
          className={`flex items-center gap-2 text-[11px] font-outfit tracking-widest ${!isSidebarCollapsed ? "text-white font-medium" : "hover:text-white"} transition-colors cursor-pointer uppercase select-none text-left mr-2`}
        >
          <Menu style={{ fontSize: "14px" }} />
          <span>MENU</span>
        </button>
        <a
          href={ABOUT_PATH}
          className={`${path === ABOUT_PATH ? "text-white font-medium" : "hover:text-white"} transition-colors uppercase`}
        >
          ABOUT
        </a>
        <a
          href={NOTEBOOK_PATH}
          className={`${path === NOTEBOOK_PATH ? "text-white font-medium" : "hover:text-white"} transition-colors uppercase`}
        >
          NOTEBOOK
        </a>
        <a
          href={LLM_PATH}
          className={`${isLlmPage ? "text-white font-medium" : "hover:text-white"} transition-colors uppercase`}
        >
          LLM
        </a>
      </div>

      {/* Center: centered df-script wordmark */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
        {isNotebookPage ? (
          <a
            href="/"
            onClick={() => {
              setIsMenuOpen(false);
            }}
            className="text-base font-medium tracking-wide font-outfit select-none lowercase hover:opacity-85 transition-opacity"
            title="@df-script/notebook"
          >
            <span className="text-white/40">@df-script/</span>
            <span className="text-white">notebook</span>
          </a>
        ) : (
          <>
            <a
              href="/"
              onClick={() => {
                setIsMenuOpen(false);
              }}
              className="text-xl font-medium tracking-wide text-white font-outfit select-none lowercase hover:opacity-85 transition-opacity"
            >
              df-script
            </a>
            <span className="text-[10px] font-mono text-text-dim select-none leading-none pt-0.5">
              {activeVersion}
            </span>
          </>
        )}
      </div>

      {/* Right Side: Support & Resource Links */}
      <nav className={`flex items-center gap-6 font-outfit text-[11px] tracking-widest transition-colors select-none ${isHomePage && backgroundTheme === "wave" ? "text-slate-200/90" : "text-text-muted"
        }`}>
        <a
          href={SUPPORT_PATH}
          className={`transition-colors uppercase flex items-center gap-1.5 ${
            path === SUPPORT_PATH
              ? "text-[#fb7185] font-semibold"
              : "text-text-muted hover:text-[#fb7185]"
          }`}
        >
          <Favorite style={{ fontSize: "14px" }} />
          <span>SPONSOR</span>
        </a>
        <a
          href={isNotebookPage ? "https://www.npmjs.com/package/@df-script/notebook" : NPM_PACKAGE_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors uppercase"
        >
          NPM
        </a>
        <a
          href={GITHUB_REPO_URL}
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
