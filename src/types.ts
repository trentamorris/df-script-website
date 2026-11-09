export interface OperationParam {
  name: string;
  desc: string;
  type?: string;
  optional?: boolean;
  default?: string;
  children?: OperationParam[];
}

export type DocsVersion = "v2.4.0" | (string & {});

export interface TypeTreeNode {
  type: string;
  optional: boolean;
  variadic?: boolean;
  default?: string;
  desc: string;
  resolvedType?: string;
  properties?: Record<string, TypeTreeNode>;
}

export interface TypeDefinitionItem {
  signature: string;
  desc?: string;
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
  properties?: Record<string, TypeTreeNode>;
}

export interface OperationItem {
  callExpression: string;
  propertyAccess: string;
  namespace?: string;
  accessor?: string;
  category: "DataFrame" | "ColumnExpression" | "Function" | "DataType" | "Exception";
  syntax?: string;
  desc: string;
  version: DocsVersion;
  examples?: string[];
  params?: OperationParam[];
  returns?: string;
  signature?: string;
  signatureDetailed?: string;
  filePath: string;
  lineStart?: number;
  typeTree?: Record<string, TypeTreeNode>;
  name?: string; // backwards compatibility alias if referenced
}
