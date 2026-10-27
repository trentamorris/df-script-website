import React from "react";
import { marked } from "marked";
import { Footer } from "../footer/Footer";
import { useGithubReadme } from "../../../../hooks/useGithubHooks";
import type { AboutNavSection, AboutProps } from "./types";

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

  renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
    const languageLabel = (lang || "typescript").toLowerCase();
    const encodedCode = encodeURIComponent(text);
    const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return `
      <div class="relative group my-5 rounded-2xl bg-[#1e1f20] shadow-xl overflow-hidden flex flex-col font-sans">
        <div class="px-5 pt-3.5 pb-2 text-xs font-mono font-medium text-zinc-400 select-none tracking-wide flex items-center justify-between">
          <span>${languageLabel}</span>
          <span class="text-[10px] text-zinc-500 font-mono">df-script</span>
        </div>
        <div class="px-5 py-3 overflow-x-auto bg-[#1e1f20]">
          <pre class="!bg-transparent !p-0 !m-0 !border-0 text-[12.5px] leading-[1.45] text-zinc-200 whitespace-pre overflow-visible" style="font-family: 'Roboto Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-variant-numeric: tabular-nums; font-feature-settings: 'tnum';"><code class="!bg-transparent !p-0 !border-0 !text-inherit">${escapedText}</code></pre>
        </div>
        <div class="flex items-center justify-between px-5 py-2.5 bg-[#18191a] select-none text-[11px] text-zinc-500 font-sans">
          <span class="text-zinc-500">Run directly in-memory</span>
          <button
            type="button"
            data-copy-code="${encodedCode}"
            class="about-copy-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer select-none text-[11px] font-medium"
            title="Copy code"
          >
            <svg class="w-3.5 h-3.5 stroke-current fill-none" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
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

export function About({ hasActiveDocOp = false }: AboutProps = {}) {
  const { markdown, isLoading, error } = useGithubReadme();
  const [activeSectionId, setActiveSectionId] = React.useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState<boolean>(false);
  const [isExiting, setIsExiting] = React.useState<boolean>(false);
  const contentContainerRef = React.useRef<HTMLDivElement>(null);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);
  const stackedMenuContainerRef = React.useRef<HTMLDivElement>(null);

  const closeMobileMenu = React.useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsMobileMenuOpen(false);
      setIsExiting(false);
    }, 180);
  }, []);

  const toggleMobileMenu = React.useCallback(() => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
    } else {
      setIsExiting(false);
      setIsMobileMenuOpen(true);
    }
  }, [isMobileMenuOpen, closeMobileMenu]);

  const { html, sections } = React.useMemo(() => {
    if (!markdown) {
      return { html: "", sections: [] };
    }
    return _parseSections(markdown);
  }, [markdown]);

  // When mobile menu opens or active section updates while open, smoothly keep the active pill centered
  React.useEffect(() => {
    if (!isMobileMenuOpen || isExiting || !stackedMenuContainerRef.current) return;
    const activeEl = stackedMenuContainerRef.current.querySelector(
      `[data-section-id="${CSS.escape(activeSectionId)}"]`
    ) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [isMobileMenuOpen, isExiting, activeSectionId]);

  // Close mobile TOC menu when clicking outside
  React.useEffect(() => {
    if (!isMobileMenuOpen || isExiting) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        closeMobileMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen, isExiting, closeMobileMenu]);

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

  // Handle copy buttons inside rendered markdown code blocks
  React.useEffect(() => {
    const container = contentContainerRef.current;
    if (!container || !html) return;

    const handleCopyClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".about-copy-btn") as HTMLElement | null;
      if (!target) return;

      const encodedCode = target.getAttribute("data-copy-code");
      if (!encodedCode) return;

      const code = decodeURIComponent(encodedCode);
      navigator.clipboard.writeText(code).then(() => {
        const label = target.querySelector(".copy-label");
        if (label) {
          const originalText = label.textContent;
          label.textContent = "Copied!";
          target.classList.add("text-emerald-400");
          setTimeout(() => {
            label.textContent = originalText;
            target.classList.remove("text-emerald-400");
          }, 1500);
        }
      });
    };

    container.addEventListener("click", handleCopyClick);
    return () => {
      container.removeEventListener("click", handleCopyClick);
    };
  }, [html]);

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
      closeMobileMenu();
    }
  };

  const activeSectionTitle =
    sections.find((s) => s.id === activeSectionId)?.title || "Table of contents";

  return (
    <main className="flex-grow flex flex-col h-full bg-[#060606] min-w-0 select-text overflow-hidden relative">
      {/* Top and Bottom Scroll Edge Shadows */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#060606] to-transparent z-20" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#060606] to-transparent z-20" />

      {/* Main Scrollable Grid Container */}
      <div
        ref={contentContainerRef}
        className="flex-grow overflow-y-auto pt-0 pb-8 px-6 md:px-12 scroll-smooth grid grid-cols-1 xl:grid-cols-10 gap-8"
      >
        {/* Sticky Sidebar: spots 0 to 2 (columns 1-2) */}
        {sections.length > 0 && !isLoading && (
          <aside className="hidden xl:block col-start-1 col-span-2 sticky top-0 self-start select-none pr-4 pt-8">
            <nav aria-label="Table of contents" className="flex flex-col gap-1">
              <ul className="flex flex-col gap-1">
                {sections.map((section) => {
                  const isActive = activeSectionId === section.id;
                  return (
                    <li key={section.id}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(section.id)}
                        className={`text-left text-xs transition-colors duration-150 block w-full truncate py-1 cursor-pointer font-sans ${section.level === 3 ? "pl-3 text-[11px]" : ""
                          } ${isActive
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

        {/* Main Content: spots 2 to 8 (columns 3 to 8, spanning 6 cols), leaving spots 8 to 10 on the right */}
        <div className="col-span-1 xl:col-start-3 xl:col-span-6 min-w-0 flex flex-col gap-8 pt-8 pb-24">
          <section className="flex flex-col gap-4">
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
                className="flex flex-col gap-4 text-text-muted leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-white [&_h1]:font-outfit [&_h1]:mt-4 [&_h1]:scroll-mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:font-outfit [&_h2]:mt-8 [&_h2]:scroll-mt-6 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:font-outfit [&_h3]:mt-6 [&_h3]:scroll-mt-6 [&_p]:mb-2 [&_p_strong]:text-white [&_p_code]:font-mono [&_p_code]:text-[12px] [&_p_code]:text-zinc-200 [&_p_code]:bg-[#141414] [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:rounded [&_pre]:bg-[#0c0c0c] [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre_code]:font-mono [&_pre_code]:text-[12px] [&_pre_code]:leading-[1.25] [&_pre_code]:tracking-normal [&_pre_code]:whitespace-pre [&_code]:font-mono [&_code]:text-[12px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_li]:text-text-muted [&_li_strong]:text-white [&_li_code]:font-mono [&_li_code]:text-[12px] [&_li_code]:text-zinc-200 [&_li_code]:bg-[#141414] [&_li_code]:px-1.5 [&_li_code]:py-0.5 [&_li_code]:rounded [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_thead]:hidden [&_thead]:md:table-header-group [&_tbody]:block [&_tbody]:md:table-row-group [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-[#060606] [&_th]:py-3.5 [&_th]:px-4 [&_th]:text-left [&_th]:text-white [&_th]:text-xs [&_th]:font-semibold [&_th:first-child]:w-64 [&_tr]:flex [&_tr]:flex-col [&_tr]:py-3 [&_tr]:md:table-row [&_tr]:md:py-0 [&_tr]:transition-colors [&_tr]:hover:bg-white/[0.02] [&_td]:block [&_td]:p-0 [&_td]:md:table-cell [&_td]:md:py-3.5 [&_td]:md:px-4 [&_td]:text-xs [&_td]:leading-relaxed [&_td:first-child]:font-mono [&_td:first-child]:text-[13px] [&_td:first-child]:font-semibold [&_td:first-child]:text-white [&_td:first-child]:mb-1 [&_td:first-child]:md:mb-0 [&_td:first-child]:md:text-zinc-100 [&_td:first-child]:md:whitespace-nowrap [&_td:last-child]:font-sans [&_td:last-child]:text-text-muted [&_td:last-child]:text-xs [&_hr]:hidden [&_a]:text-white [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </section>

          <Footer className="pt-8" />
        </div>
      </div>

      {/* Floating Bottom TOC Pill (Visible on screens < xl when sidebar is hidden) */}
      {sections.length > 0 && !isLoading && (
        <div
          ref={mobileMenuRef}
          className={`xl:hidden fixed ${hasActiveDocOp
              ? "bottom-[calc(var(--mobile-bottom-nav-height,56px)+var(--mobile-minibar-height,56px)+1rem)]"
              : "bottom-[calc(var(--mobile-bottom-nav-height,56px)+1rem)]"
            } md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center transition-[bottom] duration-300 ease-[var(--mobile-panel-easing,ease)]`}
        >
          {/* Stacked Pills Menu (Louis Vuitton Floating Stack aesthetic: all white capsules) */}
          {isMobileMenuOpen && (
            <div className="relative flex flex-col items-center">
              {/* Top Boundary Shadow Fade */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#060606]/80 to-transparent z-10 rounded-t-2xl" />
              {/* Bottom Boundary Shadow Fade */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#060606]/80 to-transparent z-10 rounded-b-2xl" />

              <div
                ref={stackedMenuContainerRef}
                className={`mb-3 overflow-y-auto px-4 py-3 flex flex-col items-center gap-2.5 no-scrollbar relative transition-opacity duration-150 ${isExiting ? "pointer-events-none opacity-0" : ""
                  }`}
                style={{
                  maxHeight: hasActiveDocOp
                    ? "calc(100dvh - var(--mobile-header-height, 56px) - var(--mobile-bottom-nav-height, 56px) - var(--mobile-minibar-height, 56px) - 5rem)"
                    : "calc(100dvh - var(--mobile-header-height, 56px) - var(--mobile-bottom-nav-height, 56px) - 5rem)",
                }}
              >
                {sections.map((section, idx) => {
                  const isActive = activeSectionId === section.id;
                  // Reverse stagger: items closest to the trigger pill expand first
                  const reverseIndex = sections.length - 1 - idx;
                  const delayMs = isExiting ? 0 : Math.min(200, reverseIndex * 25);
                  return (
                    <button
                      key={section.id}
                      data-section-id={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      style={{ animationDelay: `${delayMs}ms` }}
                      className={`${isExiting ? "animate-lv-pill-exit" : "animate-lv-pill"
                        } flex items-center justify-center px-6 py-3 rounded-full shadow-[0_12px_28px_rgba(0,0,0,0.85)] text-[13px] font-medium transition-all duration-200 cursor-pointer active:scale-95 select-none w-max max-w-[320px] ${isActive
                          ? "bg-white text-black font-semibold"
                          : "bg-[#1D1D1D]/95 hover:bg-[#282828] text-zinc-300 hover:text-white backdrop-blur-md"
                        } ${section.level === 3 ? "text-xs py-2.5 opacity-90" : ""}`}
                    >
                      <span className="truncate">{section.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Floating Pill Trigger (Louis Vuitton luxury capsule) */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="flex items-center gap-2.5 px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-full shadow-[0_14px_40px_rgba(0,0,0,0.85)] text-[13px] font-semibold tracking-wide transition-all duration-200 cursor-pointer active:scale-95 select-none"
            aria-expanded={isMobileMenuOpen}
            aria-label="Table of contents outline"
          >
            {/* Outline icon */}
            <svg
              className="w-4 h-4 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h10M4 18h14"
              />
            </svg>
            <span className="truncate max-w-[200px]">
              {activeSectionTitle}
            </span>
            <svg
              className={`w-4 h-4 text-black transition-transform duration-200 ${isMobileMenuOpen ? "rotate-180" : ""
                }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}
    </main>
  );
}
