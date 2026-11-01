import type { OperationItem, TypeDefinitionItem } from "../../../../types";

export interface DocsProps {
  op: OperationItem | undefined;
  activeVersion: string;
  typesMap?: Record<string, TypeDefinitionItem>;
}
