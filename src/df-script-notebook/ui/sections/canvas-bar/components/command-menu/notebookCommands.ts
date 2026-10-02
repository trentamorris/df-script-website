export type CommandScope = "global" | "cell" | "editor";

export type CommandMode = "Global" | "Command Mode" | "Edit Mode";

export interface NotebookCommand {
  id: string;
  name: string;
  defaultKeybinding: string;
  isConfigurable: boolean;
  mode: CommandMode;
}

/** Global notebook level commands */
export const GLOBAL_COMMANDS: NotebookCommand[] = [
  {
    id: "notebook.global.toggleLayoutMode",
    name: "Toggle Document / Canvas View",
    defaultKeybinding: "Ctrl + Shift + L",
    isConfigurable: true,
    mode: "Global",
  },
  {
    id: "notebook.global.saveNotebook",
    name: "Save Notebook",
    defaultKeybinding: "Ctrl + S",
    isConfigurable: false,
    mode: "Global",
  },
  {
    id: "notebook.global.runAll",
    name: "Run All Cells",
    defaultKeybinding: "Ctrl + Shift + Enter",
    isConfigurable: true,
    mode: "Global",
  },
  {
    id: "notebook.global.commandMode",
    name: "Enter Command Mode",
    defaultKeybinding: "Esc",
    isConfigurable: false,
    mode: "Command Mode",
  },
];

/** Cell level commands (active when navigating or manipulating cells in Command Mode) */
export const CELL_COMMANDS: NotebookCommand[] = [
  {
    id: "notebook.cell.addAbove",
    name: "Insert Cell Above",
    defaultKeybinding: "A",
    isConfigurable: true,
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.addBelow",
    name: "Insert Cell Below",
    defaultKeybinding: "B",
    isConfigurable: true,
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.delete",
    name: "Delete Selected Cell",
    defaultKeybinding: "D, D",
    isConfigurable: true,
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.editMode",
    name: "Enter Edit Mode (Focus Editor)",
    defaultKeybinding: "Enter",
    isConfigurable: false,
    mode: "Edit Mode",
  },
  {
    id: "notebook.cell.copy",
    name: "Copy Cell",
    defaultKeybinding: "C",
    isConfigurable: true,
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.paste",
    name: "Paste Cell Below",
    defaultKeybinding: "V",
    isConfigurable: true,
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.toggleOutput",
    name: "Toggle Cell Output Display",
    defaultKeybinding: "O",
    isConfigurable: true,
    mode: "Command Mode",
  },
];

/** Editor level commands (active when editing code/text inside Monaco editor in Edit Mode) */
export const EDITOR_COMMANDS: NotebookCommand[] = [
  {
    id: "notebook.editor.runAndStay",
    name: "Execute Cell & Stay",
    defaultKeybinding: "Ctrl + Enter",
    isConfigurable: false,
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.runAndAdvance",
    name: "Execute Cell & Advance Focus",
    defaultKeybinding: "Shift + Enter",
    isConfigurable: false,
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.runAndInsertBelow",
    name: "Execute Cell & Insert Below",
    defaultKeybinding: "Alt + Enter",
    isConfigurable: false,
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.exitToCommandMode",
    name: "Exit to Command Mode (Blur Editor)",
    defaultKeybinding: "Esc",
    isConfigurable: false,
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.quickSuggestions",
    name: "Trigger Code Autocomplete",
    defaultKeybinding: "Ctrl + Space",
    isConfigurable: false,
    mode: "Edit Mode",
  },
];
