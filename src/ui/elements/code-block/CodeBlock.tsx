import React from "react";
import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard";
import type { CodeBlockProps } from "./types";

export function CodeBlock({
  code,
  language = "typescript",
  className = "",
  unstyled = false,
}: CodeBlockProps) {
  const { copy, isCopied } = useCopyToClipboard();
  const id = React.useId();
  const copied = isCopied(id);

  if (unstyled) {
    return (
      <div className="relative group w-full">
        <pre className={`font-mono overflow-x-auto select-text leading-relaxed ${className}`}>
          {code}
        </pre>
      </div>
    );
  }

  return (
        <div className="article-code-card relative group rounded-xl bg-surface overflow-hidden flex flex-col w-full border-0">
          <div className="px-5 pt-3.5 pb-2 text-xs font-medium text-zinc-400 select-none tracking-wide flex items-center justify-between bg-surface">
            <span>{language.toLowerCase()}</span>
            <span className="text-[10px] text-zinc-500">df-script</span>
          </div>
            <div className="px-5 py-3 overflow-x-auto bg-surface">
              <pre
                className={`!bg-transparent !p-0 !m-0 !border-0 text-[12.5px] leading-[1.45] text-zinc-200 whitespace-pre overflow-visible select-text ${className}`}
                style={{
                  fontFamily: "'Roboto Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace",
                  fontVariantNumeric: "tabular-nums",
                  fontFeatureSettings: "'tnum'",
                }}
              >
                <code className="!bg-transparent !p-0 !border-0 !text-inherit">{code}</code>
              </pre>
            </div>
              <div className="flex items-center justify-between px-5 py-2.5 bg-surface select-none text-[11px] text-zinc-500">
                <span className="text-zinc-500">Run directly in-memory</span>
                <button
                  type="button"
                  onClick={() => copy(code, id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer select-none text-[11px] ${copied ? "text-emerald-400" : "text-zinc-400 hover:text-white"
                    }`}
                  title="Copy code"
                >
                  <svg
                    className="w-3.5 h-3.5 fill-current"
                    viewBox="0 0 24 24"
                    focusable="false"
                    aria-hidden="true"
                  >
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>
            );
}
