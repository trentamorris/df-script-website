export interface OperationParam {
  name: string;
  desc: string;
  type?: string;
  optional?: boolean;
  default?: string;
  children?: OperationParam[];
}

export type DocsVersion = "v2.3.0" | (string & {});

export interface TypeDefinitionItem {
  signature: string;
  subTypes: string[];
  filePath?: string;
  lineStart?: number;
  lineEnd?: number;
}

export interface OperationItem {
  name: string;
  category: "DataFrame" | "ColumnExpression" | "Function" | "DataType" | "Exception";
  syntax?: string;
  desc: string;
  version: DocsVersion;
  examples?: string[];
  params?: OperationParam[];
  returns?: string;
  signature?: string;
  filePath: string;
  lineStart?: number;
  subTypes?: string[];
}
