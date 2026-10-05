import React from "react";
import { GridCanvasContextValue } from "./types";

export const GridCanvasContext = React.createContext<GridCanvasContextValue | null>(null);
