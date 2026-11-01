import React from "react";
import { GalaxyBackground, WaveBackground } from "../../elements";
import { useBackgroundTheme } from "../../../hooks/useBackgroundTheme";
import { About, Support, Docs, Home, Sidebar, LlmView } from "../shared";
import { MobileHeader } from "./components/MobileHeader";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { MobileBottomPanel } from "./components/MobileBottomPanel";
import type { MobileLayoutProps } from "./types";
import { ABOUT_PATH, SUPPORT_PATH, LLM_PATH } from "../constants";
import { SEARCH_PATH } from "./constants";
import { getQualifiedPath } from "../../../utils/routing";
import type { OperationItem } from "../../../types";
import "./mobile.module.css";

export function MobileLayout({
  path,
  activeVersion,
  setVersion,
  isDocs,
  activeOpName,
  versionOptions,
  operationsIndex,
  typesMap
}: MobileLayoutProps) {
  const { backgroundTheme } = useBackgroundTheme();
  const isSearchPage = path === SEARCH_PATH;
  const isLlmPage = path.startsWith(LLM_PATH);
  const isHomePage = !isDocs && path !== ABOUT_PATH && path !== SUPPORT_PATH && !isLlmPage && !isSearchPage;

  // Active doc operation for the YouTube Music style slide-up/condensed sheet
  const [activeDocOp, setActiveDocOp] = React.useState<OperationItem | undefined>(undefined);
  // Panel expansion progress from 0 (condensed at bottom) to 1 (full screen expanded)
  const [panelProgress, setPanelProgress] = React.useState<number>(0);

  // When routed directly to a /docs/... URL, auto-set activeDocOp
  React.useEffect(() => {
    if (isDocs && activeOpName) {
      const found = operationsIndex.find((o) => getQualifiedPath(o) === activeOpName);
      if (found) {
        setActiveDocOp(found);
      }
    }
  }, [isDocs, activeOpName, operationsIndex]);

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden bg-[#060606] text-text-muted font-sans antialiased">
      {/* Background layer */}
      {isHomePage && (backgroundTheme === "galaxy" ? <GalaxyBackground /> : <WaveBackground />)}

      {/* Mobile Top Header */}
      {!isSearchPage && (
        <MobileHeader
          activeVersion={activeVersion}
        />
      )}

      {/* Main View Area */}
      <div
        className={`flex-1 min-h-0 w-full relative z-10 ${
          isHomePage ? "bg-transparent" : "bg-[#060606]"
        } ${isHomePage || isSearchPage ? "h-full overflow-hidden flex flex-col" : "overflow-y-auto"
        }`}>
        {(() => {
          if (isSearchPage) {
            return (
              <main className="w-full h-full flex flex-col bg-[#060606]">
                <Sidebar
                  activeVersion={activeVersion}
                  setActiveVersion={setVersion}
                  currentOpName={activeDocOp ? getQualifiedPath(activeDocOp) : activeOpName}
                  operationsIndex={operationsIndex}
                  isDrawer={false}
                  versionOptions={versionOptions}
                  backgroundColor="#060606"
                  showHeader={false}
                  onSelectOp={(op) => setActiveDocOp(op)}
                />
              </main>
            );
          }

          if (isLlmPage) {
            return <LlmView path={path} />;
          }

          switch (path) {
            case ABOUT_PATH:
              return <About hasActiveDocOp={Boolean(activeDocOp)} />;
            case SUPPORT_PATH:
              return <Support />;
            default:
              if (isDocs) {
                // If not using sheet overlay, render Docs in-place as fallback
                const op = activeDocOp || operationsIndex.find((o) => getQualifiedPath(o) === activeOpName);
                return <Docs op={op} activeVersion={activeVersion} typesMap={typesMap} />;
              }
              return <Home />;
          }
        })()}
      </div>

      {/* Content-agnostic YouTube Music style sliding bottom panel powered by DraggableSection */}
      <MobileBottomPanel
        isOpen={Boolean(activeDocOp)}
        selectedItemKey={activeDocOp ? getQualifiedPath(activeDocOp) : undefined}
        onClose={() => {
          setActiveDocOp(undefined);
          setPanelProgress(0);
        }}
        onProgress={setPanelProgress}
        collapsedSummary={
          activeDocOp ? (
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded bg-[#141414] border border-white/10 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-mono font-bold text-indigo-400">fn</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-semibold text-white truncate font-sans">
                  .{activeDocOp.name}()
                </span>
                <span className="text-[10px] font-outfit uppercase tracking-wider text-text-dim truncate">
                  {activeDocOp.category || "Operation"}
                </span>
              </div>
            </div>
          ) : null
        }
      >
        <Docs op={activeDocOp} activeVersion={activeVersion} typesMap={typesMap} />
      </MobileBottomPanel>

      {/* Bottom Bar Navigation: translates out of screen opposite the expansion percentage */}
      <MobileBottomNav
        currentPath={path}
        style={{
          transform: `translateY(${activeDocOp ? panelProgress * 100 : 0}%)`,
          pointerEvents: panelProgress >= 0.9 ? "none" : "auto",
        }}
      />
    </div>
  );
}
