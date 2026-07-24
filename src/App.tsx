import React, { useState, useEffect } from "react";
import { MagneticParticles } from "./ui/elements";
import { Header, Sidebar, About, Support, Docs } from "./ui/sections";
import DFScriptNotebook from "./DFScriptNotebook";
import type { OperationItem, DocsVersion } from "./types";
import { ContentCopy } from "@mui/icons-material";

import { useVersionOptions } from "./hooks/useVersionOptions";
import { useDocs } from "./hooks/useDocs";

/**
 * A reusable hook to copy text to the clipboard and track a temporary "COPIED" state.
 */
function useCopyToClipboard(duration = 1500) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => { setCopiedId(null); }, duration);
  };

  const isCopied = (id: string) => copiedId === id;

  return { copy, isCopied };
}

export default function App() {
  const { copy, isCopied } = useCopyToClipboard();

  // API Explorer state
  const [activeVersion, setActiveVersion] = useState<DocsVersion>("v1.7.0");
  const versionOptions = useVersionOptions();
  const { operationsIndex } = useDocs(activeVersion);

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
    return (
      <main className="flex-grow overflow-y-auto h-full flex flex-col justify-between min-w-0">
        {/* Centered Hero Contents */}
        <div className="flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto flex-grow px-6 py-20">
          <h1 className="text-5xl font-semibold tracking-tight text-[#ffffff] font-outfit sm:text-6xl md:text-7xl lowercase">
            df-script
          </h1>
          <p className="text-sm md:text-base text-[#9c9c9c] max-w-lg leading-relaxed">
            A zero-dependency, high-performance, expression-based DataFrame engine designed for lighting-fast data processing in JavaScript and TypeScript.
          </p>

          {/* Quick Install Pill */}
          <div className="flex items-center justify-between gap-4 p-2 px-4 rounded bg-[#0a0a0a] border border-[#1e1e1e] font-mono text-[11px] text-[#e5e5e5] w-full max-w-sm mt-2">
            <div className="flex items-center gap-2">
              <span className="text-[#5c5c5c] select-none">$</span>
              <span>npm install df-script</span>
            </div>
            <button
              onClick={() => copy("npm install df-script", "install")}
              className="flex items-center hover:text-[#ffffff] text-[#9c9c9c] transition-colors cursor-pointer"
              title="Copy install command"
            >
              {isCopied("install") ? (
                <span className="text-emerald-400 text-[10px] font-sans font-medium">COPIED!</span>
              ) : (
                <ContentCopy style={{ fontSize: "12px" }} />
              )}
            </button>
          </div>

          {/* Enter Playground CTA */}
          <a
            href="#/playground"
            className="mt-6 px-6 py-2.5 text-[11px] font-medium tracking-widest text-[#ffffff] uppercase flat-border-btn"
          >
            ENTER PLAYGROUND →
          </a>
        </div>

        {/* Footer of Hero */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-[#5c5c5c] border-t border-[#1a1a1a] p-4 md:px-8 bg-[#060606] shrink-0 select-none">
          <span>ZERO DEPENDENCIES</span>
          <span>&lt; 85 KB BUNDLE WEIGHT</span>
          <span>HIGH-PERFORMANCE DATA PIPELINES</span>
        </div>
      </main>
    );
  };

  // Unified global page layout structure
  return (
    <div className="h-screen w-screen flex flex-col justify-between relative overflow-hidden select-none bg-[#060606] text-[#9c9c9c] font-sans antialiased">
      <MagneticParticles />

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
