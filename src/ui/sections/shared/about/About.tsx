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

  let currentH2 = "";

  renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
    const cleanTitle = text.replace(/<[^>]*>/g, "").trim();
    const id = _slugify(cleanTitle);

    if (depth === 2) {
      currentH2 = cleanTitle;
      if (id && cleanTitle) {
        sections.push({
          id,
          title: cleanTitle,
          level: depth,
        });
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      }
    } else if (depth === 3) {
      // Index H3 subsections under Column Expressions in the navigation sidebar
      if (currentH2.toLowerCase().includes("column expression") && id && cleanTitle) {
        sections.push({
          id,
          title: cleanTitle,
          level: depth,
        });
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      }
      if (id) {
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      }
    }
    return `<h${depth}>${text}</h${depth}>`;
  };

  renderer.hr = () => "";

  renderer.link = ({ href, text }: { href: string; text: string }) => {
    // If it's a relative link to LICENSE (or contains LICENSE), render as plain text without an anchor tag
    if (href && href.replace(/^\.?\//, "").toUpperCase() === "LICENSE") {
      return text;
    }
    // For standard external links, open safely in new tab
    if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
    // For other relative repo files like DONATIONS.md, point to GitHub or render text
    return `<a href="${href}">${text}</a>`;
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
      // If user has scrolled all the way to the bottom, activate the final section
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <= 30;
      if (isAtBottom && sections.length > 0) {
        setActiveSectionId(sections[sections.length - 1].id);
        return;
      }

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
      {/* Main Content Area */}
      <div
        ref={contentContainerRef}
        className="flex-grow overflow-y-auto py-8 scroll-smooth relative"
      >
        {/* Floating Left Sidebar (Fixed from page left, hides on screens < 1280px) */}
        {sections.length > 0 && !isLoading && (
          <aside className="hidden xl:block fixed top-24 left-8 2xl:left-14 w-52 z-10 select-none">
            <nav aria-label="Table of contents" className="flex flex-col gap-1">
              <ul className="flex flex-col gap-1">
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

        {/* Centered Main Article Body */}
        <div className="w-full max-w-4xl mx-auto px-6 md:px-12 flex flex-col gap-8 pb-20">
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
                  className="flex flex-col gap-4 text-text-muted leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-white [&_h1]:font-outfit [&_h1]:mt-4 [&_h1]:scroll-mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:font-outfit [&_h2]:mt-8 [&_h2]:scroll-mt-6 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:font-outfit [&_h3]:mt-6 [&_h3]:scroll-mt-6 [&_p]:mb-2 [&_p_strong]:text-white [&_p_code]:font-mono [&_p_code]:text-[12px] [&_p_code]:text-zinc-200 [&_p_code]:bg-[#141414] [&_p_code]:border [&_p_code]:border-white/10 [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:rounded [&_pre]:bg-[#0c0c0c] [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre_code]:font-mono [&_pre_code]:text-[12px] [&_pre_code]:leading-[1.25] [&_pre_code]:tracking-normal [&_pre_code]:whitespace-pre [&_code]:font-mono [&_code]:text-[12px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_li]:text-text-muted [&_li_strong]:text-white [&_li_code]:font-mono [&_li_code]:text-[12px] [&_li_code]:text-zinc-200 [&_li_code]:bg-[#141414] [&_li_code]:border [&_li_code]:border-white/10 [&_li_code]:px-1.5 [&_li_code]:py-0.5 [&_li_code]:rounded [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border-dark [&_th]:p-2.5 [&_th]:text-left [&_th]:text-white [&_th]:text-xs [&_th:first-child]:w-60 [&_td]:border [&_td]:border-border-dark [&_td]:p-2.5 [&_td]:text-xs [&_td:first-child]:whitespace-nowrap [&_td:first-child]:font-mono [&_hr]:hidden [&_a]:text-white [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
            </section>

            <Footer className="pt-8" />
          </div>
      </div>
    </main>
  );
}
