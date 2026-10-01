import React from "react";
import { DataFrame } from "df-script";
import { Button, IconButton, CircularProgress } from "@mui/material";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import { CellState } from "../../../../../types";
import { CELL_MUI_STYLES } from "../../utils";
import DataFrameGrid from "../../../dataframe-grid/DataFrameGrid";

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

export interface CellOutputProps {
  cell: CellState;
  onToggleOutputCollapse: (id: string) => void;
  copiedCellId: string | null;
  onCopyCell: (id: string) => void;
}

export default function CellOutput({
  cell,
  onToggleOutputCollapse,
  copiedCellId,
  onCopyCell,
}: CellOutputProps) {
  if (cell.type === "markdown") return null;

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

  if (cell.timeTaken === "...") {
    return (
      <div className="mt-2.5 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--cell-bg-collapsed)] text-xs font-mono text-[var(--nb-text-secondary)]">
        <CircularProgress size={14} thickness={5} sx={{ color: "var(--cell-accent-blue)" }} />
        <span className="tracking-wide">Executing...</span>
      </div>
    );
  }

  const hasLogs = cell.logs && cell.logs.length > 0;
  const hasError = !!cell.error;
  const hasValue = cell.output !== undefined && cell.output !== null;

  if (!hasLogs && !hasError && !hasValue) return null;

  return (
    <div className="flex flex-col gap-2.5 relative animate-fade-in mt-2.5">
      <div className="absolute top-1.5 right-1.5 z-20">
        <IconButton
          size="small"
          onClick={() => onToggleOutputCollapse(cell.id)}
          title="Collapse Output"
          sx={{
            width: 24,
            height: 24,
            color: "var(--nb-text-subtle)",
            "&:hover": { color: "var(--nb-text-primary)", backgroundColor: "var(--nb-bg-hover)" },
          }}
        >
          <ChevronRight sx={{ fontSize: 16 }} />
        </IconButton>
      </div>

      {hasLogs && (
        <div className="bg-[var(--nb-bg-surface)] text-[var(--nb-text-secondary)] p-3.5 rounded-xl font-mono text-[10.5px] select-text whitespace-pre overflow-x-auto leading-relaxed border-l-2 border-l-[var(--cell-border-log)]">
          <div className="text-[9px] text-[var(--nb-text-muted)] font-bold uppercase tracking-widest mb-1.5 select-none flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--cell-indicator-neutral)]" />
            Console Output
          </div>
          {cell.logs!.join("\n")}
        </div>
      )}

      {hasError && (
        <div className="bg-[var(--cell-bg-error)] text-[var(--cell-text-error)] p-3.5 rounded-xl font-mono text-xs select-text leading-relaxed relative">
          <div className="flex justify-between items-center mb-1.5 select-none">
            <span className="font-bold uppercase tracking-widest text-[9.5px] text-[var(--cell-accent-rose)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--cell-accent-red)] animate-ping" />
              Execution Error
            </span>
            <Button
              variant="contained"
              disableElevation
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(cell.error || "");
                onCopyCell(cell.id);
              }}
              sx={{
                ...CELL_MUI_STYLES.miniPillButton,
                color: "var(--cell-text-error)",
              }}
              title="Copy Error Message"
            >
              {copiedCellId === cell.id ? "Copied" : "Copy"}
            </Button>
          </div>
          <div className="text-[var(--cell-text-error)] font-mono text-[11px] whitespace-pre-wrap">{cell.error}</div>
        </div>
      )}

      {!hasError && hasValue && (() => {
        const val = cell.output;
        if (val instanceof DataFrame) {
          const shapeStr = `${val.height} rows • ${val.columns.length} columns`;
          return (
            <div className="flex flex-col gap-2 h-full min-h-0">
              <div className="flex justify-between items-center text-[10px] font-sans tracking-wide text-[var(--nb-text-muted)] select-none pr-8 shrink-0">
                <span className="px-2 py-0.5 rounded-md bg-[var(--cell-badge-bg)] text-[var(--nb-text-secondary)] font-medium text-[9.5px]">
                  DATAFRAME
                </span>
                <span className="font-mono text-[11px] text-[var(--nb-text-muted)]">{shapeStr}</span>
              </div>
              <div className="rounded-xl bg-[var(--nb-bg-surface)] overflow-hidden select-text flex-1 min-h-0 flex flex-col">
                <DataFrameGrid df={val} />
              </div>
            </div>
          );
        }

        if (val instanceof HTMLElement || val instanceof SVGElement) {
          return (
            <div className="p-3.5 bg-[var(--nb-bg-surface)] rounded-xl overflow-hidden">
              <DOMNodeRenderer node={val} />
            </div>
          );
        }

        if (val && typeof val.toHTML === "function") {
          try {
            const htmlStr = val.toHTML();
            return (
              <div
                className="p-3.5 bg-[var(--nb-bg-surface)] rounded-xl overflow-hidden"
                dangerouslySetInnerHTML={{ __html: htmlStr }}
              />
            );
          } catch (e) {
            console.error("toHTML failed:", e);
          }
        }

        if (React.isValidElement(val)) {
          return (
            <div className="p-3.5 bg-[var(--nb-bg-surface)] rounded-xl overflow-hidden">
              {val}
            </div>
          );
        }

        let displayStr = "";
        if (typeof val === "object") {
          try {
            displayStr = JSON.stringify(val, null, 2);
          } catch {
            displayStr = String(val);
          }
        } else {
          displayStr = String(val);
        }

        return (
          <div className="p-3.5 font-mono text-xs select-text whitespace-pre overflow-x-auto leading-relaxed max-h-75 text-[var(--nb-text-secondary)] bg-[var(--nb-bg-surface)] rounded-xl overflow-hidden">
            {displayStr}
          </div>
        );
      })()}
    </div>
  );
}
