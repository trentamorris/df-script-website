import React from "react";
import { Header } from "./components/header/Header";
import { Sidebar } from "./components/sidebar/Sidebar";
import { About } from "./components/about/About";
import { Support } from "./components/support/Support";
import { Docs } from "./components/docs/Docs";
import { Home } from "./components/home/Home";
import DFScriptNotebook from "../../../DFScriptNotebook";
import { getQualifiedPath } from "../../../utils/routing";
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  return (
    <div className="h-screen w-screen flex flex-col justify-between relative overflow-hidden select-none bg-bg-pitch text-text-muted font-sans antialiased">
      <Header
        path={path}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        setIsMenuOpen={() => {}}
        activeVersion={activeVersion}
        setActiveVersion={setVersion}
        versionOptions={versionOptions}
      />

      <div className="h-viewport-content w-full flex overflow-hidden shrink-0 relative z-10">
        <aside className={`border-border-dark bg-bg-darker/85 backdrop-blur-sm pt-0 pb-6 px-0 flex flex-col h-full overflow-hidden shrink-0 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "w-0 border-r-0 opacity-0" : "w-80 border-r opacity-100"}`}>
          <Sidebar
            activeVersion={activeVersion}
            setActiveVersion={setVersion}
            currentOpName={activeOpName}
            operationsIndex={operationsIndex}
            versionOptions={versionOptions}
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
