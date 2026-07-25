import React, { useState, useEffect } from "react";
import { Header, Sidebar, About, Support, Docs, Home } from "./ui/sections";
import DFScriptNotebook from "./DFScriptNotebook";
import type { OperationItem, DocsVersion } from "./types";

import { useGithubVersions, useGithubDocs } from "./hooks/useGithubHooks";

export default function App() {

  // API Explorer state
  const [activeVersion, setActiveVersion] = useState<DocsVersion>("v1.7.0");
  const versionOptions = useGithubVersions();
  const { operationsIndex } = useGithubDocs(activeVersion);

  // Routing state
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handleHashChange = () => { setHash(window.location.hash); };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // UI state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  // Routing checks
  const isPlayground = hash === "#/playground" || hash === "#playground" || hash === "#/notebook" || hash === "#notebook";
  const isAbout = hash === "#/about" || hash === "#about";
  const isSupport = hash === "#/support" || hash === "#support";
  const isDocs = hash.startsWith("#/docs/") || hash.startsWith("#docs/");

  let activeOpName = "";
  if (isDocs) {
    const rawOp = hash.startsWith("#/docs/")
      ? hash.substring(7)
      : hash.substring(6);
    activeOpName = decodeURIComponent(rawOp);
  }

  // Render main content area dynamically based on route
  const renderMainContent = () => {
    if (isAbout) return <About />;
    if (isSupport) return <Support />;
    if (isPlayground) return <DFScriptNotebook />;

    if (isDocs) {
      const op = operationsIndex.find(o => o.name === activeOpName);
      return <Docs op={op} activeVersion={activeVersion} />;
    }

    // Default Home view content
    return <Home />;
  };

  // Unified global page layout structure
  return (
    <div className="h-screen w-screen flex flex-col justify-between relative overflow-hidden select-none bg-[#060606] text-[#9c9c9c] font-sans antialiased">

      <Header
        hash={hash}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        setIsMenuOpen={setIsMenuOpen}
        activeVersion={activeVersion}
        setActiveVersion={setActiveVersion}
        versionOptions={versionOptions}
      />
      <Sidebar
        isDrawer={true}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        activeVersion={activeVersion}
        setActiveVersion={setActiveVersion}
        currentOpName={activeOpName}
        operationsIndex={operationsIndex}
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
            setIsMenuOpen={setIsMenuOpen}
            versionOptions={versionOptions}
          />
        </aside>

        {renderMainContent()}
      </div>
    </div>
  );
}
