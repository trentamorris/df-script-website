import React from "react";
import { GalaxyBackground } from "../../elements";
import { About, Support, Docs, Home, Sidebar } from "../shared";
import { MobileHeader } from "./components/MobileHeader";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { MobileBottomPanel } from "./components/MobileBottomPanel";
import type { MobileLayoutProps } from "./types";
import { ABOUT_PATH, SUPPORT_PATH } from "../desktop/constants";
import { SEARCH_PATH } from "./constants";
import { getQualifiedPath } from "../../../utils/routing";
import type { OperationItem } from "../../../types";

export function MobileLayout({
  path,
  activeVersion,
  setVersion,
  isDocs,
  activeOpName,
  versionOptions,
  operationsIndex
}: MobileLayoutProps) {
  const isSearchPage = path === SEARCH_PATH;
  const isHomePage = !isDocs && path !== ABOUT_PATH && path !== SUPPORT_PATH && !isSearchPage;

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

  // Intercept laptop trackpad pinch-to-zoom (which Chrome maps to wheel events with ctrlKey)
  // and mobile touch gestures on the landing view
  React.useEffect(() => {
    // Intercept laptop trackpad pinch-to-zoom (ctrlKey + wheel) and mobile multi-touch pinch gestures everywhere on mobile
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("gesturestart", handleGesture);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("gesturestart", handleGesture);
    };
  }, []);

  return (
    <div className="h-[100dvh] w-screen flex flex-col relative overflow-hidden select-none bg-bg-pitch text-text-muted font-sans antialiased touch-pan-y overscroll-none">
      {isHomePage && <GalaxyBackground />}

      {/* Top Mobile Header (hidden on Home landing screen and dedicated Search screen) */}
      {!isHomePage && !isSearchPage && <MobileHeader activeVersion={activeVersion} />}

      {/* Main Content Area: padded 56px (pb-14) at bottom so fixed bottom nav never overlaps content */}
      <div className={`flex-1 min-h-0 w-full relative z-10 box-border pb-14 ${
        isHomePage || isSearchPage ? "h-full overflow-hidden flex flex-col" : "overflow-y-auto"
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

          switch (path) {
            case ABOUT_PATH:
              return <About />;
            case SUPPORT_PATH:
              return <Support />;
            default:
              if (isDocs) {
                // If not using sheet overlay, render Docs in-place as fallback
                const op = activeDocOp || operationsIndex.find((o) => getQualifiedPath(o) === activeOpName);
                return <Docs op={op} activeVersion={activeVersion} />;
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
        <Docs op={activeDocOp} activeVersion={activeVersion} />
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
