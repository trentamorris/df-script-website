import React from "react";
import {
  AddRounded,
  PlaylistPlayRounded,
  DeleteSweepRounded,
  RefreshRounded,
  SaveRounded,
  FolderOpenRounded,
  Edit,
  Description,
  AutoAwesomeMosaicRounded,
  ViewStreamRounded,
  KeyboardCommandKeyRounded,
  UndoRounded,
  RedoRounded,
} from "@mui/icons-material";
import { ScrollableCanvas } from "../../../../ui/elements";
import { Chip } from "../../elements";
import { CELL_TYPES } from "../../../constants";
import { CellType } from "../../../types";
import { NotebookHeaderProps } from "./types";
import NotebookHeaderCommandsPanel from "./components/notebook-header-commands-panel/NotebookHeaderCommandsPanel";

export default function NotebookHeader({
  notebookName,
  isEditingName,
  layoutMode,
  onSetNotebookName,
  onSetIsEditingName,
  onAddCell,
  onRunAll,
  onClearOutputs,
  onResetNotebook,
  onSaveNotebook,
  onTriggerLoadNotebook,
  onToggleLayoutMode,
  onFileChange,
  fileInputRef,
  bindings,
  onUpdateBinding,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isCommandsOpen: controlledIsCommandsOpen,
  onToggleCommands,
}: NotebookHeaderProps) {
  const isCanvas = layoutMode === "canvas";
  const [internalCommandsAnchorEl, setInternalCommandsAnchorEl] = React.useState<HTMLElement | null>(null);
  const isCommandsOpen = controlledIsCommandsOpen !== undefined ? controlledIsCommandsOpen : Boolean(internalCommandsAnchorEl);
  const commandsAnchorEl = internalCommandsAnchorEl || (isCommandsOpen ? document.getElementById("notebook-commands-btn") : null);


  return (
    <div className="sticky top-0 bg-[var(--nb-bg-app)] z-30 w-full flex items-center justify-between py-2 px-4 md:px-6 select-none shrink-0">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Notebook Title Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <Description sx={{ fontSize: 18, color: "var(--nb-text-muted)" }} />
          {isEditingName ? (
            <input
              type="text"
              value={notebookName}
              onChange={(e) => onSetNotebookName(e.target.value)}
              onBlur={() => onSetIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSetIsEditingName(false);
              }}
              autoFocus
              className="bg-[var(--nb-bg-hover)] border border-[var(--nb-border-strong)] rounded-lg px-2.5 py-1 text-[var(--nb-text-primary)] font-mono text-xs focus:outline-none focus:border-[var(--nb-border-focus)]"
            />
          ) : (
            <div
              onClick={() => onSetIsEditingName(true)}
              className="text-xs font-mono font-medium text-[var(--nb-text-secondary)] hover:text-[var(--nb-text-primary)] cursor-pointer transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[var(--nb-bg-raised)]"
            >
              <span>{notebookName}</span>
              <Edit sx={{ fontSize: 13, color: "var(--nb-text-subtle)" }} />
            </div>
          )}
        </div>

        {/* Carousel + View Mode Toggle */}
        <div className="min-w-0 flex-1 flex items-center justify-end gap-2">
          <ScrollableCanvas
            gap={8}
            className="w-full min-w-0"
            arrowBackgroundColor="var(--nb-bg-app)"
            arrowColor="var(--nb-text-heading)"
          >
            {CELL_TYPES.map(({ type, label }: { type: CellType; label: string }) => (
              <Chip key={type} onClick={() => onAddCell(type)}>
                <AddRounded sx={{ fontSize: 16 }} />
                <span>{label}</span>
              </Chip>
            ))}

            <div className="w-[1px] h-4 bg-[var(--nb-border-strong)] mx-1 shrink-0" />

            <Chip onClick={onRunAll}>
              <PlaylistPlayRounded sx={{ fontSize: 18 }} />
              <span>Run All</span>
            </Chip>

            <Chip onClick={onClearOutputs}>
              <DeleteSweepRounded sx={{ fontSize: 16 }} />
              <span>Clear Outputs</span>
            </Chip>

            <Chip onClick={onResetNotebook}>
              <RefreshRounded sx={{ fontSize: 16 }} />
              <span>Reset</span>
            </Chip>

            {onUndo && (
              <Chip
                onClick={onUndo}
                className={canUndo === false ? "opacity-40 pointer-events-none" : ""}
              >
                <UndoRounded sx={{ fontSize: 16 }} />
                <span>Undo</span>
              </Chip>
            )}

            {onRedo && (
              <Chip
                onClick={onRedo}
                className={canRedo === false ? "opacity-40 pointer-events-none" : ""}
              >
                <RedoRounded sx={{ fontSize: 16 }} />
                <span>Redo</span>
              </Chip>
            )}

            <Chip onClick={onSaveNotebook}>
              <SaveRounded sx={{ fontSize: 16 }} />
              <span>Save</span>
            </Chip>

            <Chip onClick={onTriggerLoadNotebook}>
              <FolderOpenRounded sx={{ fontSize: 16 }} />
              <span>Load</span>
            </Chip>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              accept=".dfnb"
              className="hidden"
            />
          </ScrollableCanvas>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 pl-2 shrink-0 border-l border-white/[0.12]">
            <Chip
              onClick={onToggleLayoutMode}
              variant={isCanvas ? "active" : "default"}
            >
              {isCanvas ? (
                <AutoAwesomeMosaicRounded sx={{ fontSize: 15 }} />
              ) : (
                <ViewStreamRounded sx={{ fontSize: 15 }} />
              )}
              <span>{isCanvas ? "Canvas" : "Document"}</span>
            </Chip>

            {/* Commands & Keybindings Trigger */}
            <Chip
              id="notebook-commands-btn"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (onToggleCommands) {
                  onToggleCommands(isCommandsOpen ? null : e.currentTarget);
                } else {
                  setInternalCommandsAnchorEl(internalCommandsAnchorEl ? null : e.currentTarget);
                }
              }}
              variant={isCommandsOpen ? "active" : "default"}
              title="View all notebook commands & keybindings"
            >
              <KeyboardCommandKeyRounded sx={{ fontSize: 15 }} />
              <span>Commands</span>
            </Chip>

            <NotebookHeaderCommandsPanel
              isOpen={isCommandsOpen}
              onClose={() => {
                if (onToggleCommands) {
                  onToggleCommands(null);
                } else {
                  setInternalCommandsAnchorEl(null);
                }
              }}
              anchorEl={commandsAnchorEl}
              bindings={bindings}
              onUpdateBinding={onUpdateBinding}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

