import { marked } from "marked";
import type { ArticleNavSection } from "./types";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function parseMarkdownSections(markdown: string): {
  html: string;
  sections: ArticleNavSection[];
} {
  const sections: ArticleNavSection[] = [];
  const renderer = new marked.Renderer();

  let currentH2 = "";

  renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
    const cleanTitle = text.replace(/<[^>]*>/g, "").trim();
    const id = slugify(cleanTitle);

    if (depth === 2) {
      currentH2 = id;
      sections.push({ id, title: cleanTitle, level: 2 });
    } else if (depth === 3 && currentH2) {
      sections.push({ id, title: cleanTitle, level: 3 });
    }

    return `<h${depth} id="${id}">${text}</h${depth}>`;
  };

  renderer.link = ({ href, title, text }: { href: string; title?: string | null; text: string }) => {
    const titleAttr = title ? ` title="${title}"` : "";
    const isAnchor = href.startsWith("#");
    if (isAnchor) {
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    }
    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  renderer.table = (token) => {
    let headerHtml = "";
    if (token.header) {
      headerHtml = "<thead><tr>";
      for (const cell of token.header) {
        headerHtml += `<th>${marked.parseInline(cell.text)}</th>`;
      }
      headerHtml += "</tr></thead>";
    }

    let rowsHtml = "";
    if (token.rows) {
      rowsHtml = "<tbody>";
      for (const row of token.rows) {
        rowsHtml += "<tr>";
        for (const cell of row) {
          rowsHtml += `<td>${marked.parseInline(cell.text)}</td>`;
        }
        rowsHtml += "</tr>";
      }
      rowsHtml += "</tbody>";
    }

    return `<table>${headerHtml}${rowsHtml}</table>`;
  };

  renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
    const languageLabel = (lang || "typescript").toLowerCase();
    const encodedCode = encodeURIComponent(text);
    const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return `
      <div class="relative group my-5 rounded-2xl bg-[#1e1f20] shadow-xl overflow-hidden flex flex-col w-full">
        <div class="px-5 pt-3.5 pb-2 text-xs font-medium text-zinc-400 select-none tracking-wide flex items-center justify-between">
          <span>${languageLabel}</span>
          <span class="text-[10px] text-zinc-500">df-script</span>
        </div>
        <div class="px-5 py-3 overflow-x-auto bg-[#1e1f20]">
          <pre class="!bg-transparent !p-0 !m-0 !border-0 text-[12.5px] leading-[1.45] text-zinc-200 whitespace-pre overflow-visible" style="font-family: 'Roboto Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';"><code class="!bg-transparent !p-0 !border-0 !text-inherit">${escapedText}</code></pre>
        </div>
        <div class="flex items-center justify-between px-5 py-2.5 bg-[#18191a] select-none text-[11px] text-zinc-500">
          <span class="text-zinc-500">Run directly in-memory</span>
          <button
            type="button"
            data-copy-code="${encodedCode}"
            class="about-copy-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer select-none text-[11px]"
            title="Copy code"
          >
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path>
            </svg>
            <span class="copy-label">Copy</span>
          </button>
        </div>
      </div>
    `;
  };

  const html = marked.parse(markdown, { renderer, gfm: true, breaks: true }) as string;
  return { html, sections };
}
