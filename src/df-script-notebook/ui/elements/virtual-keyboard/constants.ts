import { VirtualKeyboardLayoutType } from "./types";
import { SlidingPillOption } from "../sliding-pill/types";

export const NUMBER_ROW = ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="] as const;

export const ARROWS = ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"] as const;

export const MODIFIERS = ["Ctrl", "Alt", "Shift", "Meta"] as const;

export const LAYOUT_OPTIONS: SlidingPillOption<VirtualKeyboardLayoutType>[] = [
  { value: "qwerty", label: "QWERTY" },
  { value: "azerty", label: "AZERTY" },
  { value: "qwertz", label: "QWERTZ" },
  { value: "dvorak", label: "DVORAK" },
];

export const ALPHA_ROWS: Record<
  VirtualKeyboardLayoutType,
  { row1: readonly string[]; row2: readonly string[]; row3: readonly string[] }
> = {
  qwerty: {
    row1: ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]"],
    row2: ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"],
    row3: ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"],
  },
  azerty: {
    row1: ["A", "Z", "E", "R", "T", "Y", "U", "I", "O", "P", "^", "$"],
    row2: ["Q", "S", "D", "F", "G", "H", "J", "K", "L", "M", "ù"],
    row3: ["W", "X", "C", "V", "B", "N", ",", ";", ":", "!"],
  },
  qwertz: {
    row1: ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P", "ü", "+"],
    row2: ["A", "S", "D", "F", "G", "H", "J", "K", "L", "ö", "ä"],
    row3: ["Y", "X", "C", "V", "B", "N", "M", ",", ".", "-"],
  },
  dvorak: {
    row1: ["'", ",", ".", "P", "Y", "F", "G", "C", "R", "L", "/", "="],
    row2: ["A", "O", "E", "U", "I", "D", "H", "T", "N", "S", "-"],
    row3: [";", "Q", "J", "K", "X", "B", "M", "W", "V", "Z"],
  },
};
