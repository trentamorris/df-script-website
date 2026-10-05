import type * as Monaco from "monaco-editor";

export interface RegisterCellKeyboardShortcutsParams {
  editor: Monaco.editor.IStandaloneCodeEditor;
  monaco: typeof Monaco;
  getCellId: () => string;
  getIndex: () => number;
  getTotalCells: () => number;
  onRun: (id: string) => void;
  onAddCell: (index: number, type: "code" | "markdown") => void;
  onAdvanceCell?: (currentIndex: number) => void;
  onSplitCell?: (index: number, beforeCode: string, afterCode: string) => void;
  cellContainerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Registers keyboard execution shortcuts onto a Monaco cell editor instance.
 * Uses getter closures so callback handlers always target the freshest cell state.
 */
export function registerCellKeyboardShortcuts({
  editor,
  monaco,
  getCellId,
  getIndex,
  getTotalCells,
  onRun,
  onAddCell,
  onAdvanceCell,
  onSplitCell,
  cellContainerRef,
}: RegisterCellKeyboardShortcutsParams): void {
  // 1. Ctrl + Enter (Cmd + Enter): Run current cell and stay
  editor.addAction({
    id: "notebook.cell.runAndStay",
    label: "Run Cell and Stay",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
    run: () => {
      const id = getCellId();
      onRun(id);
    },
  });

  // 2. Shift + Enter: Run current cell and advance focus to the next cell
  editor.addAction({
    id: "notebook.cell.runAndAdvance",
    label: "Run Cell and Advance",
    keybindings: [monaco.KeyMod.Shift | monaco.KeyCode.Enter],
    run: () => {
      const id = getCellId();
      const index = getIndex();
      const total = getTotalCells();

      onRun(id);

      if (index >= total - 1) {
        onAddCell(total, "code");
      } else if (onAdvanceCell) {
        onAdvanceCell(index);
      } else {
        const nextCell = cellContainerRef.current?.parentElement?.children[index + 1];
        const nextEditor = nextCell?.querySelector(".monaco-editor textarea") as HTMLElement | null;
        if (nextEditor) nextEditor.focus();
      }
    },
  });

  // 3. Alt + Enter: Run current cell and insert a new code cell directly below
  editor.addAction({
    id: "notebook.cell.runAndInsertBelow",
    label: "Run Cell and Insert Below",
    keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.Enter],
    run: () => {
      const id = getCellId();
      const index = getIndex();

      onRun(id);
      onAddCell(index + 1, "code");
    },
  });

  // 4. Ctrl + Shift + S (Cmd + Shift + S): Split cell at current cursor position
  editor.addAction({
    id: "notebook.cell.splitCell",
    label: "Split Cell at Cursor",
    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
    run: (ed) => {
      const position = ed.getPosition();
      const model = ed.getModel();
      if (!position || !model) return;

      const offset = model.getOffsetAt(position);
      const fullText = model.getValue();
      const beforeCode = fullText.slice(0, offset);
      const afterCode = fullText.slice(offset);

      const index = getIndex();
      onSplitCell?.(index, beforeCode, afterCode);
    },
  });

  // 5. Escape: Exit to Command Mode (Blur Editor & Focus Cell Container)
  editor.addCommand(monaco.KeyCode.Escape, () => {
    const activeEl = document.activeElement as HTMLElement | null;
    activeEl?.blur();
    cellContainerRef.current?.focus?.();
  });
}

export interface RegisterNotebookKeyboardShortcutsParams {
  keybindings?: Record<string, string>;
  onAddCellAbove?: () => void;
  onAddCellBelow?: () => void;
  onDeleteActiveCell?: () => void;
  onRunActiveCell?: () => void;
  onRunAndAdvanceCell?: () => void;
  onRunAllCells?: () => void;
  onSelectNextCell?: () => void;
  onSelectPreviousCell?: () => void;
  onChangeCellToCode?: () => void;
  onChangeCellToMarkdown?: () => void;
  onMoveCellUp?: () => void;
  onMoveCellDown?: () => void;
  onCutActiveCell?: () => void;
  onCopyActiveCell?: () => void;
  onPasteCellBelow?: () => void;
  onPasteCellAbove?: () => void;
  onUndoCellAction?: () => void;
  onRedoCellAction?: () => void;
  onMergeWithCellBelow?: () => void;
  onEnterEditMode?: () => void;
  onToggleActiveCellOutput?: () => void;
  onClearOutputs?: () => void;
  onToggleLayoutMode?: () => void;
  onSaveNotebook?: () => void;
}

/**
 * Checks if a KeyboardEvent matches a keybinding string representation (e.g. "Ctrl + Shift + L", "Alt + Up", "J").
 */
function _matchesKeybinding(e: KeyboardEvent, bindingStr: string): boolean {
  if (!bindingStr) return false;

  const parts = bindingStr.split(" + ").map((p) => p.trim().toLowerCase());
  const expectsCtrl = parts.includes("ctrl") || parts.includes("control");
  const expectsShift = parts.includes("shift");
  const expectsAlt = parts.includes("alt");
  const expectsMeta = parts.includes("meta") || parts.includes("cmd") || parts.includes("command");

  const hasCtrlOrMeta = e.ctrlKey || e.metaKey;
  if (expectsCtrl || expectsMeta) {
    if (!hasCtrlOrMeta) return false;
  } else {
    if (hasCtrlOrMeta) return false;
  }

  if (expectsShift !== Boolean(e.shiftKey)) return false;
  if (expectsAlt !== Boolean(e.altKey)) return false;

  const mainKeyPart = parts.find((p) => !["ctrl", "control", "shift", "alt", "meta", "cmd", "command"].includes(p));
  if (!mainKeyPart) return false;

  const eventKey = e.key.toLowerCase();
  if (mainKeyPart === "enter") return eventKey === "enter";
  if (mainKeyPart === "esc" || mainKeyPart === "escape") return eventKey === "escape";
  if (mainKeyPart === "up" || mainKeyPart === "arrowup") return eventKey === "arrowup";
  if (mainKeyPart === "down" || mainKeyPart === "arrowdown") return eventKey === "arrowdown";
  if (mainKeyPart === "left" || mainKeyPart === "arrowleft") return eventKey === "arrowleft";
  if (mainKeyPart === "right" || mainKeyPart === "arrowright") return eventKey === "arrowright";
  if (mainKeyPart === "space") return eventKey === " " || eventKey === "space";

  return eventKey === mainKeyPart;
}

/**
 * Registers global notebook Command Mode keyboard shortcuts on the window object.
 * Reads updated keybindings dynamically and triggers registered cell/notebook actions.
 */
export function registerNotebookKeyboardShortcuts({
  keybindings = {},
  onAddCellAbove,
  onAddCellBelow,
  onDeleteActiveCell,
  onRunActiveCell,
  onRunAndAdvanceCell,
  onRunAllCells,
  onSelectNextCell,
  onSelectPreviousCell,
  onChangeCellToCode,
  onChangeCellToMarkdown,
  onMoveCellUp,
  onMoveCellDown,
  onCutActiveCell,
  onCopyActiveCell,
  onPasteCellBelow,
  onPasteCellAbove,
  onUndoCellAction,
  onRedoCellAction,
  onMergeWithCellBelow,
  onEnterEditMode,
  onToggleActiveCellOutput,
  onClearOutputs,
  onToggleLayoutMode,
  onSaveNotebook,
}: RegisterNotebookKeyboardShortcutsParams): () => void {
  let lastKey = "";
  let lastKeyTime = 0;

  const getBinding = (cmdId: string, defaultBinding: string) => {
    return keybindings[cmdId] || defaultBinding;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    // Don't intercept typing in inputs, textareas, or active Monaco editors
    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target?.isContentEditable ||
      target?.closest(".monaco-editor")
    ) {
      return;
    }

    const now = Date.now();
    const key = e.key.toLowerCase();

    // 1. Double-tap sequential shortcuts (e.g. "D, D" or "0, 0")
    const deleteBinding = getBinding("notebook.cell.delete", "D, D");
    if (deleteBinding === "D, D" && key === "d" && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (lastKey === "d" && now - lastKeyTime < 500) {
        e.preventDefault();
        onDeleteActiveCell?.();
        lastKey = "";
        return;
      }
      lastKey = "d";
      lastKeyTime = now;
      return;
    }

    lastKey = "";

    // 2. Global Level Commands
    if (_matchesKeybinding(e, getBinding("notebook.global.toggleLayoutMode", "Ctrl + Shift + L"))) {
      e.preventDefault();
      onToggleLayoutMode?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.global.saveNotebook", "Ctrl + S"))) {
      e.preventDefault();
      onSaveNotebook?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.global.runAll", "Ctrl + Shift + Enter"))) {
      e.preventDefault();
      onRunAllCells?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.global.clearAllOutputs", "Alt + Shift + C"))) {
      e.preventDefault();
      onClearOutputs?.();
      return;
    }

    // 3. Cell Actions & Execution
    if (_matchesKeybinding(e, getBinding("notebook.cell.runAndAdvance", "Shift + Enter"))) {
      e.preventDefault();
      onRunAndAdvanceCell?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.runAndStay", "Ctrl + Enter"))) {
      e.preventDefault();
      onRunActiveCell?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.addAbove", "A"))) {
      e.preventDefault();
      onAddCellAbove?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.addBelow", "B"))) {
      e.preventDefault();
      onAddCellBelow?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.selectNext", "J"))) {
      e.preventDefault();
      onSelectNextCell?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.selectPrevious", "K"))) {
      e.preventDefault();
      onSelectPreviousCell?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.changeToCode", "Y"))) {
      e.preventDefault();
      onChangeCellToCode?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.changeToMarkdown", "M"))) {
      e.preventDefault();
      onChangeCellToMarkdown?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.moveUp", "Alt + Up"))) {
      e.preventDefault();
      onMoveCellUp?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.moveDown", "Alt + Down"))) {
      e.preventDefault();
      onMoveCellDown?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.cut", "X"))) {
      e.preventDefault();
      onCutActiveCell?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.copy", "C"))) {
      e.preventDefault();
      onCopyActiveCell?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.pasteAbove", "Shift + V"))) {
      e.preventDefault();
      onPasteCellAbove?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.pasteBelow", "V"))) {
      e.preventDefault();
      onPasteCellBelow?.();
      return;
    }
    if (_matchesKeybinding(e, "Ctrl + Z")) {
      e.preventDefault();
      onUndoCellAction?.();
      return;
    }
    if (_matchesKeybinding(e, "Ctrl + Y") || _matchesKeybinding(e, "Ctrl + Shift + Z")) {
      e.preventDefault();
      onRedoCellAction?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.mergeBelow", "Shift + M"))) {
      e.preventDefault();
      onMergeWithCellBelow?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.editMode", "Enter"))) {
      e.preventDefault();
      onEnterEditMode?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.toggleOutput", "O"))) {
      e.preventDefault();
      onToggleActiveCellOutput?.();
      return;
    }
    if (_matchesKeybinding(e, getBinding("notebook.cell.clearOutput", "Alt + C"))) {
      e.preventDefault();
      onClearOutputs?.();
      return;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}


