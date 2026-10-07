import { NotebookCommand } from "./types";

/** Global notebook level commands */
export const GLOBAL_COMMANDS: NotebookCommand[] = [
  {
    id: "notebook.global.toggleLayoutMode",
    name: "Toggle Document / Canvas View",
    defaultKeybinding: "Ctrl + Shift + L",
    mode: "Global",
  },
  {
    id: "notebook.global.saveNotebook",
    name: "Save Notebook",
    defaultKeybinding: "Ctrl + S",
    mode: "Global",
  },
  {
    id: "notebook.global.runAll",
    name: "Run All Cells",
    defaultKeybinding: "Ctrl + Shift + Enter",
    mode: "Global",
  },
  {
    id: "notebook.global.runAllAbove",
    name: "Run All Cells Above",
    defaultKeybinding: "Ctrl + F8",
    mode: "Global",
  },
  {
    id: "notebook.global.runAllBelow",
    name: "Run All Cells Below",
    defaultKeybinding: "Ctrl + F9",
    mode: "Global",
  },
  {
    id: "notebook.global.interruptKernel",
    name: "Interrupt Kernel / Execution",
    defaultKeybinding: "I, I",
    mode: "Global",
  },
  {
    id: "notebook.global.restartKernel",
    name: "Restart Kernel",
    defaultKeybinding: "0, 0",
    mode: "Global",
  },
  {
    id: "notebook.global.clearAllOutputs",
    name: "Clear All Outputs",
    defaultKeybinding: "Alt + Shift + C",
    mode: "Global",
  },
  {
    id: "notebook.global.commandMode",
    name: "Enter Command Mode",
    defaultKeybinding: "Esc",
    mode: "Command Mode",
  },
];

/** Cell Container commands (active when navigating or manipulating cells in Command Mode) */
export const CELL_COMMANDS: NotebookCommand[] = [
  // Navigation & Selection
  {
    id: "notebook.cell.selectNext",
    name: "Select Next Cell",
    defaultKeybinding: "J",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.selectPrevious",
    name: "Select Previous Cell",
    defaultKeybinding: "K",
    mode: "Command Mode",
  },
  // Multi-cell selection to be implemented later:
  // {
  //   id: "notebook.cell.extendSelectionNext",
  //   name: "Extend Selection Down",
  //   defaultKeybinding: "Shift + J",
  //   mode: "Command Mode",
  // },
  // {
  //   id: "notebook.cell.extendSelectionPrevious",
  //   name: "Extend Selection Up",
  //   defaultKeybinding: "Shift + K",
  //   mode: "Command Mode",
  // },
  // Creation & Arrangement
  {
    id: "notebook.cell.addAbove",
    name: "Insert Cell Above",
    defaultKeybinding: "A",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.addBelow",
    name: "Insert Cell Below",
    defaultKeybinding: "B",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.moveUp",
    name: "Move Cell Up",
    defaultKeybinding: "Alt + Up",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.moveDown",
    name: "Move Cell Down",
    defaultKeybinding: "Alt + Down",
    mode: "Command Mode",
  },
  // Clipboard & Editing
  {
    id: "notebook.cell.cut",
    name: "Cut Cell",
    defaultKeybinding: "X",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.copy",
    name: "Copy Cell",
    defaultKeybinding: "C",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.paste",
    name: "Paste Cell Below",
    defaultKeybinding: "V",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.pasteAbove",
    name: "Paste Cell Above",
    defaultKeybinding: "Shift + V",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.delete",
    name: "Delete Selected Cell",
    defaultKeybinding: "D, D",
    mode: "Command Mode",
  },
  // Type Switching
  {
    id: "notebook.cell.changeToCode",
    name: "Change Cell to Code",
    defaultKeybinding: "Y",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.changeToMarkdown",
    name: "Change Cell to Markdown",
    defaultKeybinding: "M",
    mode: "Command Mode",
  },
  // Merge & Mode
  {
    id: "notebook.cell.mergeBelow",
    name: "Merge with Cell Below",
    defaultKeybinding: "Shift + M",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.editMode",
    name: "Enter Edit Mode (Focus Editor)",
    defaultKeybinding: "Enter",
    mode: "Edit Mode",
  },
  // Output & Display
  {
    id: "notebook.cell.toggleOutput",
    name: "Toggle Cell Output Display",
    defaultKeybinding: "O",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.clearOutput",
    name: "Clear Cell Output",
    defaultKeybinding: "Alt + C",
    mode: "Command Mode",
  },
  // Cell Execution & Mode
  {
    id: "notebook.cell.runAndStay",
    name: "Execute Cell & Stay",
    defaultKeybinding: "Ctrl + Enter",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.runAndAdvance",
    name: "Execute Cell & Advance Focus",
    defaultKeybinding: "Shift + Enter",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.runAndInsertBelow",
    name: "Execute Cell & Insert Below",
    defaultKeybinding: "Alt + Enter",
    mode: "Command Mode",
  },
  {
    id: "notebook.cell.exitToCommandMode",
    name: "Exit to Command Mode (Blur Editor)",
    defaultKeybinding: "Esc",
    mode: "Edit Mode",
  },
  {
    id: "notebook.cell.splitCell",
    name: "Split Cell at Cursor",
    defaultKeybinding: "Ctrl + Shift + S",
    mode: "Edit Mode",
  },
];

/** Canonical Cell Command IDs */
export type CellCommandId = (typeof CELL_COMMANDS)[number]["id"];

/** Map of cell command IDs to keybinding strings */
export type CellKeybindings = Partial<Record<CellCommandId, string>>;

/** Resolved dictionary of default keybindings for all cell commands */
export const DEFAULT_CELL_KEYBINDINGS: Record<CellCommandId, string> = CELL_COMMANDS.reduce(
  (acc, cmd) => {
    acc[cmd.id as CellCommandId] = cmd.defaultKeybinding;
    return acc;
  },
  {} as Record<CellCommandId, string>
);

/** Monaco Editor commands (built-in editor shortcuts) */
export const EDITOR_COMMANDS: NotebookCommand[] = [
  // Editing & History
  {
    id: "notebook.editor.undoTyping",
    name: "Undo Typing",
    defaultKeybinding: "Ctrl + Z",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.redoTyping",
    name: "Redo Typing",
    defaultKeybinding: "Ctrl + Y",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.triggerSuggest",
    name: "Trigger Autocomplete / IntelliSense",
    defaultKeybinding: "Ctrl + Space",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.acceptSuggest",
    name: "Accept Autocomplete Suggestion",
    defaultKeybinding: "Tab",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.commentLine",
    name: "Toggle Line Comment",
    defaultKeybinding: "Ctrl + /",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.indentLine",
    name: "Indent Line",
    defaultKeybinding: "Tab",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.outdentLine",
    name: "Outdent Line",
    defaultKeybinding: "Shift + Tab",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.moveLineUp",
    name: "Move Line Up",
    defaultKeybinding: "Alt + Up",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.moveLineDown",
    name: "Move Line Down",
    defaultKeybinding: "Alt + Down",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.duplicateLineDown",
    name: "Duplicate Line Down",
    defaultKeybinding: "Shift + Alt + Down",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.duplicateLineUp",
    name: "Duplicate Line Up",
    defaultKeybinding: "Shift + Alt + Up",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.deleteLine",
    name: "Delete Line",
    defaultKeybinding: "Ctrl + Shift + K",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.find",
    name: "Find in Cell",
    defaultKeybinding: "Ctrl + F",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.replace",
    name: "Replace in Cell",
    defaultKeybinding: "Ctrl + H",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.addCursorAbove",
    name: "Add Cursor Above",
    defaultKeybinding: "Ctrl + Alt + Up",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.addCursorBelow",
    name: "Add Cursor Below",
    defaultKeybinding: "Ctrl + Alt + Down",
    mode: "Edit Mode",
  },
  {
    id: "notebook.editor.selectWordMatch",
    name: "Add Selection to Next Find Match",
    defaultKeybinding: "Ctrl + D",
    mode: "Edit Mode",
  },
];

/** Combined list of all notebook commands */
export const ALL_NOTEBOOK_COMMANDS: NotebookCommand[] = [
  ...GLOBAL_COMMANDS,
  ...CELL_COMMANDS,
  ...EDITOR_COMMANDS,
];

