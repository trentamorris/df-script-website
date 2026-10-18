import React from "react";
import { DriveFileMoveOutlined, Add, CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";
import { Chip } from "../../../../chip/Chip";
import { useCellContext } from "../../../hooks/useCellContext";
import { useGridCanvas } from "../../../../grid-canvas/hooks/useGridCanvas";
import PanelNavigation from "../../../../panel-navigation/PanelNavigation";
import { NavigationPanelItem } from "../../../../panel-navigation/types";

export function CellMoveToCanvasButton() {
  const { cell } = useCellContext();
  let gridCanvas: ReturnType<typeof useGridCanvas> | null = null;
  try {
    gridCanvas = useGridCanvas();
  } catch {
    gridCanvas = null;
  }

  const [isOpen, setIsOpen] = React.useState(false);
  const [isCopy, setIsCopy] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  if (!gridCanvas) {
    return null;
  }

  const { pages = [], activePageId, onMoveCellToCanvas } = gridCanvas;

  const handleMoveOrCopy = (targetPageId?: string, createNewCanvas = false) => {
    onMoveCellToCanvas?.({
      cellId: cell.id,
      targetPageId,
      isCopy,
      createNewCanvas,
    });
    setIsOpen(false);
  };

  const menuItems: NavigationPanelItem[] = [
    // Excel-style "Create a copy" toggle item
    {
      id: "copy-mode-toggle",
      label: "Create a copy",
      icon: isCopy ? (
        <CheckBox sx={{ fontSize: 16 }} className="text-[var(--panel-nav-accent)]" />
      ) : (
        <CheckBoxOutlineBlank sx={{ fontSize: 16 }} className="opacity-60" />
      ),
      className: `!border-b !border-[var(--nb-border-default)] !mb-1 !pb-2 ${isCopy ? "!text-[var(--panel-nav-accent)] font-medium" : ""
        }`,
      onClick: () => setIsCopy((prev) => !prev),
    },
    // Target Canvases list
    ...pages.map((page) => {
      const isCurrent = page.id === activePageId;
      // In Excel, you CAN copy onto the same sheet (creates a duplicate), but moving to the same sheet is a no-op
      const isDisabled = isCurrent && !isCopy;
      return {
        id: page.id,
        label: page.title,
        rightElement: isCurrent ? (
          <span className="text-[10px] text-[var(--nb-text-muted)] uppercase tracking-wider font-mono">
            Current
          </span>
        ) : undefined,
        disabled: isDisabled,
        onClick: () => handleMoveOrCopy(page.id, false),
      };
    }),
    // New Canvas action
    {
      id: "new-canvas",
      label: "New Canvas...",
      icon: <Add sx={{ fontSize: 16 }} />,
      className: "!border-t !border-[var(--nb-border-default)] !mt-1 !pt-2",
      onClick: () => handleMoveOrCopy(undefined, true),
    },
  ];

  return (
    <>
      <Chip
        ref={buttonRef}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        title="Move or Copy to Canvas..."
        className={`!h-7 !w-7 !p-0 !rounded-md !flex !items-center !justify-center ${isOpen
            ? "!bg-[rgba(var(--rgb-blue),0.2)] !text-[rgb(var(--rgb-blue))] !border-[rgba(var(--rgb-blue),0.4)]"
            : ""
          }`}
      >
        <DriveFileMoveOutlined sx={{ fontSize: 16 }} />
      </Chip>

      <PanelNavigation
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        anchorEl={buttonRef.current}
        placement="bottom-end"
        title={isCopy ? "Copy Cell to Canvas" : "Move Cell to Canvas"}
        items={menuItems}
      />
    </>
  );
}

