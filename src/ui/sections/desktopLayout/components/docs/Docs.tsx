import React from "react";
import { Footer } from "../footer/Footer";
import type { OperationItem, OperationParam } from "../../../../../types";
import { GITHUB_REPO_URL } from "../../../../../constants";
import { CodeBlock } from "../../../../elements";
import type { DocsProps } from "./types";

const getTypeBadgeClass = (typeStr: string): string => {
  const name = typeStr.toLowerCase();
  if (name.includes("int") || name.includes("uint")) return "text-[#9c9c9c] border-[#1e1e1e]";
  if (name.includes("float") || name.includes("decimal")) return "text-[#9c9c9c] border-[#1e1e1e]";
  if (name.includes("utf8") || name.includes("string")) return "text-[#9c9c9c] border-[#1e1e1e]";
  if (name.includes("bool")) return "text-[#9c9c9c] border-[#1e1e1e]";
  if (name.includes("date") || name.includes("time")) return "text-[#9c9c9c] border-[#1e1e1e]";
  return "text-[#5c5c5c] border-[#1a1a1a]";
};

function renderParamTree(params: OperationParam[], depth = 0): React.ReactNode {
  return (
    <div className={`flex flex-col gap-2 ${depth > 0 ? "pl-4 border-l border-[#1e1e1e]" : ""}`}>
      {params.map((p, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="border border-[#1e1e1e] rounded bg-[#0c0c0c] p-3 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11.5px] text-indigo-300 font-semibold">{p.name}</span>
              {p.type && (
                <span className={`text-[10px] font-mono border rounded px-1.5 py-0.5 ${getTypeBadgeClass(p.type)}`}>
                  {p.type}
                </span>
              )}
              {p.optional && (
                <span className="text-[9px] font-mono text-[#5c5c5c] border border-[#1a1a1a] rounded px-1.5 py-0.5 uppercase">
                  optional
                </span>
              )}
            </div>
            {p.desc && (
              <p className="text-[12px] text-[#9c9c9c] leading-relaxed">{p.desc}</p>
            )}
          </div>
          {p.children && p.children.length > 0 && renderParamTree(p.children, depth + 1)}
        </div>
      ))}
    </div>
  );
}

function buildParamTree(flatParams: OperationParam[]): OperationParam[] {
  const root: OperationParam[] = [];
  const map: Record<string, OperationParam & { children: OperationParam[] }> = {};

  flatParams.forEach(p => {
    const isOptional = p.name.startsWith("[") && p.name.endsWith("]");
    const cleanName = p.name.replace(/^\[|\]$/g, "");
    map[cleanName] = {
      ...p,
      name: cleanName,
      optional: isOptional || p.optional,
      children: []
    };
  });

  flatParams.forEach(p => {
    const cleanName = p.name.replace(/^\[|\]$/g, "");
    const parts = cleanName.split(".");
    if (parts.length === 1) {
      root.push(map[cleanName]);
    } else {
      const parentName = parts.slice(0, -1).join(".");
      const parent = map[parentName];
      if (parent) {
        const childBaseName = parts[parts.length - 1];
        map[cleanName].name = childBaseName;
        parent.children.push(map[cleanName]);
      } else {
        root.push(map[cleanName]);
      }
    }
  });

  return root;
}

export function Docs({ op, activeVersion }: DocsProps) {
  if (!op) {
    return (
      <main className="flex-grow overflow-y-auto p-12 bg-[#060606] h-full flex justify-center min-w-0 select-text">
        <div className="w-full max-w-2xl flex flex-col gap-8 pb-20">
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20 select-none">
            <span className="text-4xl">🔎</span>
            <h1 className="text-xl text-white font-medium uppercase font-outfit">Operation Not Found</h1>
            <p className="text-xs text-[#5c5c5c]">Please select a valid DataFrame or ColumnExpression operation from the left sidebar explorer.</p>
          </div>
          <Footer className="mt-12" />
        </div>
      </main>
    );
  }

  let fullPath = "";
  let importStatement = `import { $df } from "df-script"`;

  if (op.category === "DataFrame") {
    fullPath = `df${op.name}`;
  } else if (op.category === "ColumnExpression") {
    if (op.name.startsWith("$df.")) {
      fullPath = op.name;
    } else if (op.name.startsWith("col") || op.name.startsWith("all")) {
      fullPath = `$df.${op.name}`;
    } else if (op.name.startsWith(".")) {
      fullPath = `$df.col(<column_name>)${op.name}`;
    } else {
      fullPath = `$df.${op.name}`;
    }
  } else if (op.category === "DataType") {
    fullPath = `$df.DataType.${op.name}`;
  } else if (op.category === "Exception") {
    fullPath = op.name;
    importStatement = `import { ${op.name} } from "df-script"`;
  }

  const combinedExamples = op.examples ? op.examples.join("\n\n") : "";

  return (
    <main className="flex-grow overflow-y-auto p-12 bg-[#060606] h-full flex justify-center min-w-0 select-text">
      <div className="w-full max-w-2xl flex flex-col gap-8 pb-20">

        {/* Op header */}
        <div className="flex flex-col gap-3 pb-6 border-b border-[#1a1a1a]">
          <div className="text-[11px] font-mono text-[#8c8c8c] select-none bg-[#0a0a0a] border border-[#1e1e1e]/60 rounded px-3 py-1.5 w-fit">
            {importStatement}
          </div>
          <div className="flex items-center gap-3 mt-1">
            {op.filePath ? (
              <a
                href={`${GITHUB_REPO_URL}/blob/${activeVersion}/src/${op.filePath}${op.lineStart ? `#L${op.lineStart}` : ""}`}
                target="_blank"
                rel="noreferrer"
                className="transition-colors group"
                title="View Source on GitHub"
              >
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#ffffff] group-hover:text-indigo-400 group-hover:underline decoration-indigo-400/30 font-mono lowercase transition-colors">
                  {fullPath}
                </h1>
              </a>
            ) : (
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#ffffff] font-mono lowercase">
                {fullPath}
              </h1>
            )}
            <span className="px-2 py-0.5 rounded border border-[#2e2e2e] text-[9px] font-mono text-[#9c9c9c] uppercase bg-[#0c0c0c] select-none shrink-0">
              {op.category}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#5c5c5c] select-none uppercase tracking-wider">
            <span>df-script API REFERENCE</span>
          </div>
        </div>

        {/* Signature */}
        {op.signature && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
              Signature
            </h2>
            <CodeBlock
              code={op.signature}
              className="text-[11.5px] text-[#dcdcdc] whitespace-pre-wrap"
            />
          </section>
        )}

        {/* Description */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
            Description
          </h2>
          <p className="text-[13px] leading-relaxed text-[#9c9c9c]">{op.desc}</p>
        </section>

        {/* Parameters */}
        {op.params && op.params.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
              Parameters
            </h2>
            {renderParamTree(buildParamTree(op.params))}
          </section>
        )}

        {/* Returns */}
        {op.returns && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
              Returns
            </h2>
            <div className="border border-[#1e1e1e] rounded bg-[#0c0c0c] p-4">
              <span className="font-mono text-[11.5px] text-emerald-400 font-semibold">
                {op.returns}
              </span>
            </div>
          </section>
        )}

        {/* Syntax */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
            Syntax
          </h2>
          <CodeBlock
            code={op.syntax}
            className="text-[11px] text-indigo-300 whitespace-pre"
          />
        </section>

        {/* Examples */}
        {op.examples && op.examples.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
              examples
            </h2>
            <CodeBlock
              code={combinedExamples}
              className="text-[11px] text-[#8c8c8c] whitespace-pre"
            />
          </section>
        )}

        <Footer className="mt-12" />
      </div>
    </main>
  );
}
