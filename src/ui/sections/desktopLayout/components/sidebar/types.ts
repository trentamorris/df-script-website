import type { OperationItem, DocsVersion } from "../../../../../types";

export interface SidebarProps {
  activeVersion: DocsVersion;
  setActiveVersion: (val: DocsVersion) => void;
  currentOpName?: string;
  operationsIndex: OperationItem[];
  setIsMenuOpen?: (val: boolean) => void;
  isDrawer?: boolean;
  isMenuOpen?: boolean;
  versionOptions?: DocsVersion[];
}
