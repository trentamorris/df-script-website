import React from "react";
import type * as monacoType from "monaco-editor";
import { NotebookCommand } from "../types";
import { EDITOR_COMMANDS } from "../commands";

/**
 * Custom hook to dynamically discover and keep Monaco Editor commands and shortcuts up-to-date.
 * Introspects Monaco's internal actions and platform-aware keybinding service, falling back
 * to standard curated EDITOR_COMMANDS if Monaco is not yet mounted.
 */
export function useMonacoCommands(
  editor: monacoType.editor.IStandaloneCodeEditor | null
): NotebookCommand[] {
  const [commands, setCommands] = React.useState<NotebookCommand[]>(EDITOR_COMMANDS);

  React.useEffect(() => {
    if (!editor) {
      // Check if any mounted cell editor is stored on the DOM
      const domEditor = document.querySelector("[data-cell-id] .monaco-editor");
      if (!domEditor) return;
    }

    try {
      const activeEditor =
        editor ||
        ((document.querySelector("[data-cell-id]") as any)?.__monacoEditor as monacoType.editor.IStandaloneCodeEditor);

      if (!activeEditor || typeof activeEditor.getSupportedActions !== "function") return;

      const actions = activeEditor.getSupportedActions();
      const keybindingService = (activeEditor as any)._standaloneKeybindingService;

      const dynamicCommands: NotebookCommand[] = [];

      for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        // Skip custom notebook actions so Monaco Editor Commands is pure Monaco
        if (action.id.startsWith("notebook.")) continue;

        // Look up keybinding via Monaco's internal service for the current OS platform
        const binding = keybindingService?.lookupKeybinding(action.id)?.getAriaLabel();

        // Only include actions that have an active keybinding and a readable user label
        if (
          binding &&
          action.label &&
          !action.label.startsWith("&&") &&
          !action.label.startsWith("cursor")
        ) {
          dynamicCommands.push({
            id: action.id,
            name: action.label,
            defaultKeybinding: binding,
            mode: "Edit Mode",
          });
        }
      }

      if (dynamicCommands.length > 0) {
        setCommands(dynamicCommands);
      }
    } catch {
      // Keep static EDITOR_COMMANDS on any error
    }
  }, [editor]);

  return commands;
}
