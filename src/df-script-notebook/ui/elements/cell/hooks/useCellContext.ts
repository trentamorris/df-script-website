import React from "react";
import { CellContext } from "../context/CellContext";
import { CellContextValue } from "../types";

export function useCellContext(): CellContextValue {
  const context = React.useContext(CellContext);
  if (!context) {
    throw new Error("useCellContext must be used within a CellProvider");
  }
  return context;
}
