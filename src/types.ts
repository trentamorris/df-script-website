export interface OperationParam {
  name: string;
  desc: string;
  type?: string;
  optional?: boolean;
  children?: OperationParam[];
}

export interface OperationItem {
  name: string;
  category: "DataFrame" | "ColumnExpression" | "DataType" | "Exception";
  syntax: string;
  desc: string;
  version: "v1.7.0";
  examples?: string[];
  params?: OperationParam[];
  returns?: string;
}
