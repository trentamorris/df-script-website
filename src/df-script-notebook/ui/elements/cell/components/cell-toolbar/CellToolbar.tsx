import React from "react";
import {
  Undo,
  Redo,
  RotateLeft,
  ViewColumnOutlined,
  ViewStreamOutlined,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Check,
  Visibility,
  VisibilityOff,
  Code,
  Description,
  Close,
  OpenInFull,
  CloseFullscreen,
  DriveFileMoveOutlined,
} from "@mui/icons-material";
import { useCellContext } from "../../hooks/useCellContext";
import { ResponsiveCluster, ResponsiveClusterItem, ResponsiveToolbarItem } from "../../../responsive-cluster";
import { CellDragHandle } from "./modules/CellDragHandle";
import { CellIndexBadge } from "./modules/CellIndexBadge";
import { CellTypeChip } from "./modules/CellTypeChip";
import {
  CellCoordinatesChip,
  CellDimensionsChip,
  CellLayoutSettingsPanel,
  createCellLayoutItems,
} from "./modules/CellLayoutChips";
import { CellMarkdownRenderButton } from "./modules/CellMarkdownRenderButton";
import { CellVisibilityButton } from "./modules/CellVisibilityButton";
import { CellUndoButton, CellRedoButton } from "./modules/CellHistoryButtons";
import { CellResetButton } from "./modules/CellResetButton";
import { CellSplitOrientationButton } from "./modules/CellSplitOrientationButton";
import { CellMoveUpButton, CellMoveDownButton } from "./modules/CellReorderButtons";
import { CellDeleteButton } from "./modules/CellDeleteButton";
import { CellFullscreenButton } from "./modules/CellFullscreenButton";
import { CellMoveToCanvasButton } from "./modules/CellMoveToCanvasButton";

export interface CellToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

export const CellToolbar = React.forwardRef<HTMLDivElement, CellToolbarProps>(
  ({ children, className = "", onPointerDown, ...props }, ref) => {
    const {
      cell,
      index,
      totalCells,
      isGridCanvasMode,
      currentLayout,
      gridConfig,
      onUpdateLayout,
      onChangeCellType,
      onDelete,
      keybindings,
      handleMovePointerDown,
      editorInstanceRef,
      onUndo,
      onRedo,
      onClearOutput,
      onToggleSplitOrientation,
      onToggleCodeCollapse,
      onMoveUp,
      onMoveDown,
      isFullscreen,
      onToggleFullscreen,
    } = useCellContext();

    const isResetEnabled = Boolean(
      cell.output || cell.logs?.length || cell.error || cell.timeTaken
    );
    const isHorizontal = cell.splitOrientation === "horizontal";

    // Right action buttons cluster (align: "end")
    const actionButtons: ResponsiveToolbarItem[] = React.useMemo(() => {
      if (cell.type === "markdown") {
        const list: ResponsiveToolbarItem[] = [
          {
            id: "undo",
            align: "end",
            priority: 4,
            label: "Undo",
            icon: <Undo sx={{ fontSize: 16 }} />,
            element: <CellUndoButton />,
            onClick: () => {
              if (editorInstanceRef.current) {
                editorInstanceRef.current.trigger("toolbar", "undo", null);
                editorInstanceRef.current.focus();
              } else if (onUndo) {
                onUndo();
              }
            },
          },
          {
            id: "redo",
            align: "end",
            priority: 4,
            label: "Redo",
            icon: <Redo sx={{ fontSize: 16 }} />,
            element: <CellRedoButton />,
            onClick: () => {
              if (editorInstanceRef.current) {
                editorInstanceRef.current.trigger("toolbar", "redo", null);
                editorInstanceRef.current.focus();
              } else if (onRedo) {
                onRedo();
              }
            },
          },
        ];

        if (!isGridCanvasMode) {
          list.push(
            {
              id: "move-down",
              align: "end",
              priority: 3,
              label: "Move Down",
              icon: <KeyboardArrowDown sx={{ fontSize: 16 }} />,
              element: <CellMoveDownButton />,
              disabled: index === totalCells - 1,
              onClick: () => onMoveDown(index),
            },
            {
              id: "move-up",
              align: "end",
              priority: 3,
              label: "Move Up",
              icon: <KeyboardArrowUp sx={{ fontSize: 16 }} />,
              element: <CellMoveUpButton />,
              disabled: index === 0,
              onClick: () => onMoveUp(index),
            }
          );
        }

        if (!cell.isCodeCollapsed) {
          list.push({
            id: "render-markdown",
            align: "end",
            priority: 5,
            label: "Render Markdown",
            icon: <Check sx={{ fontSize: 16 }} />,
            element: <CellMarkdownRenderButton />,
            onClick: () => onToggleCodeCollapse(cell.id),
          });
        }

        if (isGridCanvasMode) {
          list.push({
            id: "move-to-canvas",
            align: "end",
            showAsAction: "ifRoom",
            priority: 4,
            label: "Move to Canvas...",
            icon: <DriveFileMoveOutlined sx={{ fontSize: 16 }} />,
            element: <CellMoveToCanvasButton />,
          });
        }

        list.push({
          id: "fullscreen",
          align: "end",
          showAsAction: "ifRoom",
          priority: 4,
          label: isFullscreen ? "Exit Fullscreen" : "Fullscreen",
          icon: isFullscreen ? <CloseFullscreen sx={{ fontSize: 16 }} /> : <OpenInFull sx={{ fontSize: 16 }} />,
          element: <CellFullscreenButton />,
          onClick: () => onToggleFullscreen?.(),
        });

        list.push({
          id: "delete",
          align: "end",
          showAsAction: "ifRoom",
          priority: 5,
          label: "Delete Cell",
          icon: <Close sx={{ fontSize: 16 }} />,
          element: <CellDeleteButton />,
          onClick: () => onDelete(cell.id),
        });

        return list;
      }

      // Code cell items:
      const list: ResponsiveToolbarItem[] = [
        {
          id: "split-orientation",
          align: "end",
          priority: 5,
          label: isHorizontal ? "Vertical Stack" : "Side-by-side Layout",
          icon: isHorizontal ? (
            <ViewStreamOutlined sx={{ fontSize: 16 }} />
          ) : (
            <ViewColumnOutlined sx={{ fontSize: 16 }} />
          ),
          element: <CellSplitOrientationButton />,
          onClick: () => onToggleSplitOrientation?.(cell.id),
        },
      ];

      if (!isGridCanvasMode) {
        list.push(
          {
            id: "move-down",
            align: "end",
            priority: 3,
            label: "Move Down",
            icon: <KeyboardArrowDown sx={{ fontSize: 16 }} />,
            element: <CellMoveDownButton />,
            disabled: index === totalCells - 1,
            onClick: () => onMoveDown(index),
          },
          {
            id: "move-up",
            align: "end",
            priority: 3,
            label: "Move Up",
            icon: <KeyboardArrowUp sx={{ fontSize: 16 }} />,
            element: <CellMoveUpButton />,
            disabled: index === 0,
            onClick: () => onMoveUp(index),
          }
        );
      }

      list.push(
        {
          id: "undo",
          align: "end",
          priority: 4,
          label: "Undo",
          icon: <Undo sx={{ fontSize: 16 }} />,
          element: <CellUndoButton />,
          onClick: () => {
            if (editorInstanceRef.current) {
              editorInstanceRef.current.trigger("toolbar", "undo", null);
              editorInstanceRef.current.focus();
            } else if (onUndo) {
              onUndo();
            }
          },
        },
        {
          id: "redo",
          align: "end",
          priority: 4,
          label: "Redo",
          icon: <Redo sx={{ fontSize: 16 }} />,
          element: <CellRedoButton />,
          onClick: () => {
            if (editorInstanceRef.current) {
              editorInstanceRef.current.trigger("toolbar", "redo", null);
              editorInstanceRef.current.focus();
            } else if (onRedo) {
              onRedo();
            }
          },
        },
        {
          id: "reset",
          align: "end",
          priority: 2,
          label: "Clear Output",
          icon: <RotateLeft sx={{ fontSize: 16 }} />,
          element: <CellResetButton />,
          disabled: !isResetEnabled,
          onClick: () => onClearOutput?.(cell.id),
        },
        ...(isGridCanvasMode
          ? [
              {
                id: "move-to-canvas",
                align: "end" as const,
                showAsAction: "ifRoom" as const,
                priority: 4,
                label: "Move to Canvas...",
                icon: <DriveFileMoveOutlined sx={{ fontSize: 16 }} />,
                element: <CellMoveToCanvasButton />,
              },
            ]
          : []),
        {
          id: "fullscreen",
          align: "end",
          showAsAction: "ifRoom",
          priority: 4,
          label: isFullscreen ? "Exit Fullscreen" : "Fullscreen",
          icon: isFullscreen ? <CloseFullscreen sx={{ fontSize: 16 }} /> : <OpenInFull sx={{ fontSize: 16 }} />,
          element: <CellFullscreenButton />,
          onClick: () => onToggleFullscreen?.(),
        },
        {
          id: "delete",
          align: "end",
          showAsAction: "ifRoom",
          priority: 5,
          label: "Delete Cell",
          icon: <Close sx={{ fontSize: 16 }} />,
          element: <CellDeleteButton />,
          onClick: () => onDelete(cell.id),
        }
      );

      return list;
    }, [
      cell.type,
      cell.isCodeCollapsed,
      cell.splitOrientation,
      cell.id,
      isGridCanvasMode,
      isResetEnabled,
      isHorizontal,
      index,
      totalCells,
      editorInstanceRef,
      onUndo,
      onRedo,
      onClearOutput,
      onToggleSplitOrientation,
      onToggleCodeCollapse,
      onMoveUp,
      onMoveDown,
      onDelete,
      isFullscreen,
      onToggleFullscreen,
    ]);

    // Left chips cluster (align: "start")
    const leftChips: ResponsiveToolbarItem[] = React.useMemo(() => {
      const list: ResponsiveToolbarItem[] = [
        {
          id: "switch-cell-type",
          align: "start",
          priority: 20,
          label: cell.type === "markdown" ? "Switch to Code" : "Switch to Markdown",
          icon: cell.type === "markdown" ? <Code sx={{ fontSize: 16 }} /> : <Description sx={{ fontSize: 16 }} />,
          element: <CellTypeChip />,
          onClick: () => onChangeCellType?.(cell.id, cell.type === "markdown" ? "code" : "markdown"),
        },
      ];

      if (isGridCanvasMode && currentLayout) {
        list.push({
          id: "layout-position",
          align: "start",
          priority: 19,
          label: "Position",
          value: `x:${currentLayout.x} y:${currentLayout.y} z:${currentLayout.z ?? 1}`,
          subPanel: null,
          element: <CellCoordinatesChip />,
        });
        list.push({
          id: "layout-size",
          align: "start",
          priority: 18,
          label: "Size",
          value: `${currentLayout.w} × ${currentLayout.h}`,
          subPanel: null,
          element: <CellDimensionsChip />,
        });
      }

      return list;
    }, [
      isGridCanvasMode,
      currentLayout,
      cell.type,
      cell.id,
      onChangeCellType,
    ]);

    const toolbarItems: ResponsiveToolbarItem[] = React.useMemo(
      () => [...leftChips, ...actionButtons],
      [leftChips, actionButtons]
    );

    return (
      <div
        ref={ref}
        onPointerDown={(e) => {
          onPointerDown?.(e);
          const target = e.target as HTMLElement | null;
          const isInteractive = target?.closest(
            'button, input, [role="button"], [role="menuitem"], [role="menu"], [role="dialog"], .pointer-events-auto, [tabindex]'
          );
          if (isGridCanvasMode && handleMovePointerDown && !isInteractive) {
            handleMovePointerDown(e);
          }
        }}
        className={`flex items-center justify-between mb-3 select-none pl-1 w-full gap-2 ${isGridCanvasMode ? "cursor-grab active:cursor-grabbing touch-none" : ""
          } ${className}`}
        {...props}
      >
        {children ?? (
          <>
            {/* Permanent left elements: Drag handle & cell index badge */}
            <div className="flex items-center gap-2 shrink-0 pointer-events-auto">
              {isGridCanvasMode && <CellDragHandle />}
              <CellIndexBadge />
            </div>

            {/* Responsive cluster managing left chips, right action buttons, and '...' overflow */}
            <ResponsiveCluster
              items={toolbarItems}
              className="flex-1 min-w-0"
            />
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <CellLayoutSettingsPanel />
            </div>
          </>
        )}
      </div>
    );
  }
);

CellToolbar.displayName = "CellToolbar";

export default CellToolbar;

