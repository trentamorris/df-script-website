import React from "react";
import { Footer } from "../../sections/shared/footer/Footer";
import { parseMarkdownSections } from "./utils";
import type { ArticleCanvasProps } from "./types";

export function ArticleCanvas({
  markdown,
  sections: customSections,
  showToc = true,
  children,
  isLoading = false,
  error = null,
  headerSlot,
  hasActiveDocOp = false,
  contentContainerRef: externalContainerRef,
  className = "",
}: ArticleCanvasProps) {
  const internalContainerRef = React.useRef<HTMLDivElement>(null);
  const contentContainerRef = externalContainerRef || internalContainerRef;

  const [activeSectionId, setActiveSectionId] = React.useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState<boolean>(false);
  const [isExiting, setIsExiting] = React.useState<boolean>(false);

  const mobileMenuRef = React.useRef<HTMLDivElement>(null);
  const stackedMenuContainerRef = React.useRef<HTMLDivElement>(null);

  // Parse markdown if provided
  const { html, sections: parsedSections } = React.useMemo(() => {
    if (!markdown) {
      return { html: "", sections: [] };
    }
    return parseMarkdownSections(markdown);
  }, [markdown]);

  const sections = customSections || parsedSections;
  const hasSections = showToc && sections.length > 0;

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
  }, [html, contentContainerRef]);

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

  // Center active pill in mobile menu
  React.useEffect(() => {
    if (!isMobileMenuOpen || isExiting || !stackedMenuContainerRef.current) return;
    const activeEl = stackedMenuContainerRef.current.querySelector(
      `[data-section-id="${CSS.escape(activeSectionId)}"]`
    ) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [isMobileMenuOpen, isExiting, activeSectionId]);

  // Close mobile menu on outside click
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

  // Scroll spy: track heading nearest to top
  React.useEffect(() => {
    const container = contentContainerRef.current;
    if (!container || !hasSections) return;

    const handleScroll = () => {
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
  }, [sections, hasSections, contentContainerRef]);

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
        className={`flex-grow overflow-y-auto pt-0 pb-8 px-6 md:px-12 scroll-smooth ${
          hasSections
            ? "grid grid-cols-1 xl:grid-cols-10 gap-8"
            : "flex justify-center"
        } ${className}`}
      >
        {/* Sticky Desktop TOC Sidebar: columns 1-2 */}
        {hasSections && (
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

        {/* Content Column: columns 3-8 if TOC present, or max-w-3xl centered if no TOC */}
        <div
          className={
            hasSections
              ? "col-span-1 xl:col-start-3 xl:col-span-6 min-w-0 flex flex-col gap-8 pt-8 pb-24"
              : "w-full max-w-3xl flex flex-col gap-8 pt-8 pb-24 min-w-0"
          }
        >
          {headerSlot}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="flex flex-col gap-3 py-6 animate-pulse">
              <div className="h-6 bg-[#111111] rounded w-2/3"></div>
              <div className="h-4 bg-[#111111] rounded w-full"></div>
              <div className="h-4 bg-[#111111] rounded w-5/6"></div>
              <div className="h-4 bg-[#111111] rounded w-3/4"></div>
              <div className="h-24 bg-[#111111] rounded w-full mt-4"></div>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="border border-red-950/40 bg-red-950/10 rounded p-4 text-[12px] font-mono text-red-400">
              {error}
            </div>
          )}

          {/* Markdown Content */}
          {html && !isLoading && (
            <div
              className="flex flex-col gap-4 text-text-muted leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-white [&_h1]:font-outfit [&_h1]:mt-4 [&_h1]:scroll-mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:font-outfit [&_h2]:mt-8 [&_h2]:scroll-mt-6 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:font-outfit [&_h3]:mt-6 [&_h3]:scroll-mt-6 [&_p]:mb-2 [&_p_strong]:text-white [&_p_code]:font-mono [&_p_code]:text-[12px] [&_p_code]:text-zinc-200 [&_p_code]:bg-[#141414] [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:rounded [&_pre]:bg-[#0c0c0c] [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre_code]:font-mono [&_pre_code]:text-[12px] [&_pre_code]:leading-[1.25] [&_pre_code]:tracking-normal [&_pre_code]:whitespace-pre [&_code]:font-mono [&_code]:text-[12px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_li]:text-text-muted [&_li_strong]:text-white [&_li_code]:font-mono [&_li_code]:text-[12px] [&_li_code]:text-zinc-200 [&_li_code]:bg-[#141414] [&_li_code]:px-1.5 [&_li_code]:py-0.5 [&_li_code]:rounded [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_thead]:hidden [&_thead]:md:table-header-group [&_tbody]:block [&_tbody]:md:table-row-group [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-[#060606] [&_th]:py-3.5 [&_th]:px-4 [&_th]:text-left [&_th]:text-white [&_th]:text-xs [&_th]:font-semibold [&_th:first-child]:w-64 [&_tr]:flex [&_tr]:flex-col [&_tr]:py-3 [&_tr]:md:table-row [&_tr]:md:py-0 [&_tr]:transition-colors [&_tr]:hover:bg-white/[0.02] [&_td]:block [&_td]:p-0 [&_td]:md:table-cell [&_td]:md:py-3.5 [&_td]:md:px-4 [&_td]:text-xs [&_td]:leading-relaxed [&_td:first-child]:font-mono [&_td:first-child]:text-[13px] [&_td:first-child]:font-semibold [&_td:first-child]:text-white [&_td:first-child]:mb-1 [&_td:first-child]:md:mb-0 [&_td:first-child]:md:text-zinc-100 [&_td:first-child]:md:whitespace-nowrap [&_td:last-child]:font-sans [&_td:last-child]:text-text-muted [&_td:last-child]:text-xs [&_hr]:hidden [&_a]:text-white [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}

          {/* Custom Children Content */}
          {children}

          <Footer className="pt-8" />
        </div>
      </div>

      {/* Floating Bottom TOC Pill for screens < xl */}
      {hasSections && (
        <div
          ref={mobileMenuRef}
          className={`xl:hidden fixed ${
            hasActiveDocOp
              ? "bottom-[calc(var(--mobile-bottom-nav-height,56px)+var(--mobile-minibar-height,56px)+1rem)]"
              : "bottom-[calc(var(--mobile-bottom-nav-height,56px)+1rem)]"
          } md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center transition-[bottom] duration-300 ease-[var(--mobile-panel-easing,ease)]`}
        >
          {/* Stacked Pills Menu (Louis Vuitton Floating Stack aesthetic) */}
          {isMobileMenuOpen && (
            <div className="relative flex flex-col items-center">
              <div
                ref={stackedMenuContainerRef}
                className={`mb-3 overflow-y-auto px-4 py-3 flex flex-col items-center gap-2.5 no-scrollbar relative transition-opacity duration-150 ${
                  isExiting ? "pointer-events-none opacity-0" : ""
                }`}
                style={{
                  maxHeight: hasActiveDocOp
                    ? "calc(100dvh - var(--mobile-header-height, 56px) - var(--mobile-bottom-nav-height, 56px) - var(--mobile-minibar-height, 56px) - 5rem)"
                    : "calc(100dvh - var(--mobile-header-height, 56px) - var(--mobile-bottom-nav-height, 56px) - 5rem)",
                }}
              >
                {sections.map((section, idx) => {
                  const isActive = activeSectionId === section.id;
                  const reverseIndex = sections.length - 1 - idx;
                  const delayMs = isExiting ? 0 : Math.min(200, reverseIndex * 25);
                  return (
                    <button
                      key={section.id}
                      data-section-id={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      style={{ animationDelay: `${delayMs}ms` }}
                      className={`${
                        isExiting ? "animate-lv-pill-exit" : "animate-lv-pill"
                      } flex items-center justify-center px-6 py-3 rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer active:scale-95 select-none w-max max-w-[320px] ${
                        isActive
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

          {/* Main Floating Pill Trigger */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="flex items-center gap-2.5 px-6 py-3 bg-white hover:bg-zinc-200 text-black rounded-full text-[13px] font-semibold tracking-wide transition-all duration-200 cursor-pointer active:scale-95 select-none"
            aria-expanded={isMobileMenuOpen}
            aria-label="Table of contents outline"
          >
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
              className={`w-4 h-4 text-black transition-transform duration-200 ${
                isMobileMenuOpen ? "rotate-180" : ""
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
