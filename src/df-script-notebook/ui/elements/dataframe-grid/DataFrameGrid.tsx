import { DataFrameGridProps } from "./types";
import { getTypeBadgeClass, formatCellValue } from "./utils";

export default function DataFrameGrid({ df, maxRows = 100 }: DataFrameGridProps) {
  const cols = df.columns;
  const schema = df.schema;
  const totalRows = df.height;
  const isTruncated = totalRows > maxRows;
  const displayedDf = isTruncated ? df.head(maxRows) : df;
  const displayedRows = displayedDf.toDicts() as Record<string, unknown>[];

  return (
    <div className="overflow-auto select-text w-full flex-1 min-h-0">
      <table className="w-full text-left border-collapse text-[10px] font-mono leading-relaxed">
        <thead>
          <tr className="border-b border-white/[0.08] bg-[var(--nb-bg-surface)] sticky top-0 z-10">
            {cols.map((colName: string) => {
              const typeStr = schema[colName]?.name || "Unknown";
              return (
                <th key={colName} className="p-2.5 border-r border-white/[0.05] min-w-20 bg-[var(--nb-bg-surface)] select-none">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[var(--nb-text-heading)] font-medium">{colName}</span>
                    <span className={`inline-block text-[7.5px] font-bold px-1.5 py-0.2 rounded border self-start ${getTypeBadgeClass(typeStr)}`}>
                      {typeStr.toLowerCase()}
                    </span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {displayedRows.length === 0 ? (
            <tr>
              <td colSpan={cols.length} className="p-6 text-center text-[var(--nb-text-muted)] uppercase select-none">
                EMPTY DATAFRAME (0 ROWS)
              </td>
            </tr>
          ) : (
            displayedRows.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                {cols.map((colName: string) => {
                  const val = row[colName];
                  return (
                    <td key={colName} className="p-2.5 border-r border-white/[0.04] text-[var(--nb-text-secondary)] truncate max-w-45">
                      {val === null ? (
                        <span className="text-[var(--nb-text-muted)] italic select-none">null</span>
                      ) : (
                        formatCellValue(val)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {isTruncated && (
        <div className="border-t border-[var(--nb-border-default)] p-2.5 text-center text-[9px] font-mono text-[var(--nb-text-muted)] select-none bg-[var(--nb-bg-surface)] sticky bottom-0 uppercase tracking-wide">
          Showing first {maxRows} of {totalRows} rows (Output truncated to preserve browser memory)
        </div>
      )}
    </div>
  );
}
