import React from "react";
import type { DocsVersion } from "../types";
import { KNOWN_VERSIONS } from "../constants";

const DOCS_PATTERN = /^\/docs\/([^\/]+)\/(.+)$/;

export function useRouter() {
  const [path, setPath] = React.useState(() => window.location.pathname);
  const [activeVersion, setActiveVersion] = React.useState<DocsVersion>(KNOWN_VERSIONS[0]);

  // Listen for browser back/forward navigation
  React.useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Intercept same-origin anchor clicks for SPA navigation
  React.useEffect(() => {
    const onLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target?.href || target.host !== window.location.host) return;
      if (target.target || e.ctrlKey || e.metaKey || e.shiftKey) return;
      e.preventDefault();
      const url = new URL(target.href);
      const newPath = url.pathname + url.search;
      window.history.pushState({}, "", newPath);
      setPath(url.pathname);
    };
    document.addEventListener("click", onLinkClick);
    return () => document.removeEventListener("click", onLinkClick);
  }, []);

  // Sync activeVersion from URL when navigating directly to /docs/{version}/...
  const docsMatch = path.match(DOCS_PATTERN);
  React.useEffect(() => {
    if (!docsMatch) return;
    const urlVersion = docsMatch[1] as DocsVersion;
    if (urlVersion !== activeVersion) setActiveVersion(urlVersion);
  }, [path]);

  /** Navigate to any path, updating the browser URL and reactive path state. */
  const navigate = (newPath: string) => {
    window.history.pushState({}, "", newPath);
    setPath(newPath);
  };

  /**
   * Switch the active documentation version.
   * If the user is currently viewing a /docs/ page, the URL is rewritten
   * to keep the active operation path in sync with the new version.
   */
  const setVersion = (version: DocsVersion) => {
    setActiveVersion(version);
    if (docsMatch) {
      navigate(`/docs/${version}/${docsMatch[2]}`);
    }
  };

  const isDocs = !!docsMatch;
  const activeOpName = docsMatch ? decodeURIComponent(docsMatch[2]) : "";

  return {
    path,
    navigate,
    activeVersion,
    setVersion,
    isDocs,
    activeOpName,
  };
}
