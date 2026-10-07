import React from "react";
import { CellContextValue, CellProviderProps } from "../types";

export const CellContext = React.createContext<CellContextValue | null>(null);

export function CellProvider({ value, children }: CellProviderProps) {
  return <CellContext.Provider value={value}>{children}</CellContext.Provider>;
}
