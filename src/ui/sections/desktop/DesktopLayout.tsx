import React from "react";
import { Header } from "./components/header/Header";
import { About, Support, Docs, Home, Sidebar } from "../shared";
import { DFScriptNotebook } from "../../../df-script-notebook";
import { getQualifiedPath } from "../../../utils/routing";
import { GalaxyBackground } from "../../elements";
import type { DesktopLayoutProps } from "./types";
import { NOTEBOOK_PATH, ABOUT_PATH, SUPPORT_PATH } from "./constants";

export function DesktopLayout({
  path,
  activeVersion,
  setVersion,
  isDocs,
  activeOpName,
  versionOptions,
  operationsIndex
}: DesktopLayoutProps) {
  // Only expand sidebar by default when actively viewing documentation
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(!isDocs);
  const isHomePage = !isDocs && path !== ABOUT_PATH && path !== SUPPORT_PATH && path !== NOTEBOOK_PATH;

  return (
    <div className="h-screen w-screen flex flex-col relative overflow-hidden select-none bg-bg-pitch text-text-muted font-sans antialiased">
      {isHomePage && <GalaxyBackground />}
      <Header
        path={path}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        setIsMenuOpen={() => { }}
        activeVersion={activeVersion}
        setActiveVersion={setVersion}
        versionOptions={versionOptions}
      />

      <div className="flex-grow min-h-0 w-full flex overflow-hidden relative z-10">
        <aside className={`border-border-dark bg-bg-darker/85 backdrop-blur-sm p-0 flex flex-col h-full overflow-hidden shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-0 opacity-0" : "w-80 opacity-100"}`}>
          <Sidebar
            activeVersion={activeVersion}
            setActiveVersion={setVersion}
            currentOpName={activeOpName}
            operationsIndex={operationsIndex}
            versionOptions={versionOptions}
            backgroundColor="#0c0c0c"
          />
        </aside>

        {(() => {
          switch (path) {
            case ABOUT_PATH:
              return <About />;
            case SUPPORT_PATH:
              return <Support />;
            case NOTEBOOK_PATH:
              return <DFScriptNotebook />;
            default:
              if (isDocs) {
                const op = operationsIndex.find(o => getQualifiedPath(o) === activeOpName);
                return <Docs op={op} activeVersion={activeVersion} />;
              }
              return <Home />;
          }
        })()}
      </div>
    </div>
  );
}
