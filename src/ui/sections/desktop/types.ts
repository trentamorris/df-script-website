import type { OperationItem } from "../../../types";

export interface DesktopLayoutProps {
  path: string;
  activeVersion: string;
  setVersion: (v: string) => void;
  isDocs: boolean;
  activeOpName: string;
  versionOptions: string[];
  operationsIndex: OperationItem[];
}
