import { marked } from "marked";
import { MarkdownRendererProps } from "./types";

export default function MarkdownRenderer({ text }: MarkdownRendererProps) {
  if (!text.trim()) {
    return <p className="text-xs text-[var(--nb-text-muted)] italic select-none">Empty markdown cell. Click to edit.</p>;
  }

  try {
    const rawHtml = marked.parse(text, {
      gfm: true,
      breaks: true,
    });

    const htmlString = typeof rawHtml === "string" ? rawHtml : "";

    return (
      <div
        className="prose prose-invert max-w-none select-text p-1 text-xs text-[var(--nb-text-secondary)] leading-relaxed [&_h1]:text-base [&_h1]:font-bold [&_h1]:text-[var(--nb-text-primary)] [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:text-[var(--nb-text-primary)] [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-[var(--nb-text-primary)] [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:text-xs [&_li]:text-[var(--nb-text-secondary)] [&_p]:mb-1.5 [&_pre]:bg-[var(--nb-bg-code)] [&_pre]:p-2.5 [&_pre]:rounded-xl [&_pre]:text-[10.5px] [&_pre]:font-mono [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:text-[var(--nb-text-heading)] [&_code]:bg-[var(--nb-bg-hover)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[10px] [&_code]:font-mono [&_code]:text-emerald-400"
        dangerouslySetInnerHTML={{ __html: htmlString }}
      />
    );
  } catch (e) {
    return <p className="text-xs text-rose-400">Failed to render markdown: {String(e)}</p>;
  }
}
