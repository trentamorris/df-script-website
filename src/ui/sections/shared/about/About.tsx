import React from "react";
import { marked } from "marked";
import { Footer } from "../footer/Footer";
import { useGithubReadme } from "../../../../hooks/useGithubHooks";
import type { AboutNavSection } from "./types";

function _slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function _parseSections(markdown: string): { html: string; sections: AboutNavSection[] } {
  const sections: AboutNavSection[] = [];
  const renderer = new marked.Renderer();

  renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
    // Only index major top-level sections (H2) for the sticky sidebar navigation
    if (depth === 2) {
      // Strip any raw HTML tags or emojis from the display title if needed
      const cleanTitle = text.replace(/<[^>]*>/g, "").trim();
      const id = _slugify(cleanTitle);
      if (id && cleanTitle) {
        sections.push({
          id,
          title: cleanTitle,
          level: depth,
        });
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      }
    } else if (depth <= 3) {
      // Keep IDs on H3s so anchor links still function if scrolled to
      const cleanTitle = text.replace(/<[^>]*>/g, "").trim();
      const id = _slugify(cleanTitle);
      if (id) {
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      }
    }
    return `<h${depth}>${text}</h${depth}>`;
  };

  const html = marked.parse(markdown, { renderer, gfm: true, breaks: true }) as string;
  return { html, sections };
}

export function About() {
  const { markdown, isLoading, error } = useGithubReadme();
  const [activeSectionId, setActiveSectionId] = React.useState<string>("");
  const contentContainerRef = React.useRef<HTMLDivElement>(null);

  const { html, sections } = React.useMemo(() => {
    if (!markdown) {
      return { html: "", sections: [] };
    }
    return _parseSections(markdown);
  }, [markdown]);

  // Track the heading nearest to top of viewport as user scrolls
  React.useEffect(() => {
    const container = contentContainerRef.current;
    if (!container || sections.length === 0) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const offsetTop = containerRect.top;

      let currentActive = sections[0]?.id || "";
      for (const section of sections) {
        const el = container.querySelector(`#${CSS.escape(section.id)}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the element has passed or is near the top of the container
          if (rect.top - offsetTop <= 80) {
            currentActive = section.id;
          } else {
            break;
          }
        }
      }
      setActiveSectionId(currentActive);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [sections]);

  const scrollToSection = (id: string) => {
    const container = contentContainerRef.current;
    if (!container) return;
    const targetEl = container.querySelector(`#${CSS.escape(id)}`);
    if (targetEl) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const targetTop = container.scrollTop + (targetRect.top - containerRect.top) - 24;
      container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
      setActiveSectionId(id);
    }
  };

  return (
    <main className="flex-grow flex flex-col h-full bg-[#060606] min-w-0 select-text overflow-hidden">
      {/* Pinned Header: Title & Contributor Credit */}
      <div className="w-full bg-[#060606]/95 backdrop-blur-md z-20 shrink-0 px-6 md:px-12 pt-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between border-b border-border-dark relative">
          <div className="relative pb-3">
            <span className="text-xs font-semibold tracking-widest uppercase font-outfit text-white">
              README
            </span>
            {/* Underline Indicator */}
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
          </div>

          <p className="pb-3 text-[9px] font-mono text-text-dim uppercase tracking-wider select-none hidden sm:block">
            Written by the df-script core contributors
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        ref={contentContainerRef}
        className="flex-grow overflow-y-auto py-8 px-6 md:px-12 scroll-smooth"
      >
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 items-start relative pb-20">
          {/* Sticky Left Sidebar (ChatGPT / OpenAI style table of contents) */}
          {sections.length > 0 && !isLoading && (
            <aside className="hidden lg:block w-64 shrink-0 sticky top-0 self-start pt-1">
              <nav aria-label="Table of contents" className="flex flex-col gap-1 select-none pr-4">
                <span className="text-[10px] font-mono text-text-dim uppercase tracking-wider mb-2">
                  On this page
                </span>
                <ul className="flex flex-col gap-1 border-l border-white/10 pl-3">
                  {sections.map((section) => {
                    const isActive = activeSectionId === section.id;
                    return (
                      <li key={section.id}>
                        <button
                          type="button"
                          onClick={() => scrollToSection(section.id)}
                          className={`text-left text-xs transition-colors duration-150 block w-full truncate py-1 cursor-pointer font-sans ${
                            section.level === 3 ? "pl-3 text-[11px]" : ""
                          } ${
                            isActive
                              ? "text-white font-medium"
                              : "text-text-muted hover:text-white"
                          }`}
                          title={section.title}
                        >
                          {section.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>
          )}

          {/* Main Article Body */}
          <div className="flex-1 min-w-0 flex flex-col gap-8 max-w-3xl">
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider">
                  df-script repository readme
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-dim">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${
                      isLoading
                        ? "bg-amber-400 animate-pulse"
                        : error
                        ? "bg-red-400"
                        : "bg-emerald-400"
                    }`}
                  />
                  <span>
                    {isLoading
                      ? "fetching from github..."
                      : error
                      ? "failed to load"
                      : "synced from github"}
                  </span>
                </div>
              </div>

              {isLoading && (
                <div className="flex flex-col gap-3 py-6 animate-pulse">
                  <div className="h-6 bg-[#111111] rounded w-2/3"></div>
                  <div className="h-4 bg-[#111111] rounded w-full"></div>
                  <div className="h-4 bg-[#111111] rounded w-5/6"></div>
                  <div className="h-4 bg-[#111111] rounded w-3/4"></div>
                  <div className="h-24 bg-[#111111] rounded w-full mt-4"></div>
                </div>
              )}

              {error && (
                <div className="border border-red-950/40 bg-red-950/10 rounded p-4 text-[12px] font-mono text-red-400">
                  {error}
                </div>
              )}

              {html && !isLoading && (
                <div
                  className="flex flex-col gap-4 text-text-muted leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-white [&_h1]:font-outfit [&_h1]:mt-4 [&_h1]:scroll-mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:font-outfit [&_h2]:mt-8 [&_h2]:border-b [&_h2]:border-border-dark [&_h2]:pb-2 [&_h2]:scroll-mt-6 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:font-outfit [&_h3]:mt-6 [&_h3]:scroll-mt-6 [&_p]:mb-2 [&_p_strong]:text-white [&_p_code]:font-mono [&_p_code]:text-[11px] [&_p_code]:text-emerald-400 [&_p_code]:bg-[#111111] [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:rounded [&_pre]:bg-[#0c0c0c] [&_pre]:border [&_pre]:border-border-dark [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_code]:font-mono [&_code]:text-[11px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_li]:text-text-muted [&_li_strong]:text-white [&_li_code]:font-mono [&_li_code]:text-[11px] [&_li_code]:text-emerald-400 [&_li_code]:bg-[#111111] [&_li_code]:px-1.5 [&_li_code]:py-0.5 [&_li_code]:rounded [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border-dark [&_th]:p-2 [&_th]:text-left [&_th]:text-white [&_th]:text-xs [&_td]:border [&_td]:border-border-dark [&_td]:p-2 [&_td]:text-xs [&_hr]:border-border-dark [&_hr]:my-6 [&_a]:text-emerald-400 [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
            </section>

            <Footer className="pt-8" />
          </div>
        </div>
      </div>
    </main>
  );
}
