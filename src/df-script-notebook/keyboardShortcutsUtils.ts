import type * as Monaco from "monaco-editor";

export interface RegisterCellKeyboardShortcutsParams {
  editor: Monaco.editor.IStandaloneCodeEditor;
  monaco: typeof Monaco;
  getCellId: () => string;
  getIndex: () => number;
  getTotalCells: () => number;
  onRun: (id: string) => void;
  onAddCell: (index: number, type: "code" | "jsx" | "markdown") => void;
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
        // End of notebook: automatically append a new code cell
        onAddCell(total, "code");
      } else {
        // Advance focus to next cell editor
        const nextCellContainer = cellContainerRef.current?.parentElement?.children[index + 1];
        const nextEditorArea = nextCellContainer?.querySelector(".monaco-editor textarea") as HTMLElement | null;
        if (nextEditorArea) {
          nextEditorArea.focus();
        }
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
}

export interface RegisterNotebookKeyboardShortcutsParams {
  onAddCellAbove?: () => void;
  onAddCellBelow?: () => void;
  onDeleteActiveCell?: () => void;
  onRunActiveCell?: () => void;
  onToggleLayoutMode?: () => void;
}

/**
 * Registers global notebook Command Mode keyboard shortcuts on the window object.
 * Automatically ignores keystrokes when the user is actively focused on an input, textarea, or Monaco editor.
 * Returns an unbind cleanup function suitable for useEffect returns.
 */
export function registerNotebookKeyboardShortcuts({
  onAddCellAbove,
  onAddCellBelow,
  onDeleteActiveCell,
  onRunActiveCell,
  onToggleLayoutMode,
}: RegisterNotebookKeyboardShortcutsParams): () => void {
  let lastKey = "";
  let lastKeyTime = 0;

  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
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

    // D, D double-press to delete cell
    if (key === "d") {
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

    // A: Add cell above
    if (key === "a" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      onAddCellAbove?.();
      return;
    }

    // B: Add cell below
    if (key === "b" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      onAddCellBelow?.();
      return;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}

