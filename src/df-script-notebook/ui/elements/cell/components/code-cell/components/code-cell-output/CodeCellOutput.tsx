import React from "react";
import { DataFrame } from "df-script";
import { IconButton, CircularProgress } from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { CodeCellOutputProps, VariableDisplayItem } from "./types";
import { hasCellOutput } from "../../utils";
import { DFDataGrid, Carousel } from "@elements";
import { getVariableDisplayItems } from "./utils";


import VariableCarouselHeader from "./components/variable-carousel-header/VariableCarouselHeader";


interface DOMNodeRendererProps {
  node: HTMLElement | SVGElement;
}

const DOMNodeRenderer = ({ node }: DOMNodeRendererProps) => {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = "";
      ref.current.appendChild(node);
    }
  }, [node]);
  return <div ref={ref} className="w-full h-full overflow-auto" />;
};

function _renderVisualizerItem(item: VariableDisplayItem) {
  const isDataFrame = item.value instanceof DataFrame;
  const isDomNode =
    typeof HTMLElement !== "undefined" &&
    (item.value instanceof HTMLElement || item.value instanceof SVGElement);

  if (item.isConsole) {
    return (
      <div className="bg-[var(--cell-bg-logs)] p-3 rounded-xl font-mono text-[11px] text-[var(--cell-text-logs)] flex flex-col gap-1 overflow-x-auto grow min-h-0 max-h-96 overflow-y-auto">
        {(item.value as string[]).map((log: string, i: number) => (
          <div key={i} className="whitespace-pre-wrap leading-relaxed">
            {log}
          </div>
        ))}
      </div>
    );
  }

  if (isDataFrame) {
    return (
      <div className="overflow-hidden bg-transparent border-0 rounded-none grow min-h-0 min-w-0 flex flex-col w-full h-full">
        <DFDataGrid
          data={(item.value as DataFrame).toDicts() as Record<string, unknown>[]}
          className="w-full h-full grow min-h-0 min-w-0"
        />
      </div>
    );
  }

  if (isDomNode) {
    return (
      <div className="bg-[var(--cell-bg-dom)] p-3 rounded-xl min-h-[140px] grow overflow-auto flex items-center justify-center">
        <DOMNodeRenderer node={item.value as HTMLElement | SVGElement} />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl bg-[var(--cell-bg-card)] grow min-h-0 flex flex-col">
      <div className="p-3.5 font-mono text-[11px] text-[var(--cell-text-output)] overflow-x-auto grow overflow-y-auto">
        <pre className="m-0 leading-relaxed font-inherit">
          {typeof item.value === "object" && item.value !== null
            ? JSON.stringify(
                item.value,
                (_, v) => (typeof v === "bigint" ? v.toString() + "n" : v),
                2
              )
            : String(item.value)}
        </pre>
      </div>
    </div>
  );
}

export function CodeCellOutput({
  cell,
  onToggleOutputCollapse,
  copiedCellId,
  onCopyCell,
}: CodeCellOutputProps) {
  if (cell.type === "markdown" || !hasCellOutput(cell)) return null;

  const items = React.useMemo(() => getVariableDisplayItems(cell), [cell]);
  const [selectedVarIndex, setSelectedVarIndex] = React.useState<number | null>(null);

  // If a cell produces variables as well as logs, default to the primary data variable (index 1)
  const defaultIndex = React.useMemo(() => {
    if (items.length === 0) return 0;
    if (items.length > 1 && items[0].isConsole) {
      return 1;
    }
    return 0;
  }, [items]);

  const activeIndex =
    items.length === 0
      ? 0
      : Math.min(
          Math.max(0, selectedVarIndex !== null ? selectedVarIndex : defaultIndex),
          items.length - 1
        );

  const activeItem = items[activeIndex] || null;

  if (cell.isOutputCollapsed) {
    return (
      <div className="mt-2.5 flex items-center justify-between bg-[var(--cell-bg-collapsed)] hover:bg-[var(--cell-bg-collapsed-hover)] px-3.5 py-2 rounded-xl text-[11px] font-mono text-[var(--cell-text-muted)] select-none transition-colors">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--cell-indicator-neutral)]" />
          Output hidden ({cell.error ? "Execution Error" : (cell.output instanceof DataFrame ? "DataFrame Object" : "Raw Value")})
        </span>
        <IconButton
          size="small"
          onClick={() => onToggleOutputCollapse(cell.id)}
          sx={{
            width: 26,
            height: 26,
            color: "var(--nb-text-muted)",
            "&:hover": { color: "var(--nb-text-primary)", backgroundColor: "var(--nb-bg-hover)" },
          }}
        >
          <ExpandMore sx={{ fontSize: 16 }} />
        </IconButton>
      </div>
    );
  }

  const isDataFrame = activeItem?.value instanceof DataFrame;
  const isDomNode =
    typeof HTMLElement !== "undefined" &&
    (activeItem?.value instanceof HTMLElement || activeItem?.value instanceof SVGElement);
  const canCopy = Boolean(activeItem?.value && !isDataFrame && !isDomNode);

  const status: "running" | "error" | "success" =
    cell.timeTaken === "..."
      ? "running"
      : cell.error
        ? "error"
        : "success";

  return (
    <div className="flex flex-col grow min-h-0 relative group/output h-full">
      {/* 1. Variable Carousel Header at the very top */}
      {activeItem && (
        <VariableCarouselHeader
          items={items}
          activeIndex={activeIndex}
          onSelectIndex={setSelectedVarIndex}
          status={status}
          canCopy={canCopy}
          copied={copiedCellId === cell.id}
          onCopy={() => onCopyCell(cell.id)}
        />
      )}

      {/* 2. Error Banner */}
      {cell.error && (
        <div className="mt-1.5 bg-[var(--cell-bg-error)] border border-rose-500/20 p-3 rounded-xl font-mono text-[11px] text-[var(--cell-text-error)] flex flex-col gap-1 overflow-x-auto shrink-0">
          <span className="font-bold text-rose-300">Execution Error:</span>
          <span className="whitespace-pre-wrap leading-relaxed">{cell.error}</span>
        </div>
      )}

      {/* 3. Running Indicator */}
      {cell.timeTaken === "..." && (
        <div className="mt-1.5 bg-[var(--cell-bg-running)] border border-white/[0.04] p-6 rounded-xl flex items-center justify-center gap-3 text-[11px] font-mono text-[var(--cell-accent-blue)] shrink-0">
          <CircularProgress size={16} sx={{ color: "var(--cell-accent-blue)" }} />
          <span>Processing script execution...</span>
        </div>
      )}

      {/* 4. Active Visualizer Stage - generic Carousel element */}
      {items.length > 0 && (
        <Carousel
          activeIndex={activeIndex}
          items={items}
          renderSlide={_renderVisualizerItem}
          className="mt-1.5 grow"
        />
      )}
    </div>
  );
}

export default CodeCellOutput;
