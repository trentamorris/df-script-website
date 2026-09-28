import React from "react";
import { Button } from "@mui/material";
import {
  Add,
  PlaylistPlay,
  DeleteSweep,
  RestartAlt,
  Save,
  FolderOpen,
  Edit,
  Description,
  AutoAwesomeMosaic,
  ViewStream,
} from "@mui/icons-material";
import { ScrollableCanvas } from "../../../../ui/elements";
import { CELL_TYPES } from "../../../constants";
import { NotebookHeaderProps } from "./types";
import { TOOLBAR_MUI_PILL } from "./utils";

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
}: NotebookHeaderProps) {
  const isCanvas = layoutMode === "canvas";

  return (
    <div className="sticky top-0 bg-[var(--nb-bg-app)] border-b border-white/[0.06] z-30 w-full flex items-center justify-between py-2 px-4 md:px-6 select-none shrink-0">
      <div className="w-full flex items-center justify-between gap-4">
        {/* Notebook Title Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <Description sx={{ fontSize: 18, color: "rgba(255, 255, 255, 0.55)" }} />
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
              className="bg-white/[0.08] border border-white/[0.15] rounded-lg px-2.5 py-1 text-white font-mono text-xs focus:outline-none focus:border-white/40"
            />
          ) : (
            <div
              onClick={() => onSetIsEditingName(true)}
              className="text-xs font-mono font-medium text-zinc-300 hover:text-white cursor-pointer transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/[0.05]"
            >
              <span>{notebookName}</span>
              <Edit sx={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }} />
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
            {CELL_TYPES.map(({ type, label }: { type: import("../../../types").CellType; label: string }) => (
              <Button
                key={type}
                variant="contained"
                disableElevation
                size="small"
                onClick={() => onAddCell(type)}
                sx={TOOLBAR_MUI_PILL}
                startIcon={<Add sx={{ fontSize: "15px !important" }} />}
              >
                {label}
              </Button>
            ))}

            <div className="w-[1px] h-4 bg-white/[0.12] mx-1 shrink-0" />

            <Button
              variant="contained"
              disableElevation
              size="small"
              onClick={onRunAll}
              sx={TOOLBAR_MUI_PILL}
              startIcon={<PlaylistPlay sx={{ fontSize: "16px !important" }} />}
            >
              Run All
            </Button>

            <Button
              variant="contained"
              disableElevation
              size="small"
              onClick={onClearOutputs}
              sx={TOOLBAR_MUI_PILL}
              startIcon={<DeleteSweep sx={{ fontSize: "15px !important" }} />}
            >
              Clear Outputs
            </Button>

            <Button
              variant="contained"
              disableElevation
              size="small"
              onClick={onResetNotebook}
              sx={TOOLBAR_MUI_PILL}
              startIcon={<RestartAlt sx={{ fontSize: "15px !important" }} />}
            >
              Reset
            </Button>

            <Button
              variant="contained"
              disableElevation
              size="small"
              onClick={onSaveNotebook}
              sx={TOOLBAR_MUI_PILL}
              startIcon={<Save sx={{ fontSize: "15px !important" }} />}
            >
              Save
            </Button>

            <Button
              variant="contained"
              disableElevation
              size="small"
              onClick={onTriggerLoadNotebook}
              sx={TOOLBAR_MUI_PILL}
              startIcon={<FolderOpen sx={{ fontSize: "15px !important" }} />}
            >
              Load
            </Button>

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
            <Button
              variant="contained"
              disableElevation
              size="small"
              onClick={onToggleLayoutMode}
              sx={{
                ...TOOLBAR_MUI_PILL,
                backgroundColor: isCanvas ? "var(--cell-bg-chip-hover)" : "var(--nb-bg-raised)",
                color: isCanvas ? "var(--cell-text-dark)" : "var(--nb-text-primary)",
                "&:hover": {
                  backgroundColor: isCanvas ? "var(--cell-bg-chip-hover)" : "var(--nb-bg-hover)",
                  color: isCanvas ? "var(--cell-text-dark)" : "var(--nb-text-primary)",
                },
              }}
              startIcon={
                isCanvas ? (
                  <AutoAwesomeMosaic sx={{ fontSize: "14px !important" }} />
                ) : (
                  <ViewStream sx={{ fontSize: "14px !important" }} />
                )
              }
            >
              {isCanvas ? "Canvas" : "Document"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
