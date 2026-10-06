import React from "react";
import { CellContextValue } from "../types";

export const CellContext = React.createContext<CellContextValue | null>(null);

export interface CellProviderProps {
  value: CellContextValue;
  children: React.ReactNode;
}

export function CellProvider({ value, children }: CellProviderProps) {
  return <CellContext.Provider value={value}>{children}</CellContext.Provider>;
}
