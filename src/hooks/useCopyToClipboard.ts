import React from "react";

export function useCopyToClipboard(duration = 1500) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => { setCopiedId(null); }, duration);
  };

  const isCopied = (id: string) => copiedId === id;

  return { copy, isCopied };
}
