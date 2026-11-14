import React from "react";
import type { TypeDefinitionItem, TypeTreeNode } from "../../../../types";
import { GITHUB_REPO_URL } from "../../../../constants";
import { CodeBlock, ArticleCanvas, ThreadTree } from "../../../elements";
import type { ArticleNavSection, ThreadTreeNode } from "../../../elements";
import type { DocsProps } from "./types";

const getTypeBadgeClass = (typeStr: string): string => {
  const name = typeStr.toLowerCase();
  if (name.includes("int") || name.includes("uint")) return "text-zinc-300 bg-surface-badge";
  if (name.includes("float") || name.includes("decimal")) return "text-zinc-300 bg-surface-badge";
  if (name.includes("utf8") || name.includes("string")) return "text-zinc-300 bg-surface-badge";
  if (name.includes("bool")) return "text-zinc-300 bg-surface-badge";
  if (name.includes("date") || name.includes("time")) return "text-zinc-300 bg-surface-badge";
  return "text-[#8c8c8c] bg-surface-badge";
};

function _buildTypeThreadNodes(
  entries: [string, TypeTreeNode][],
  typesMap: Record<string, TypeDefinitionItem>,
  activeVersion: string,
  depth = 0,
  parentPath = ""
): ThreadTreeNode<TypeTreeNode>[] {
  return entries.map(([nodeName, node]) => {
    const nodePath = parentPath ? `${parentPath}.${nodeName}` : nodeName;
    const cleanType = (node.type || "").replace(/[<>[\]?]/g, " ").trim().split(/\s+/)[0];
    const typeDef = cleanType ? typesMap[cleanType] : undefined;
    const childEntries = node.properties ? Object.entries(node.properties) : [];
    const hasChildren = childEntries.length > 0;

    const isInterface = Boolean(
      hasChildren ||
      (typeDef?.signature &&
        (typeDef.signature.trim().startsWith("export interface") ||
          typeDef.signature.trim().startsWith("interface")))
    );
    const badgeLetter = depth === 0 ? (isInterface ? "I" : "T") : isInterface ? "I" : "P";
    const badgeTitle =
      depth === 0
        ? isInterface
          ? "Interface / Object Parameter"
          : "Type Parameter"
        : isInterface
          ? "Nested Object Property"
          : "Property";

    const baseName = node.variadic ? `...${nodeName}` : nodeName;
    const displayName = node.optional && !baseName.endsWith("?") ? `${baseName}?` : baseName;

    const displayedType = node.resolvedType || node.type;
    const hasDifferentOriginalType = Boolean(node.resolvedType && node.type && node.resolvedType !== node.type);

    return {
      id: nodePath,
      label: displayName,
      badge: badgeLetter,
      badgeTitle,
      data: node,
      headerMeta: (
        <>
          {displayedType && (
            <span
              title={hasDifferentOriginalType ? `Alias for: ${node.type}` : undefined}
              className={`text-[11px] rounded-md px-2 py-0.5 font-medium ${getTypeBadgeClass(displayedType)}`}
            >
              {displayedType}
            </span>
          )}
          {node.default !== undefined && (
            <span className="text-[10px] text-zinc-400 bg-white/[0.04] rounded-md px-1.5 py-0.5 font-medium">
              default: {node.default}
            </span>
          )}
        </>
      ),
      body: node.desc ? (
        <div className="pt-1 pb-1.5 flex flex-col gap-1.5 pl-0.5">
          <p className="text-[13px] text-zinc-300 leading-relaxed">{node.desc}</p>
        </div>
      ) : undefined,
      children: hasChildren
        ? _buildTypeThreadNodes(childEntries, typesMap, activeVersion, depth + 1, nodePath)
        : undefined,
    };
  });
}

export function Docs({ op, activeVersion, typesMap = {} }: DocsProps) {
  const typeTreeNodes = React.useMemo(() => {
    if (!op || !op.typeTree) return [];
    return _buildTypeThreadNodes(Object.entries(op.typeTree), typesMap, activeVersion);
  }, [op, typesMap, activeVersion]);

  const displayedSignature = op?.signatureDetailed || op?.signature;

  const sections = React.useMemo<ArticleNavSection[]>(() => {
    if (!op) return [];
    const items: ArticleNavSection[] = [];
    items.push({ id: "overview", title: "Overview", level: 2 });
    if (op.desc) items.push({ id: "description", title: "Description", level: 2 });
    if (displayedSignature) items.push({ id: "signature", title: "Signature", level: 2 });
    if (typeTreeNodes.length > 0) items.push({ id: "parameters", title: "Parameters", level: 2 });
    if (op.syntax) items.push({ id: "syntax", title: "Syntax", level: 2 });
    if (op.examples && op.examples.length > 0) items.push({ id: "examples", title: "Examples", level: 2 });
    return items;
  }, [op, displayedSignature, typeTreeNodes]);

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

  const opName = op.callExpression || op.name || "";
  let fullPath = "";
  let importStatement = `import {$df} from "df-script"`;

  if (op.category === "DataFrame") {
    fullPath = `df${opName}`;
  } else if (op.category === "Function") {
    fullPath = opName.startsWith("$df.") ? opName : `$df.${opName}`;
  } else if (op.category === "ColumnExpression") {
    if (opName.startsWith("$df.")) {
      fullPath = opName;
    } else if (opName.startsWith("col") || opName.startsWith("all")) {
      fullPath = `$df.${opName}`;
    } else if (opName.startsWith(".")) {
      fullPath = `$df.col(<column_name>)${opName}`;
    } else {
      fullPath = `$df.${opName}`;
    }
  } else if (op.category === "DataType") {
    fullPath = `$df.DataType.${opName}`;
  } else if (op.category === "Exception") {
    fullPath = opName;
    importStatement = `import {${opName} } from "df-script"`;
  }

  const combinedExamples = op.examples ? op.examples.join("\n\n") : "";

  const header = (
    <div id="overview" className="flex flex-col gap-2.5 pb-2 min-w-0 scroll-mt-6">
      <div className="flex items-center min-w-0">
        {op.filePath ? (
          <a
            href={`${GITHUB_REPO_URL}/blob/${activeVersion}/src/${op.filePath}${op.lineStart ? `#L${op.lineStart}` : ""}`}
            target="_blank"
            rel="noreferrer"
            className="group min-w-0 max-w-full transition-colors"
            title={`View source in src/${op.filePath}`}
          >
            <h1 className="text-xl md:text-2xl font-bold tracking-normal text-[#ffffff] group-hover:text-indigo-400 lowercase transition-colors break-all">
              {fullPath}
            </h1>
          </a>
        ) : (
          <h1 className="text-xl md:text-2xl font-bold tracking-normal text-[#ffffff] lowercase break-all min-w-0 max-w-full">
            {fullPath}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-2.5 text-[10px] text-[#6c6c6c] select-none uppercase tracking-wider font-medium">
        <span>df-script API REFERENCE</span>
        <span className="px-2 py-0.5 rounded-md text-[9px] text-zinc-400 uppercase bg-surface select-none shrink-0 tracking-normal font-medium">
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
      {displayedSignature && (
        <section id="signature" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
            Signature
          </h2>
          <CodeBlock code={displayedSignature} format={false} className="text-[#dcdcdc] whitespace-pre" />
        </section>
      )}

      {/* Parameters (YouTube comment style tree) */}
      {typeTreeNodes.length > 0 && (
        <section id="parameters" className="flex flex-col gap-3 scroll-mt-6">
          <h2 className="text-xs font-semibold tracking-widest text-[#ffffff] uppercase font-outfit">
            Parameters
          </h2>
          <ThreadTree
            nodes={typeTreeNodes}
            defaultExpandedAll={true}
          />
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
