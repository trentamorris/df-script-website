export interface OperationParam {
  name: string;
  desc: string;
  type?: string;
  optional?: boolean;
  children?: OperationParam[];
}

export type DocsVersion = "v1.7.0" | "v1.6.0" | "v1.5.0";

export interface OperationItem {
  name: string;
  category: "DataFrame" | "ColumnExpression" | "DataType" | "Exception";
  syntax: string;
  desc: string;
  version: DocsVersion;
  examples?: string[];
  params?: OperationParam[];
  returns?: string;
}
