import React from "react";
import { DataFrame } from "df-script";
import { Button, IconButton, CircularProgress } from "@mui/material";
import { ExpandMore, ChevronRight } from "@mui/icons-material";
import { CellState } from "../../../../../../../types";
import { CELL_MUI_STYLES } from "../../../../utils";
import DataFrameGrid from "../../../../../dataframe-grid/DataFrameGrid";

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

export interface CodeCellOutputProps {
  cell: CellState;
  onToggleOutputCollapse: (id: string) => void;
  copiedCellId: string | null;
  onCopyCell: (id: string) => void;
}

export function CodeCellOutput({
  cell,
  onToggleOutputCollapse,
  copiedCellId,
  onCopyCell,
}: CodeCellOutputProps) {
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

  const hasOutput =
    cell.output !== null ||
    cell.outputNode !== null ||
    (cell.logs && cell.logs.length > 0) ||
    cell.error !== null ||
    cell.timeTaken === "...";

  if (!hasOutput) return null;

  return (
    <div className="mt-1 flex flex-col gap-2 relative group/output">
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] font-mono text-[var(--cell-text-muted)] select-none flex items-center gap-1.5 uppercase tracking-wider font-semibold">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              cell.timeTaken === "..."
                ? "bg-[var(--cell-accent-blue)] animate-pulse"
                : cell.error
                  ? "bg-[var(--cell-accent-rose)]"
                  : "bg-[var(--cell-indicator-success)]"
            }`}
          />
          {cell.timeTaken === "..." ? "Running..." : "Output"}
        </span>
        <div className="flex items-center gap-1">
          {cell.output && !(cell.output instanceof DataFrame) && (
            <Button
              variant="contained"
              disableElevation
              size="small"
              onClick={() => onCopyCell(cell.id)}
              sx={CELL_MUI_STYLES.chipButton}
            >
              {copiedCellId === cell.id ? "Copied" : "Copy Output"}
            </Button>
          )}
          <IconButton
            size="small"
            onClick={() => onToggleOutputCollapse(cell.id)}
            title="Collapse output"
            sx={{
              width: 24,
              height: 24,
              color: "var(--nb-text-muted)",
              "&:hover": { color: "var(--nb-text-primary)", backgroundColor: "var(--nb-bg-hover)" },
            }}
          >
            <ChevronRight sx={{ fontSize: 15 }} />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col gap-2 min-h-0">
        {cell.logs && cell.logs.length > 0 && (
          <div className="bg-[var(--cell-bg-logs)] p-3 rounded-xl border border-white/[0.04] font-mono text-[11px] text-[var(--cell-text-logs)] flex flex-col gap-1 overflow-x-auto max-h-48 overflow-y-auto">
            {cell.logs.map((log: string, i: number) => (
              <div key={i} className="whitespace-pre-wrap leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        )}

        {cell.error && (
          <div className="bg-[var(--cell-bg-error)] border border-rose-500/20 p-3 rounded-xl font-mono text-[11px] text-[var(--cell-text-error)] flex flex-col gap-1 overflow-x-auto">
            <span className="font-bold text-rose-300">Execution Error:</span>
            <span className="whitespace-pre-wrap leading-relaxed">{cell.error}</span>
          </div>
        )}

        {cell.timeTaken === "..." && (
          <div className="bg-[var(--cell-bg-running)] border border-white/[0.04] p-6 rounded-xl flex items-center justify-center gap-3 text-[11px] font-mono text-[var(--cell-accent-blue)]">
            <CircularProgress size={16} sx={{ color: "var(--cell-accent-blue)" }} />
            <span>Processing script execution...</span>
          </div>
        )}

        {cell.outputNode && (
          <div className="bg-[var(--cell-bg-dom)] border border-white/[0.04] p-3 rounded-xl min-h-[140px] max-h-[420px] overflow-auto flex items-center justify-center">
            <DOMNodeRenderer node={cell.outputNode} />
          </div>
        )}

        {cell.output !== null && (
          <div className="overflow-hidden rounded-xl border border-white/[0.04] bg-[var(--cell-bg-card)]">
            {cell.output instanceof DataFrame ? (
              <DataFrameGrid df={cell.output} />
            ) : (
              <div className="p-3.5 font-mono text-[11px] text-[var(--cell-text-output)] overflow-x-auto max-h-60 overflow-y-auto">
                <pre className="m-0 leading-relaxed font-inherit">
                  {typeof cell.output === "object"
                    ? JSON.stringify(
                        cell.output,
                        (_, v) => (typeof v === "bigint" ? v.toString() + "n" : v),
                        2
                      )
                    : String(cell.output)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeCellOutput;
