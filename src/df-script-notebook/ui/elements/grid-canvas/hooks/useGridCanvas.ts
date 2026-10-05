import React from "react";
import { GridCanvasContext } from "../context";
import { GridCanvasContextValue } from "../types";

export function useGridCanvas(): GridCanvasContextValue {
  const context = React.useContext(GridCanvasContext);
  if (!context) {
    throw new Error("useGridCanvas must be used within a GridCanvas component or GridCanvasContext.Provider");
  }
  return context;
}

export default useGridCanvas;
