import type { DocsVersion } from "../../../../../types";

export interface HeaderProps {
  path: string;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (val: boolean) => void;
  setIsMenuOpen: (val: boolean) => void;
  activeVersion: DocsVersion;
  setActiveVersion: (val: DocsVersion) => void;
  versionOptions?: DocsVersion[];
}
