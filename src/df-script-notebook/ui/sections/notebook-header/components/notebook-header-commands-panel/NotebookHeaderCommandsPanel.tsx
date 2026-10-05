import React from "react";
import PanelNavigation from "../../../../elements/panel-navigation/PanelNavigation";
import { NavigationPanelItem } from "../../../../elements/panel-navigation/types";
import {
  GLOBAL_COMMANDS,
  CELL_COMMANDS,
  EDITOR_COMMANDS,
} from "../../../../../commands";
import { NotebookCommand } from "../../../../../types";
import {
  ViewAgendaRounded,
  CodeRounded,
  ChevronRight,
} from "@mui/icons-material";
import { KeyboardKeyConfigurator } from "./KeyboardKeyConfigurator";
import { PanelItem } from "../../../../elements/panel-navigation/PanelNavigation";
import { NotebookHeaderCommandsPanelProps } from "./types";
import { useMonacoCommands } from "../../../../../hooks";

/** Renders a single row representing a notebook command with keybinding & configurable status */
function CommandRow({
  command,
  currentBinding,
  onConfigure,
}: {
  command: NotebookCommand;
  currentBinding: string;
  onConfigure?: (cmd: NotebookCommand) => void;
}) {
  const isClickable = Boolean(onConfigure);

  return (
    <PanelItem
      onClick={() => isClickable && onConfigure?.(command)}
      className={`!px-2.5 !py-2 rounded-lg ${!isClickable ? "cursor-default" : ""}`}
      render={({ isFocused }) => (
        <div className="flex items-center justify-between gap-3 w-full">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs text-white/90 font-medium truncate">{command.name}</span>
            <span className="text-[10px] text-white/40 font-mono truncate">{command.id}</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-white/50 text-[12px]">
            {/* Keybinding Badge */}
            <kbd className="px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-white/[0.08] text-white/80">
              {currentBinding}
            </kbd>

            {/* Drill-down arrow only if configurable */}
            {isClickable && (
              <ChevronRight
                sx={{
                  fontSize: 16,
                  color: "rgba(255, 255, 255, 0.4)",
                  ml: -0.5,
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        </div>
      )}
    />
  );
}

/** Renders a list of commands */
function CommandList({
  commands,
  bindings,
  onConfigure,
}: {
  commands: NotebookCommand[];
  bindings: Record<string, string>;
  onConfigure?: (cmd: NotebookCommand) => void;
}) {
  return (
    <div className="flex flex-col pr-1">
      {commands.map((cmd) => (
        <CommandRow
          key={cmd.id}
          command={cmd}
          currentBinding={bindings[cmd.id] || cmd.defaultKeybinding}
          onConfigure={onConfigure}
        />
      ))}
    </div>
  );
}

export default function NotebookHeaderCommandsPanel({
  isOpen,
  onClose,
  anchorEl,
  bindings: propBindings,
  onUpdateBinding,
}: NotebookHeaderCommandsPanelProps) {
  // Store customized bindings in component state with support for prop controlled state
  const [internalBindings, setInternalBindings] = React.useState<Record<string, string>>({});
  const bindings = propBindings || internalBindings;

  const [configuringCommand, setConfiguringCommand] = React.useState<NotebookCommand | null>(null);

  const handleSaveBinding = (cmdId: string, newBinding: string) => {
    setInternalBindings((prev) => ({ ...prev, [cmdId]: newBinding }));
    onUpdateBinding?.(cmdId, newBinding);
  };

  // If a command is being configured, show the interactive keyboard configurator as a drill-down
  const activeSubPanel = configuringCommand ? (
    <KeyboardKeyConfigurator
      command={configuringCommand}
      currentBinding={bindings[configuringCommand.id] || configuringCommand.defaultKeybinding}
      allBindings={bindings}
      onSave={(newBinding) => handleSaveBinding(configuringCommand.id, newBinding)}
      onBack={() => setConfiguringCommand(null)}
    />
  ) : null;


  const monacoEditorCommands = useMonacoCommands(null);

  // Navigation structure: Global commands + subpanels all in a single items list
  const navigationItems: NavigationPanelItem[] = React.useMemo(() => {
    const categoryItems: NavigationPanelItem[] = [
      {
        id: "nav-cell-container",
        icon: <ViewAgendaRounded sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.7)" }} />,
        label: "Cell Container Commands",
        value: `${CELL_COMMANDS.length} commands`,
        subPanel: (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-white/50 font-medium px-2 py-1">
              Active when cell container is focused (Command Mode)
            </span>
            <CommandList
              commands={CELL_COMMANDS}
              bindings={bindings}
              onConfigure={(cmd) => setConfiguringCommand(cmd)}
            />
          </div>
        ),
      },
      {
        id: "nav-cell-editor",
        icon: <CodeRounded sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.7)" }} />,
        label: "Monaco Editor Commands",
        value: `${monacoEditorCommands.length} commands`,
        subPanel: (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-white/50 font-medium px-2 py-1">
              Active when typing inside Monaco editor (Edit Mode - Built-in shortcuts)
            </span>
            <CommandList
              commands={monacoEditorCommands}
              bindings={bindings}
            />
          </div>
        ),
      },
    ];

    const globalCommandItems: NavigationPanelItem[] = GLOBAL_COMMANDS.map((cmd: NotebookCommand) => {
      const currentBinding = bindings[cmd.id] || cmd.defaultKeybinding;
      return {
        id: cmd.id,
        label: cmd.name,
        render: () => (
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs text-white/90 font-medium truncate">{cmd.name}</span>
              <span className="text-[10px] text-white/40 font-mono truncate">{cmd.id}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 text-white/50 text-[12px]">
              <kbd className="px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-white/[0.08] text-white/80">
                {currentBinding}
              </kbd>
              <ChevronRight
                sx={{
                  fontSize: 16,
                  color: "rgba(255, 255, 255, 0.4)",
                  ml: -0.5,
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        ),
        subPanel: (
          <KeyboardKeyConfigurator
            command={cmd}
            currentBinding={currentBinding}
            allBindings={bindings}
            onSave={(newBinding) => handleSaveBinding(cmd.id, newBinding)}
            onBack={() => setConfiguringCommand(null)}
          />
        ),
        onClick: () => setConfiguringCommand(cmd),
      };
    });

    return [...categoryItems, ...globalCommandItems];
  }, [bindings, monacoEditorCommands]);

  // If configuring a command directly via initialItemId or state, wrap if needed
  const renderedItems = React.useMemo(() => {
    if (!configuringCommand) return navigationItems;

    // Check if item already exists in navigationItems with matching subPanel
    const existing = navigationItems.find((it) => it.id === configuringCommand.id);
    if (existing) return navigationItems;

    const scopePath = configuringCommand.id.startsWith("notebook.global")
      ? "Global"
      : configuringCommand.id.startsWith("notebook.editor")
        ? "Inside Cell (Editor)"
        : "Cell Container";

    return [
      ...navigationItems,
      {
        id: `config-${configuringCommand.id}`,
        label: `${scopePath} / ${configuringCommand.name}`,
        subPanel: activeSubPanel,
        hidden: true,
      },
    ];
  }, [navigationItems, configuringCommand, activeSubPanel]);

  const activeInitialId = configuringCommand
    ? navigationItems.some((it) => it.id === configuringCommand.id)
      ? configuringCommand.id
      : `config-${configuringCommand.id}`
    : null;

  return (
    <PanelNavigation
      isOpen={isOpen}
      onClose={() => {
        setConfiguringCommand(null);
        onClose();
      }}
      isModal={true}
      title="Global Commands"
      items={renderedItems}
      initialItemId={activeInitialId}
      onNavigateBack={() => setConfiguringCommand(null)}
      className="!min-w-[360px] !max-w-[420px]"
    />
  );
}
