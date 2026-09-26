import React from "react";
import { DesktopLayout, MobileLayout } from "./ui/sections";
import { useGithubVersions, useGithubDocs } from "./hooks/useGithubHooks";
import { useRouter } from "./hooks/useRouter";
import { LayoutProvider, useLayout } from "./hooks/useLayout";

function AppContent() {
  const routerProps = useRouter();
  const versionOptions = useGithubVersions();
  const { operationsIndex } = useGithubDocs(routerProps.activeVersion);
  const { isMobile } = useLayout();

  // If no version was in the URL, automatically select the latest fetched version from GitHub
  React.useEffect(() => {
    if (!routerProps.activeVersion && versionOptions.length > 0) {
      routerProps.setVersion(versionOptions[0]);
    }
  }, [routerProps.activeVersion, versionOptions]);

  return (
    <>
      {!isMobile ? (
        <DesktopLayout
          path={routerProps.path}
          activeVersion={routerProps.activeVersion}
          setVersion={routerProps.setVersion}
          isDocs={routerProps.isDocs}
          activeOpName={routerProps.activeOpName}
          versionOptions={versionOptions}
          operationsIndex={operationsIndex}
        />
      ) : (
        <MobileLayout />
      )}
    </>
  );
}

export default function App() {
  return (
    <LayoutProvider>
      <AppContent />
    </LayoutProvider>
  );
}
