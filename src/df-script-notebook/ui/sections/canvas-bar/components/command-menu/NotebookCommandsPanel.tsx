import React from "react";
import PanelNavigation from "../../../../elements/panel-navigation/PanelNavigation";
import { NavigationPanelItem } from "../../../../elements/panel-navigation/types";
import {
  GLOBAL_COMMANDS,
  CELL_COMMANDS,
  EDITOR_COMMANDS,
  NotebookCommand,
} from "./notebookCommands";
import {
  PublicRounded,
  ViewAgendaRounded,
  CodeRounded,
  ChevronRight,
} from "@mui/icons-material";
import { KeyboardKeyConfigurator } from "./KeyboardKeyConfigurator";

export interface NotebookCommandsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
}

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
  const isClickable = command.isConfigurable && Boolean(onConfigure);

  return (
    <div
      onClick={() => isClickable && onConfigure?.(command)}
      className={`flex items-center justify-between gap-3 py-2 px-2 rounded-lg border-b border-white/[0.04] last:border-b-0 transition-colors ${
        isClickable ? "cursor-pointer hover:bg-white/[0.06] active:bg-white/[0.09]" : ""
      }`}
    >
      <div className="flex flex-col min-w-0 pr-2">
        <span className="text-xs text-white/90 font-medium truncate">{command.name}</span>
        <span className="text-[10px] text-white/40 font-mono truncate">{command.id}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 text-white/50 text-[12px]">
        {/* Keybinding Badge */}
        <kbd className="px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-white/[0.08] text-white/80">
          {currentBinding}
        </kbd>

        {/* YouTube-style drill-down arrow (invisible placeholder for fixed commands to preserve offset alignment) */}
        <ChevronRight
          sx={{
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.4)",
            ml: -0.5,
            opacity: command.isConfigurable ? 1 : 0,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
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
    <div className="flex flex-col overflow-y-auto overscroll-contain pr-1">
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

export function NotebookCommandsPanel({
  isOpen,
  onClose,
  anchorEl,
}: NotebookCommandsPanelProps) {
  // Store customized bindings in component state
  const [bindings, setBindings] = React.useState<Record<string, string>>({});
  const [configuringCommand, setConfiguringCommand] = React.useState<NotebookCommand | null>(null);

  const handleSaveBinding = (cmdId: string, newBinding: string) => {
    setBindings((prev) => ({ ...prev, [cmdId]: newBinding }));
  };

  // If a command is being configured, show the interactive keyboard configurator as a drill-down
  const activeSubPanel = configuringCommand ? (
    <KeyboardKeyConfigurator
      command={configuringCommand}
      currentBinding={bindings[configuringCommand.id] || configuringCommand.defaultKeybinding}
      onSave={(newBinding) => handleSaveBinding(configuringCommand.id, newBinding)}
      onBack={() => setConfiguringCommand(null)}
    />
  ) : null;

  // Navigation structure: Global (root) -> Cell Commands -> (within it) Editor Commands
  const navigationItems: NavigationPanelItem[] = React.useMemo(() => {
    return [
      {
        id: "nav-cell",
        icon: <ViewAgendaRounded sx={{ fontSize: 18, color: "var(--cell-accent-blue, #60a5fa)" }} />,
        label: "Cell Commands",
        value: `${CELL_COMMANDS.length} commands`,
        subPanel: (
          <div className="flex flex-col gap-3">
            {/* Editor Commands sub-entry inside Cell Commands */}
            <div className="flex flex-col gap-1 pb-2 border-b border-white/[0.08]">
              <span className="text-[11px] text-white/50 font-medium">Inside Cell (Monaco):</span>
              <div className="mt-1 pl-1">
                <CommandList
                  commands={EDITOR_COMMANDS}
                  bindings={bindings}
                  onConfigure={(cmd) => setConfiguringCommand(cmd)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-white/50 font-medium">
                Cell Container (Command Mode):
              </span>
              <CommandList
                commands={CELL_COMMANDS}
                bindings={bindings}
                onConfigure={(cmd) => setConfiguringCommand(cmd)}
              />
            </div>
          </div>
        ),
      },
    ];
  }, [bindings]);

  // If configuring a command, dynamically wrap in navigation item with hierarchical path
  const renderedItems = React.useMemo(() => {
    if (!configuringCommand) return navigationItems;

    const scopePath = configuringCommand.id.startsWith("notebook.global")
      ? "Global"
      : configuringCommand.id.startsWith("notebook.editor")
        ? "Global / Cell / Editor"
        : "Global / Cell";

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

  return (
    <PanelNavigation
      isOpen={isOpen}
      onClose={() => {
        setConfiguringCommand(null);
        onClose();
      }}
      anchorEl={anchorEl}
      placement="bottom-end"
      title="Global Commands"
      items={renderedItems}
      initialItemId={configuringCommand ? `config-${configuringCommand.id}` : null}
      onNavigateBack={() => setConfiguringCommand(null)}
      className="!min-w-[340px] !max-w-[380px]"
    >
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/60 mb-2">
          <PublicRounded sx={{ fontSize: 14 }} />
          <span>Global Shortcuts</span>
        </div>
        <CommandList
          commands={GLOBAL_COMMANDS}
          bindings={bindings}
          onConfigure={(cmd) => setConfiguringCommand(cmd)}
        />
      </div>
    </PanelNavigation>
  );
}
