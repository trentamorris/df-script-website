import React from "react";
import { ContentCopy } from "@mui/icons-material";
import { Footer } from "../footer/Footer";
import type { OperationItem, OperationParam } from "../../../types";

export interface DocsProps {
  op: OperationItem | undefined;
  activeVersion: string;
}

function useCopyToClipboard(duration = 1500) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => { setCopiedId(null); }, duration);
  };

  const isCopied = (id: string) => copiedId === id;

  return { copy, isCopied };
}

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

export function Docs({ op, activeVersion }: DocsProps) {
  const { copy, isCopied } = useCopyToClipboard();

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

  const isCompatible =
    activeVersion === "v1.7.0" ||
    (activeVersion === "v1.6.0" && op.version !== "v1.7.0") ||
    (activeVersion === "v1.5.0" && op.version === "v1.5.0");

  if (!isCompatible) {
    return (
      <main className="flex-grow overflow-y-auto p-12 bg-[#060606] h-full flex justify-center min-w-0 select-text">
        <div className="w-full max-w-2xl flex flex-col gap-8 pb-20">
          <div className="h-full flex flex-col items-center justify-center text-center gap-5 py-20 select-none max-w-md mx-auto">
            <span className="text-3xl text-amber-500 font-mono">⚠️</span>
            <h1 className="text-lg text-white font-medium uppercase font-outfit tracking-wide">Version Compatibility Warning</h1>
            <p className="text-[12px] text-[#8c8c8c] leading-relaxed">
              The operation <code className="text-white font-mono">{op.name}</code> is not supported in version{" "}
              <span className="text-white font-semibold font-mono">{activeVersion}</span>.
            </p>
            <div className="bg-[#0c0c0c] border border-amber-950/30 rounded p-3 text-[11px] font-mono text-amber-500/90 leading-relaxed text-left w-full">
              Introduced in: <span className="text-white font-bold">{op.version}</span>
              <br />
              Current active selector: <span className="text-white font-bold">{activeVersion}</span>
            </div>
            <p className="text-[11px] text-[#5c5c5c] leading-relaxed">
              Please upgrade the active API Explorer version filter to a higher version to view the syntax and execution guidelines.
            </p>
          </div>
          <Footer className="mt-12" />
        </div>
      </main>
    );
  }

  let fullPath = "";
  let importStatement = "";

  if (op.category === "DataFrame") {
    fullPath = `df${op.name}`;
    importStatement = `import { $df } from "df-script"`;
  } else if (op.category === "ColumnExpression") {
    if (op.name.startsWith("$df.")) {
      fullPath = op.name;
    } else if (op.name.startsWith("col") || op.name.startsWith("all")) {
      fullPath = `$df.${op.name}`;
    } else if (op.name.startsWith(".")) {
      fullPath = `$df.col("<column_name>")${op.name}`;
    } else {
      fullPath = `$df.${op.name}`;
    }
    importStatement = `import { $df } from "df-script"`;
  } else if (op.category === "DataType") {
    fullPath = `$df.DataType.${op.name}`;
    importStatement = `import { $df } from "df-script"`;
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
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#ffffff] font-mono lowercase">
              {fullPath}
            </h1>
            <span className="px-2 py-0.5 rounded border border-[#2e2e2e] text-[9px] font-mono text-[#9c9c9c] uppercase bg-[#0c0c0c] select-none shrink-0">
              {op.category}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[#5c5c5c] select-none uppercase tracking-wider">
            <span>df-script API REFERENCE</span>
            <span>•</span>
            <span className="text-[#8c8c8c]">INTRODUCED IN {op.version}</span>
          </div>
        </div>

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
            {renderParamTree(op.params)}
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
          <div className="relative border border-[#1e1e1e] rounded bg-[#0c0c0c] p-4 flex flex-col gap-3">
            <pre className="text-[11px] font-mono text-indigo-300 whitespace-pre overflow-x-auto select-all leading-relaxed">
              {op.syntax}
            </pre>
            <button
              onClick={() => copy(op.syntax, `${op.name}-syntax`)}
              className="absolute top-3 right-3 px-2 py-1 text-[8px] font-mono bg-[#060606] hover:bg-[#111] border border-[#1e1e1e] text-[#9c9c9c] hover:text-[#ffffff] transition-colors cursor-pointer select-none"
            >
              {isCopied(`${op.name}-syntax`) ? "COPIED!" : "COPY"}
            </button>
          </div>
        </section>

        {/* Examples */}
        {op.examples && op.examples.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
              examples
            </h2>
            <div className="relative border border-[#1e1e1e] rounded bg-[#0c0c0c] p-4 flex flex-col gap-3">
              <pre className="text-[11px] font-mono text-[#8c8c8c] whitespace-pre overflow-x-auto select-all leading-relaxed">
                {combinedExamples}
              </pre>
              <button
                onClick={() => copy(combinedExamples, `${op.name}-examples`)}
                className="absolute top-3 right-3 px-2 py-1 text-[8px] font-mono bg-[#060606] hover:bg-[#111] border border-[#1e1e1e] text-[#9c9c9c] hover:text-[#ffffff] transition-colors cursor-pointer select-none"
              >
                {isCopied(`${op.name}-examples`) ? "COPIED!" : "COPY"}
              </button>
            </div>
          </section>
        )}

        <Footer className="mt-12" />
      </div>
    </main>
  );
}
