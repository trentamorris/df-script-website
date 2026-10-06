import React from "react";
import { Chip } from "../../../../chip/Chip";
import { Remove, Add } from "@mui/icons-material";
import PanelNavigation from "../../../../panel-navigation/PanelNavigation";
import { useCellContext } from "../../../hooks/useCellContext";

interface NumericStepperProps {
  val: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}

export function NumericStepper({ val, min, max, onChange }: NumericStepperProps) {
  const [text, setText] = React.useState(String(val));

  React.useEffect(() => {
    setText(String(val));
  }, [val]);

  const commit = (str: string) => {
    const parsed = parseInt(str, 10);
    if (isNaN(parsed)) {
      setText(String(val));
    } else {
      const clamped = Math.max(min, Math.min(max, parsed));
      setText(String(clamped));
      if (clamped !== val) {
        onChange(clamped);
      }
    }
  };

  return (
    <div className="flex items-center gap-1 bg-black/40 rounded-full px-1 py-0.5 border border-white/10">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, val - 1))}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/15 text-[var(--nb-text-muted)] hover:text-white transition-colors cursor-pointer"
      >
        <Remove sx={{ fontSize: 13 }} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          const parsed = parseInt(raw, 10);
          if (!isNaN(parsed)) {
            const clamped = Math.max(min, Math.min(max, parsed));
            onChange(clamped);
          }
        }}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(text);
            (e.target as HTMLInputElement).blur();
          }
        }}
        className="w-8 text-center font-mono text-xs font-semibold text-white bg-transparent outline-none cursor-text focus:bg-white/10 rounded"
      />
      <button
        type="button"
        onClick={() => onChange(Math.min(max, val + 1))}
        className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/15 text-[var(--nb-text-muted)] hover:text-white transition-colors cursor-pointer"
      >
        <Add sx={{ fontSize: 13 }} />
      </button>
    </div>
  );
}

export function CellLayoutSettingsPanel() {
  const {
    isGridCanvasMode,
    currentLayout,
    gridConfig,
    activePanelTab,
    setActivePanelTab,
    positionTabRef,
    dimensionsTabRef,
    onUpdateLayout,
    cell,
  } = useCellContext();

  if (!isGridCanvasMode || !onUpdateLayout || !currentLayout) return null;

  return (
    <PanelNavigation
      isOpen={activePanelTab !== null}
      onClose={() => setActivePanelTab(null)}
      anchorEl={activePanelTab === "size" ? dimensionsTabRef.current : positionTabRef.current}
      placement="bottom-start"
      initialItemId={activePanelTab}
      title="Cell Layout Settings"
      items={[
        {
          id: "position",
          label: "Grid Position (X, Y, Z)",
          value: `${currentLayout.x}, ${currentLayout.y}, ${currentLayout.z ?? 1}`,
          subPanel: (
            <div className="flex flex-col gap-2.5 p-1 select-none">
              {[
                {
                  label: "Column (X)",
                  val: currentLayout.x,
                  min: 0,
                  max: Math.max(0, (gridConfig?.columns ?? 12) - currentLayout.w),
                  onChange: (v: number) => onUpdateLayout(cell.id, { x: v }),
                },
                {
                  label: "Row (Y)",
                  val: currentLayout.y,
                  min: 0,
                  max: Math.max(0, (gridConfig?.rows ?? 24) - currentLayout.h),
                  onChange: (v: number) => onUpdateLayout(cell.id, { y: v }),
                },
                {
                  label: "Layer (Z)",
                  val: currentLayout.z ?? 1,
                  min: 0,
                  max: 100,
                  isAccent: true,
                  onChange: (v: number) => onUpdateLayout(cell.id, { z: v }),
                },
              ].map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between py-1 px-2 rounded-lg bg-[var(--nb-bg-hover)] border border-[var(--nb-border-default)]"
                >
                  <span
                    className={`text-[12px] font-medium ${field.isAccent ? "text-amber-400" : "text-[var(--nb-text-secondary)]"
                      }`}
                  >
                    {field.label}
                  </span>
                  <NumericStepper
                    val={field.val}
                    min={field.min}
                    max={field.max}
                    onChange={field.onChange}
                  />
                </div>
              ))}
            </div>
          ),
        },
        {
          id: "size",
          label: "Dimensions (W, H)",
          value: `${currentLayout.w} × ${currentLayout.h}`,
          subPanel: (
            <div className="flex flex-col gap-2.5 p-1 select-none">
              {[
                {
                  label: "Width (Cols)",
                  val: currentLayout.w,
                  min: 1,
                  max: Math.max(1, (gridConfig?.columns ?? 12) - currentLayout.x),
                  onChange: (v: number) => onUpdateLayout(cell.id, { w: v }),
                },
                {
                  label: "Height (Rows)",
                  val: currentLayout.h,
                  min: 1,
                  max: Math.max(1, (gridConfig?.rows ?? 24) - currentLayout.y),
                  onChange: (v: number) => onUpdateLayout(cell.id, { h: v }),
                },
              ].map((field) => (
                <div
                  key={field.label}
                  className="flex items-center justify-between py-1 px-2 rounded-lg bg-[var(--nb-bg-hover)] border border-[var(--nb-border-default)]"
                >
                  <span className="text-[12px] font-medium text-[var(--nb-text-secondary)]">
                    {field.label}
                  </span>
                  <NumericStepper
                    val={field.val}
                    min={field.min}
                    max={field.max}
                    onChange={field.onChange}
                  />
                </div>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}


export function CellCoordinatesChip() {
  const {
    isGridCanvasMode,
    currentLayout,
    positionTabRef,
    isMoving,
    activePanelTab,
    setActivePanelTab,
  } = useCellContext();

  if (!isGridCanvasMode || !currentLayout) return null;

  return (
    <Chip
      ref={positionTabRef}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        setActivePanelTab(activePanelTab === "position" ? null : "position");
      }}
      className={`!h-7 !px-2.5 !rounded-md !text-[11px] font-sans tracking-wide transition-colors cursor-pointer select-none flex items-center gap-1.5 ${isMoving || activePanelTab === "position"
          ? "!bg-[var(--panel-nav-accent)] !text-black !font-semibold"
          : ""
        }`}
      title="Click to edit grid position (X, Y, Z)"
    >
      <span>x:{currentLayout.x}</span>
      <span>y:{currentLayout.y}</span>
      <span>z:{currentLayout.z ?? 1}</span>
    </Chip>
  );
}

export function CellDimensionsChip() {
  const {
    isGridCanvasMode,
    currentLayout,
    dimensionsTabRef,
    isResizing,
    activePanelTab,
    setActivePanelTab,
  } = useCellContext();

  if (!isGridCanvasMode || !currentLayout) return null;

  return (
    <Chip
      ref={dimensionsTabRef}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        setActivePanelTab(activePanelTab === "size" ? null : "size");
      }}
      className={`!h-7 !px-2.5 !rounded-md !text-[11px] font-sans tracking-wide transition-colors cursor-pointer select-none flex items-center gap-1.5 ${isResizing || activePanelTab === "size"
          ? "!bg-[var(--panel-nav-accent)] !text-black !font-semibold"
          : ""
        }`}
      title="Click to edit cell dimensions (Width, Height)"
    >
      <span>w:{currentLayout.w}</span>
      <span>×</span>
      <span>h:{currentLayout.h}</span>
    </Chip>
  );
}