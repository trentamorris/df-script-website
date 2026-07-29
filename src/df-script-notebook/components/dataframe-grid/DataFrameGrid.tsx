import { DataFrame } from "df-script";

export default function DataFrameGrid({ df }: { df: DataFrame }) {
  const cols = df.columns;
  const schema = df.get_schema();
  const rows = df.to_dicts() as any[];

  const maxRows = 100;
  const isTruncated = rows.length > maxRows;
  const displayedRows = isTruncated ? rows.slice(0, maxRows) : rows;

  const getTypeBadgeClass = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("int") || n.includes("float") || n.includes("num")) return "text-emerald-400 border-emerald-950/30 bg-emerald-950/10";
    if (n.includes("str") || n.includes("char") || n.includes("text")) return "text-sky-400 border-sky-950/30 bg-sky-950/10";
    if (n.includes("bool")) return "text-amber-400 border-amber-950/30 bg-amber-950/10";
    if (n.includes("date") || n.includes("time")) return "text-purple-400 border-purple-950/30 bg-purple-950/10";
    return "text-[(--nb-text-secondary)] border-[(--nb-border-default)] bg-[(--nb-bg-raised)]";
  };

  return (
    <div className="overflow-x-auto select-text w-full max-h-87.5">
      <table className="w-full text-left border-collapse text-[10px] font-mono leading-relaxed">
        <thead>
          <tr className="border-b border-[(--nb-border-default)] bg-[(--nb-bg-surface)] sticky top-0 z-10">
            {cols.map((colName: string) => {
              const typeStr = schema[colName]?.name || "Unknown";
              return (
                <th key={colName} className="p-2 border-r border-[(--nb-border-default-rgb)/60] min-w-20 bg-[(--nb-bg-surface)] select-none">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[(--nb-text-heading)]">{colName}</span>
                    <span className={`inline-block text-[7px] font-bold px-1 rounded border self-start ${getTypeBadgeClass(typeStr)}`}>
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
              <td colSpan={cols.length} className="p-6 text-center text-[(--nb-text-muted)] uppercase select-none">
                EMPTY DATAFRAME (0 ROWS)
              </td>
            </tr>
          ) : (
            displayedRows.map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-[(--nb-border-default-rgb)/40] hover:bg-[(--nb-bg-hover-rgb)/30]">
                {cols.map((colName: string) => {
                  const val = row[colName];
                  return (
                    <td key={colName} className="p-2 border-r border-[(--nb-border-default-rgb)/40] text-[(--nb-text-secondary)] truncate max-w-45">
                      {val === null ? (
                        <span className="text-[(--nb-text-muted)] italic select-none">null</span>
                      ) : typeof val === "object" ? (
                        JSON.stringify(val)
                      ) : (
                        String(val)
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
        <div className="border-t border-[(--nb-border-default-rgb)/60] p-2.5 text-center text-[9px] font-mono text-[(--nb-text-muted)] select-none bg-[(--nb-bg-surface)] sticky bottom-0 uppercase tracking-wide">
          Showing first {maxRows} of {rows.length} rows (Output truncated to preserve browser memory)
        </div>
      )}
    </div>
  );
}
