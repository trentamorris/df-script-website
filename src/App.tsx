import React, { useState, useEffect } from "react";
import { Header, Sidebar, About, Support, Docs, Home } from "./ui/sections";
import DFScriptNotebook from "./DFScriptNotebook";
import type { OperationItem, DocsVersion } from "./types";

import { useGithubVersions, useGithubDocs } from "./hooks/useGithubHooks";

import { getQualifiedPath } from "./utils/routing";

export default function App() {

  // API Explorer state
  const [activeVersion, setActiveVersion] = useState<DocsVersion>("v1.7.0");
  const versionOptions = useGithubVersions();
  const { operationsIndex } = useGithubDocs(activeVersion);

  // Routing state
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);

    // Global click listener to intercept clean path navigations
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (target && target.href && target.host === window.location.host) {
        if (!target.target && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
          e.preventDefault();
          const url = new URL(target.href);
          window.history.pushState({}, "", url.pathname + url.search);
          setPath(url.pathname);
        }
      }
    };
    document.addEventListener("click", handleLinkClick);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      document.removeEventListener("click", handleLinkClick);
    };
  }, []);

  // UI state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Routing checks
  const isPlayground = path === "/playground" || path === "/notebook";
  const isAbout = path === "/about";
  const isSupport = path === "/support";

  // Check if pathname matches /docs/version/function (e.g. /docs/v1.7.0/df-script.ColumnExpression.dt.weekday)
  const docsMatch = path.match(/^\/docs\/([^\/]+)\/(.+)$/);
  const isDocs = !!docsMatch;

  let activeOpName = "";
  if (isDocs && docsMatch) {
    activeOpName = decodeURIComponent(docsMatch[2]);
  }

  // Automatically sync activeVersion state if URL version changes
  useEffect(() => {
    if (docsMatch) {
      const urlVersion = docsMatch[1];
      if (urlVersion !== activeVersion) {
        setActiveVersion(urlVersion);
      }
    }
  }, [path, activeVersion, docsMatch]);

  // Render main content area dynamically based on route
  const renderMainContent = () => {
    if (isAbout) return <About />;
    if (isSupport) return <Support />;
    if (isPlayground) return <DFScriptNotebook />;

    if (isDocs) {
      const op = operationsIndex.find(o => getQualifiedPath(o) === activeOpName);
      return <Docs op={op} activeVersion={activeVersion} />;
    }

    // Default Home view content
    return <Home />;
  };

  // Unified global page layout structure
  return (
    <div className="h-screen w-screen flex flex-col justify-between relative overflow-hidden select-none bg-[#060606] text-[#9c9c9c] font-sans antialiased">

      <Header
        path={path}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        setIsMenuOpen={() => {}}
        activeVersion={activeVersion}
        setActiveVersion={setActiveVersion}
        versionOptions={versionOptions}
      />

      {/* Main viewport area */}
      <div className="h-viewport-content w-full flex overflow-hidden shrink-0 relative z-10">
        {/* Left Sidebar */}
        <aside className={`border-[#1a1a1a] bg-[#0c0c0c]/85 backdrop-blur-sm pt-0 pb-6 px-0 flex flex-col h-full overflow-hidden shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-0 border-r-0 opacity-0" : "w-80 border-r opacity-100"}`}>
          <Sidebar
            activeVersion={activeVersion}
            setActiveVersion={setActiveVersion}
            currentOpName={activeOpName}
            operationsIndex={operationsIndex}
            versionOptions={versionOptions}
          />
        </aside>

        {renderMainContent()}
      </div>
    </div>
  );
}
