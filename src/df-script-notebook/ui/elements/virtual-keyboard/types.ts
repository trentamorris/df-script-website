export type VirtualKeyboardLayoutType = "qwerty" | "azerty" | "qwertz" | "dvorak";

export interface VirtualKeyboardProps {
  /** The currently active keyboard layout standard */
  layout?: VirtualKeyboardLayoutType;
  /** Array of currently selected / pressed keys */
  selectedKeys: string[];
  /** Callback fired when a key on the virtual keyboard is clicked */
  onKeyToggle: (key: string) => void;
  /** Custom container class name */
  className?: string;
}
