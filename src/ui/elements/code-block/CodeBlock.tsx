import React from "react";
import { ContentCopy, Check } from "@mui/icons-material";
import { useCopyToClipboard } from "../../../hooks/useCopyToClipboard";
import type { CodeBlockProps } from "./types";

export function CodeBlock({ code, className = "", unstyled = false }: CodeBlockProps) {
  const { copy, isCopied } = useCopyToClipboard();
  const id = React.useId();

  const containerClass = unstyled
    ? "relative group w-full"
    : "relative border border-[#1e1e1e] rounded bg-[#0c0c0c] p-4 flex flex-col gap-3 group";

  return (
    <div className={containerClass}>
      <pre className={`font-mono overflow-x-auto select-text leading-relaxed ${className}`}>
        {code}
      </pre>
      <button
        onClick={() => copy(code, id)}
        className="absolute top-3 right-3 p-1.5 rounded bg-[#060606] hover:bg-[#111] border border-[#1e1e1e] text-[#9c9c9c] hover:text-[#ffffff] transition-all opacity-0 group-hover:opacity-100 cursor-pointer select-none flex items-center justify-center"
        title="Copy code"
      >
        {isCopied(id) ? (
          <Check style={{ fontSize: 13 }} className="text-emerald-400" />
        ) : (
          <ContentCopy style={{ fontSize: 13 }} />
        )}
      </button>
    </div>
  );
}
