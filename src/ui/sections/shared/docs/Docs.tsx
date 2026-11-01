import React from "react";
import type { OperationItem, OperationParam, TypeDefinitionItem } from "../../../../types";
import { GITHUB_REPO_URL } from "../../../../constants";
import { CodeBlock, ArticleCanvas } from "../../../elements";
import type { ArticleNavSection } from "../../../elements";
import type { DocsProps } from "./types";
import { KeyboardArrowDown, KeyboardArrowRight, ContentCopy, Check } from "@mui/icons-material";

const getTypeBadgeClass = (typeStr: string): string => {
  const name = typeStr.toLowerCase();
  if (name.includes("int") || name.includes("uint")) return "text-zinc-300 bg-[#1e1f20]";
  if (name.includes("float") || name.includes("decimal")) return "text-zinc-300 bg-[#1e1f20]";
  if (name.includes("utf8") || name.includes("string")) return "text-zinc-300 bg-[#1e1f20]";
  if (name.includes("bool")) return "text-zinc-300 bg-[#1e1f20]";
  if (name.includes("date") || name.includes("time")) return "text-zinc-300 bg-[#1e1f20]";
  return "text-[#8c8c8c] bg-[#1e1f20]";
};

/**
 * YouTube-style thread item with curved branch connector:
 * A vertical spine running down from the bottom center of the parent avatar,
 * with curved lines turning horizontally into each child avatar.
 */
function TypeThreadItem({
  typeName,
  typesMap,
  activeVersion,
  expandedMap,
  onToggle,
  depth = 0,
  isLast = false,
}: {
  typeName: string;
  typesMap: Record<string, TypeDefinitionItem>;
  activeVersion: string;
  expandedMap: Record<string, boolean>;
  onToggle: (name: string) => void;
  depth?: number;
  isLast?: boolean;
}) {
  const typeDef = typesMap[typeName];
  if (!typeDef) return null;

  const isExpanded = Boolean(expandedMap[typeName]);
  const hasChildren = typeDef.subTypes && typeDef.subTypes.length > 0;

  const isInterface = Boolean(
    typeDef.signature &&
      (typeDef.signature.trim().startsWith("export interface") ||
        typeDef.signature.trim().startsWith("interface"))
  );
  const badgeLetter = isInterface ? "I" : "T";

  return (
    <div className="relative flex flex-col">
      {/* Main Comment / Type Entry Row */}
      <div className="flex items-start gap-3 relative group">
        {/* Vertical spine running directly from bottom of this avatar circle (top-[30px]) 
            across the FULL height of this entire row (including the expanded code block) 
            into the child container (-bottom-3) */}
        {hasChildren && isExpanded && (
          <div
            className="absolute left-[13.5px] top-[30px] -bottom-3 w-[1px] bg-zinc-700/60 pointer-events-none"
          />
        )}

        {/* Avatar column */}
        <div className="relative shrink-0 mt-0.5">
          <button
            onClick={() => onToggle(typeName)}
            className="w-7 h-7 rounded-full bg-[#202225] border border-white/10 hover:border-white/20 flex items-center justify-center shrink-0 cursor-pointer select-none transition-colors relative z-10 text-zinc-400 hover:text-zinc-200"
            title={isInterface ? "Interface" : "Type Alias"}
          >
            <span className="text-[11px] font-mono font-bold">{badgeLetter}</span>
          </button>
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Header line: name + arrow toggle pill, and source link */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => onToggle(typeName)}
              className="inline-flex items-center gap-1.5 px-3 py-1 -ml-1 rounded-full bg-transparent hover:bg-[#272727] text-zinc-100 cursor-pointer select-none transition-colors group/pill press-fdbk"
            >
              <span className="font-mono text-[13px] font-semibold text-white truncate">
                {typeName}
              </span>
              <span className={`text-zinc-300 group-hover/pill:text-white flex items-center transition-transform duration-200 ease-out ${isExpanded ? "rotate-90" : "rotate-0"}`}>
                <KeyboardArrowRight className="!text-[22px]" />
              </span>
            </button>

            {typeDef.filePath && (
              <a
                href={`${GITHUB_REPO_URL}/blob/${activeVersion}/src/${typeDef.filePath}${typeDef.lineStart ? `#L${typeDef.lineStart}` : ""}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-mono text-zinc-500 hover:text-indigo-400 underline decoration-zinc-700 transition-colors shrink-0"
              >
                {typeDef.filePath.split("/").pop()}
                {typeDef.lineStart ? `:${typeDef.lineStart}` : ""}
              </a>
            )}
          </div>

          {/* Expanded Code Body (smooth height + fade, reusing CodeBlock) */}
          <div
            className={`grid transition-all duration-200 ease-out ${
              isExpanded ? "grid-rows-[1fr] opacity-100 mt-2 mb-2" : "grid-rows-[0fr] opacity-0 mt-0 mb-0 pointer-events-none"
            }`}
          >
            <div className="overflow-hidden">
              <CodeBlock code={typeDef.signature} language="typescript" />
            </div>
          </div>
        </div>
      </div>

      {/* Nested Replies / Sub-types (smooth height + fade) */}
      {hasChildren && (
        <div
          className={`grid transition-all duration-200 ease-out ${
            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
          }`}
        >
          <div className="overflow-hidden">
            <div className="relative flex flex-col gap-3 pt-3 pl-10">
              {typeDef.subTypes.map((sub, idx) => {
                const isSubLast = idx === typeDef.subTypes.length - 1;
                return (
                  <div key={sub} className="relative">
                    {/* Curved branch turning horizontally into this child's avatar */}
                    <div
                      className="absolute -left-[26.5px] top-0 w-[26.5px] h-[16px] border-b border-l border-zinc-700/60 rounded-bl-xl pointer-events-none"
                    />
                    {/* Vertical spine continuation only if NOT the last child of this parent */}
                    {!isSubLast && (
                      <div
                        className="absolute -left-[26.5px] top-[16px] bottom-0 w-[1px] bg-zinc-700/60 pointer-events-none"
                      />
                    )}
                    <TypeThreadItem
                      typeName={sub}
                      typesMap={typesMap}
                      activeVersion={activeVersion}
                      expandedMap={expandedMap}
                      onToggle={onToggle}
                      depth={depth + 1}
                      isLast={isSubLast}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderParamTree(
  params: OperationParam[],
  typesMap: Record<string, TypeDefinitionItem> = {},
  activeVersion: string,
  expandedTypes: Record<string, boolean>,
  toggleType: (name: string) => void,
  depth = 0
): React.ReactNode {
  return (
    <div className={`flex flex-col gap-2.5 ${depth > 0 ? "pl-4 border-l border-white/[0.07]" : ""}`}>
      {params.map((p, i) => {
        const cleanType = (p.type || "").replace(/[<>[\]?]/g, " ").trim().split(/\s+/)[0];
        const isKnownType = Boolean(cleanType && typesMap[cleanType]);

        return (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="rounded-xl bg-[#141516] px-4 py-3.5 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[12px] text-indigo-300 font-semibold">{p.name}</span>
                {p.type && (
                  <span
                    onClick={() => isKnownType && toggleType(cleanType)}
                    className={`text-[10px] font-mono rounded-md px-2 py-0.5 ${getTypeBadgeClass(p.type)} ${isKnownType ? "cursor-pointer hover:underline hover:text-indigo-300" : ""}`}
                    title={isKnownType ? `Click to toggle ${cleanType} in Types` : undefined}
                  >
                    {p.type}
                  </span>
                )}
                {p.optional && (
                  <span className="text-[9px] font-mono text-[#7c7c7c] bg-white/[0.04] rounded-md px-1.5 py-0.5 uppercase">
                    optional
                  </span>
                )}
                {p.default !== undefined && (
                  <span className="text-[9px] font-mono text-zinc-400 bg-white/[0.04] rounded-md px-1.5 py-0.5">
                    default: {p.default}
                  </span>
                )}
              </div>
              {p.desc && (
                <p className="text-[12.5px] text-[#9c9c9c] leading-relaxed">{p.desc}</p>
              )}
            </div>

            {p.children && p.children.length > 0 && renderParamTree(p.children, typesMap, activeVersion, expandedTypes, toggleType, depth + 1)}
          </div>
        );
      })}
    </div>
  );
}

function buildParamTree(flatParams: OperationParam[]): OperationParam[] {
  const root: OperationParam[] = [];
  const map: Record<string, OperationParam & { children: OperationParam[] }> = {};

  flatParams.forEach((p) => {
    const isOptional = p.name.startsWith("[") && p.name.endsWith("]");
    const cleanName = p.name.replace(/^\[|\]$/g, "");
    map[cleanName] = {
      ...p,
      name: cleanName,
      optional: isOptional || p.optional,
      children: [],
    };
  });

  flatParams.forEach((p) => {
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

export function Docs({ op, activeVersion, typesMap = {} }: DocsProps) {
  const [expandedTypes, setExpandedTypes] = React.useState<Record<string, boolean>>({});

  const toggleType = React.useCallback((name: string) => {
    setExpandedTypes((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  }, []);

  const relevantTypes = React.useMemo(() => {
    if (!op || !op.subTypes) return [];
    return op.subTypes.filter((t) => Boolean(typesMap[t]));
  }, [op, typesMap]);

  const sections = React.useMemo<ArticleNavSection[]>(() => {
    if (!op) return [];
    const items: ArticleNavSection[] = [];
    items.push({ id: "overview", title: "Overview", level: 2 });
    if (op.desc) items.push({ id: "description", title: "Description", level: 2 });
    if (op.signature) items.push({ id: "signature", title: "Signature", level: 2 });
    if (op.params && op.params.length > 0) items.push({ id: "parameters", title: "Parameters", level: 2 });
    if (op.returns) items.push({ id: "returns", title: "Returns", level: 2 });
    if (relevantTypes.length > 0) items.push({ id: "types", title: "Types", level: 2 });
    if (op.syntax) items.push({ id: "syntax", title: "Syntax", level: 2 });
    if (op.examples && op.examples.length > 0) items.push({ id: "examples", title: "Examples", level: 2 });
    return items;
  }, [op, relevantTypes]);

  if (!op) {
    return (
      <ArticleCanvas showToc={false}>
        <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-20 select-none">
          <span className="text-4xl">🔎</span>
          <h1 className="text-xl text-white font-medium uppercase font-outfit">Operation Not Found</h1>
          <p className="text-xs text-[#5c5c5c]">
            Please select a valid DataFrame or ColumnExpression operation from the left sidebar explorer.
          </p>
        </div>
      </ArticleCanvas>
    );
  }

  let fullPath = "";
  let importStatement = `import { $df } from "df-script"`;

  if (op.category === "DataFrame") {
    fullPath = `df${op.name}`;
  } else if (op.category === "Function") {
    fullPath = op.name.startsWith("$df.") ? op.name : `$df.${op.name}`;
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

  const header = (
    <div id="overview" className="flex flex-col gap-3 pb-2 min-w-0 scroll-mt-6">
      <div className="text-[11px] font-mono text-zinc-300 select-none bg-[#141516] rounded-lg px-3 py-1.5 w-fit">
        {importStatement}
      </div>
      <div className="flex items-center mt-1 min-w-0">
        {op.filePath ? (
          <a
            href={`${GITHUB_REPO_URL}/blob/${activeVersion}/src/${op.filePath}${op.lineStart ? `#L${op.lineStart}` : ""}`}
            target="_blank"
            rel="noreferrer"
            className="transition-colors group min-w-0 max-w-full"
            title="View Source on GitHub"
          >
            <h1 className="text-base md:text-lg font-semibold tracking-tight text-[#ffffff] group-hover:text-indigo-400 group-hover:underline decoration-indigo-400/30 font-mono lowercase transition-colors break-all">
              {fullPath}
            </h1>
          </a>
        ) : (
          <h1 className="text-base md:text-lg font-semibold tracking-tight text-[#ffffff] font-mono lowercase break-all min-w-0 max-w-full">
            {fullPath}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2.5 text-[10px] font-mono text-[#6c6c6c] select-none uppercase tracking-wider">
        <span>df-script API REFERENCE</span>
        <span className="px-2 py-0.5 rounded-md text-[9px] font-mono text-zinc-400 uppercase bg-[#141516] select-none shrink-0 tracking-normal">
          {op.category}
        </span>
      </div>
    </div>
  );

  return (
    <ArticleCanvas
      sections={sections}
      showToc={sections.length > 0}
      hasActiveDocOp={true}
      headerSlot={header}
    >
      {/* Description */}
      {op.desc && (
        <section id="description" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
            Description
          </h2>
          <p className="text-[13px] leading-relaxed text-[#9c9c9c]">{op.desc}</p>
        </section>
      )}

      {/* Signature */}
      {op.signature && (
        <section id="signature" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
            Signature
          </h2>
          <CodeBlock code={op.signature} className="text-[#dcdcdc] whitespace-pre-wrap" />
        </section>
      )}

      {/* Parameters */}
      {op.params && op.params.length > 0 && (
        <section id="parameters" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
            Parameters
          </h2>
          {renderParamTree(buildParamTree(op.params), typesMap, activeVersion, expandedTypes, toggleType)}
        </section>
      )}

      {/* Returns */}
      {op.returns && (
        <section id="returns" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
            Returns
          </h2>
          <div className="rounded-xl bg-[#141516] px-4 py-3.5">
            <span className="font-mono text-[12px] text-emerald-400 font-semibold">{op.returns}</span>
          </div>
        </section>
      )}

      {/* Types Section (YouTube comment style tree) */}
      {relevantTypes.length > 0 && (
        <section id="types" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
            Types
          </h2>
          <div className="flex flex-col gap-4">
            {relevantTypes.map((tName) => (
              <TypeThreadItem
                key={tName}
                typeName={tName}
                typesMap={typesMap}
                activeVersion={activeVersion}
                expandedMap={expandedTypes}
                onToggle={toggleType}
              />
            ))}
          </div>
        </section>
      )}

      {/* Syntax */}
      {op.syntax && (
        <section id="syntax" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
            Syntax
          </h2>
          <CodeBlock code={op.syntax} className="text-indigo-300 whitespace-pre" />
        </section>
      )}

      {/* Examples */}
      {op.examples && op.examples.length > 0 && (
        <section id="examples" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
            Examples
          </h2>
          <CodeBlock code={combinedExamples} className="text-[#dcdcdc] whitespace-pre" />
        </section>
      )}
    </ArticleCanvas>
  );
}
