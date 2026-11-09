import React from "react";
import { Footer } from "../../sections/shared/footer/Footer";
import { parseMarkdownSections, extractDomSections } from "./utils";
import styles from "./articleCanvas.module.css";
import type { ArticleCanvasProps, ArticleNavSection } from "./types";

interface TocSectionGroup {
  parent: ArticleNavSection;
  children: ArticleNavSection[];
}

export function ArticleCanvas({
  markdown,
  sections: customSections,
  showToc = true,
  children,
  isLoading = false,
  loadingText,
  error = null,
  headerSlot,
  hasActiveDocOp = false,
  contentContainerRef: externalContainerRef,
  animateOnScroll = true,
  showTocIndicator = true,
  className = "",
}: ArticleCanvasProps) {
  const internalContainerRef = React.useRef<HTMLDivElement>(null);
  const contentContainerRef = externalContainerRef || internalContainerRef;
  const contentColumnRef = React.useRef<HTMLDivElement>(null);
  const tocAsideRef = React.useRef<HTMLElement>(null);
  const tocNavRef = React.useRef<HTMLElement>(null);

  const [activeSectionId, setActiveSectionId] = React.useState<string>("");
  const [domSections, setDomSections] = React.useState<ArticleNavSection[]>([]);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});
  const [tocIndicatorStyle, setTocIndicatorStyle] = React.useState<{
    top: number;
    height: number;
    opacity: number;
  }>({ top: 0, height: 0, opacity: 0 });
  const [scrollEdgeState, setScrollEdgeState] = React.useState<{
    showTopShadow: boolean;
    showBottomShadow: boolean;
  }>({ showTopShadow: false, showBottomShadow: true });
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

  // Auto-discover sections from rendered JSX children if neither customSections nor markdown is provided
  React.useEffect(() => {
    if (customSections || markdown || !showToc) {
      setDomSections([]);
      return;
    }
    const col = contentColumnRef.current;
    if (!col) return;
    setDomSections(extractDomSections(col));
  }, [customSections, markdown, showToc, children]);

  const sections = customSections || (markdown ? parsedSections : domSections);
  const hasSections = showToc && sections.length > 0;

  // Build hierarchical groups (level 2 parents with nested level 3 children)
  const tocGroups = React.useMemo<TocSectionGroup[]>(() => {
    const groups: TocSectionGroup[] = [];
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (sec.level === 2 || groups.length === 0) {
        groups.push({ parent: sec, children: [] });
      } else {
        groups[groups.length - 1].children.push(sec);
      }
    }
    return groups;
  }, [sections]);

  const toggleGroupCollapse = React.useCallback((parentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedGroups((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  }, []);

  // Determine which TOC button ID should carry the active indicator
  // (If an h3 child is active while its h2 parent is collapsed, highlight the h2 parent)
  const effectiveActiveTocId = React.useMemo(() => {
    if (!activeSectionId) return "";
    for (let i = 0; i < tocGroups.length; i++) {
      const group = tocGroups[i];
      if (group.parent.id === activeSectionId) return group.parent.id;
      for (let j = 0; j < group.children.length; j++) {
        if (group.children[j].id === activeSectionId) {
          return collapsedGroups[group.parent.id] ? group.parent.id : activeSectionId;
        }
      }
    }
    return activeSectionId;
  }, [activeSectionId, tocGroups, collapsedGroups]);

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

  // Scroll spy & smart scroll edge shadows
  React.useEffect(() => {
    const container = contentContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const showTopShadow = container.scrollTop > 12;
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <= 30;
      const showBottomShadow = !isAtBottom;

      setScrollEdgeState((prev) =>
        prev.showTopShadow === showTopShadow && prev.showBottomShadow === showBottomShadow
          ? prev
          : { showTopShadow, showBottomShadow }
      );

      if (!hasSections) return;

      if (isAtBottom && sections.length > 0) {
        setActiveSectionId(sections[sections.length - 1].id);
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const offsetTop = containerRect.top;

      let currentActive = sections[0]?.id || "";
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const el = container.querySelector(`#${CSS.escape(section.id)}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top - offsetTop <= 96) {
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

  // Update sliding TOC indicator geometry & auto-scroll active TOC item into view
  const updateTocIndicator = React.useCallback(() => {
    const navEl = tocNavRef.current;
    const asideEl = tocAsideRef.current;
    if (!navEl || !effectiveActiveTocId) {
      setTocIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const activeBtn = navEl.querySelector(
      `[data-toc-id="${CSS.escape(effectiveActiveTocId)}"]`
    ) as HTMLElement | null;

    if (!activeBtn) {
      setTocIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const navRect = navEl.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const relativeTop = btnRect.top - navRect.top;

    if (showTocIndicator) {
      setTocIndicatorStyle({
        top: relativeTop + 5,
        height: Math.max(14, btnRect.height - 10),
        opacity: 1,
      });
    }

    // Keep the active TOC item smoothly visible inside the sticky TOC sidebar as the user scrolls
    if (asideEl && asideEl.scrollHeight > asideEl.clientHeight) {
      const asideRect = asideEl.getBoundingClientRect();
      const topPadding = 40;
      const bottomPadding = 48;
      if (btnRect.top < asideRect.top + topPadding) {
        const delta = btnRect.top - (asideRect.top + topPadding);
        asideEl.scrollTo({
          top: Math.max(0, asideEl.scrollTop + delta),
          behavior: "smooth",
        });
      } else if (btnRect.bottom > asideRect.bottom - bottomPadding) {
        const delta = btnRect.bottom - (asideRect.bottom - bottomPadding);
        asideEl.scrollTo({
          top: asideEl.scrollTop + delta,
          behavior: "smooth",
        });
      }
    }
  }, [effectiveActiveTocId, showTocIndicator]);

  React.useEffect(() => {
    updateTocIndicator();
    const timer = setTimeout(updateTocIndicator, 240);
    return () => clearTimeout(timer);
  }, [updateTocIndicator, sections, collapsedGroups]);

  // Vertical spring rise + micro-scale scroll entrance
  React.useEffect(() => {
    const container = contentContainerRef.current;
    const col = contentColumnRef.current;
    if (!container || !col || !animateOnScroll || isLoading) return;

    const rawTargets = col.querySelectorAll(
      "h1, h2, h3, p, ul, ol, table, section, .article-code-card"
    );
    if (rawTargets.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const targets: HTMLElement[] = [];

    for (let i = 0; i < rawTargets.length; i++) {
      const el = rawTargets[i] as HTMLElement;
      // Avoid double-animating elements nested inside sections, lists, or tables
      if (
        el.tagName !== "SECTION" &&
        (el.closest("section") || el.closest("li") || el.closest("td"))
      ) {
        continue;
      }

      el.classList.add(styles.springRiseBlock);

      const rect = el.getBoundingClientRect();
      if (rect.top < containerRect.bottom - 24) {
        el.classList.add(styles.springRiseVisible);
      }

      targets.push(el);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const targetEl = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            targetEl.classList.add(styles.springRiseVisible);
          } else if (
            entry.rootBounds &&
            entry.boundingClientRect.top > entry.rootBounds.bottom
          ) {
            // Reset when scrolled back above the element so scrolling down replays the rise
            targetEl.classList.remove(styles.springRiseVisible);
          }
        }
      },
      {
        root: container,
        rootMargin: "0px 0px -32px 0px",
        threshold: 0.05,
      }
    );

    for (let i = 0; i < targets.length; i++) {
      observer.observe(targets[i]);
    }

    return () => {
      observer.disconnect();
      for (let i = 0; i < targets.length; i++) {
        const el = targets[i];
        el.classList.remove(styles.springRiseBlock, styles.springRiseVisible);
      }
    };
  }, [html, children, animateOnScroll, isLoading, contentContainerRef]);

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
    <main className={`${styles.articleCanvasRoot} @container flex-1 w-full flex flex-col h-full bg-[#060606] min-w-0 select-text overflow-hidden relative`}>
      {/* Subtle Top and Bottom Scroll Edge Fades */}
      <div
        className={`pointer-events-none absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-[#060606] to-transparent z-20 transition-opacity duration-300 ${scrollEdgeState.showTopShadow ? "opacity-100" : "opacity-0"
          }`}
      />
      <div
        className={`pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#060606] to-transparent z-20 transition-opacity duration-300 ${scrollEdgeState.showBottomShadow ? "opacity-100" : "opacity-0"
          }`}
      />

      {/* Main Scrollable Container */}
      <div
        ref={contentContainerRef}
        className={`flex-1 w-full overflow-y-auto pt-0 pb-8 px-6 @3xl:px-10 @5xl:px-14 scroll-smooth ${className}`}
      >
        <div
          className={
            hasSections
              ? "max-w-[1440px] mx-auto w-full grid grid-cols-1 @5xl:grid-cols-12 gap-8 @5xl:gap-12"
              : "max-w-3xl mx-auto w-full flex justify-center"
          }
        >
          {/* Sticky Desktop TOC Sidebar: columns 1-3, with left-aligned chevrons, connected depth lines, and stable hover-only scrollbar */}
          {hasSections && (
            <aside
              ref={tocAsideRef}
              className={`${styles.articleToc} @5xl:col-start-1 @5xl:col-span-3 sticky top-0 self-start select-none pt-8 pr-1 max-h-[calc(100dvh-5rem)] overflow-y-auto overflow-x-hidden min-w-0 ${styles.tocScrollContainer}`}
            >
                <nav
                  ref={tocNavRef}
                  aria-label="Table of contents"
                  className="relative flex flex-col min-w-0"
                >
                  {/* Root Vertical TOC Track + Sliding Indicator */}
                  {showTocIndicator && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-1 bottom-1 w-[1px] bg-white/[0.07] rounded-full"
                    >
                      <div
                        className="w-[2px] -ml-[0.5px] rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{
                          transform: `translateY(${tocIndicatorStyle.top}px)`,
                          height: `${tocIndicatorStyle.height}px`,
                          opacity: tocIndicatorStyle.opacity,
                        }}
                      />
                    </div>
                  )}

                  <ul className={`relative flex flex-col gap-0.5 min-w-0 ${showTocIndicator ? "pl-3" : ""}`}>
                    {tocGroups.map((group) => {
                      const hasChildren = group.children.length > 0;
                      const isCollapsed = !!collapsedGroups[group.parent.id];
                      const isParentActive = effectiveActiveTocId === group.parent.id;
                      const hasActiveChild = group.children.some((c) => c.id === activeSectionId);

                      return (
                        <li key={group.parent.id} className="flex flex-col min-w-0">
                          {/* Parent H2 Row with Left Chevron Toggle */}
                          <div className="flex items-center min-w-0 group/toc-row">
                            {hasChildren && (
                              <button
                                type="button"
                                onClick={(e) => toggleGroupCollapse(group.parent.id, e)}
                                aria-label={
                                  isCollapsed
                                    ? `Expand ${group.parent.title}`
                                    : `Collapse ${group.parent.title}`
                                }
                                aria-expanded={!isCollapsed}
                                className="w-4 h-4 mr-1 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
                              >
                                <svg
                                  className={`w-3 h-3 transition-transform duration-200 ease-out ${isCollapsed ? "-rotate-90" : "rotate-0"
                                    }`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2.2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </button>
                            )}

                            <button
                              type="button"
                              data-toc-id={group.parent.id}
                              onClick={() => scrollToSection(group.parent.id)}
                              className={`flex-1 min-w-0 text-left text-xs transition-colors duration-200 truncate py-1.5 cursor-pointer font-sans ${isParentActive
                                ? "text-white font-medium"
                                : hasActiveChild
                                  ? "text-zinc-200 font-medium"
                                  : "text-text-muted hover:text-zinc-200"
                                }`}
                              title={group.parent.title}
                            >
                              {group.parent.title}
                            </button>
                          </div>

                          {/* Nested H3 Children: Vertical depth line drops directly from the center of the left chevron */}
                          {hasChildren && (
                            <div
                              className={`grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] min-w-0 ${isCollapsed
                                ? "grid-rows-[0fr] opacity-0 pointer-events-none"
                                : "grid-rows-[1fr] opacity-100"
                                }`}
                            >
                              <div className="overflow-hidden min-w-0">
                                <ul className="relative ml-[7.5px] pl-3.5 border-l border-white/[0.1] flex flex-col gap-0.5 my-0.5 min-w-0">
                                  {group.children.map((child) => {
                                    const isChildActive = activeSectionId === child.id;
                                    return (
                                      <li key={child.id} className="min-w-0">
                                        <button
                                          type="button"
                                          data-toc-id={child.id}
                                          onClick={() => scrollToSection(child.id)}
                                          className={`text-left text-[11px] transition-colors duration-200 block w-full truncate py-1 cursor-pointer font-sans ${isChildActive
                                            ? "text-white font-medium"
                                            : "text-zinc-500 hover:text-zinc-200"
                                            }`}
                                          title={child.title}
                                        >
                                          {child.title}
                                        </button>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            </div>
                          )
                          }
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </aside>
            )
            }

            {/* Content Column: centered in columns 4-10 on wide screens so the article is optically balanced */}
            <div
              ref={contentColumnRef}
              className={
                hasSections
                  ? "col-span-1 @5xl:col-start-4 @5xl:col-span-7 min-w-0 flex flex-col gap-8 pt-8 pb-24"
                  : "w-full max-w-3xl flex flex-col gap-8 pt-8 pb-24 min-w-0"
              }
            >
              {headerSlot}

              {/* Loading State: Optional Glisten Text + Skeleton */}
              {isLoading && (
                <div className="flex flex-col gap-4 py-6">
                  {loadingText && (
                    <div className="flex items-center gap-2 text-xs font-mono tracking-wide select-none">
                      <span className={styles.shimmerText}>{loadingText}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-3 animate-pulse">
                    <div className="h-6 bg-[#111111] rounded w-2/3"></div>
                    <div className="h-4 bg-[#111111] rounded w-full"></div>
                    <div className="h-4 bg-[#111111] rounded w-5/6"></div>
                    <div className="h-4 bg-[#111111] rounded w-3/4"></div>
                    <div className="h-24 bg-[#111111] rounded w-full mt-4"></div>
                  </div>
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
                  className="flex flex-col gap-4 text-text-muted leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-white [&_h1]:font-outfit [&_h1]:mt-4 [&_h1]:scroll-mt-6 [&_h1]:w-fit [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:font-outfit [&_h2]:mt-8 [&_h2]:scroll-mt-6 [&_h2]:w-fit [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:font-outfit [&_h3]:mt-6 [&_h3]:scroll-mt-6 [&_h3]:w-fit [&_p]:mb-2 [&_p_strong]:text-white [&_p_code]:font-mono [&_p_code]:text-[12px] [&_p_code]:text-zinc-200 [&_p_code]:bg-[#141414] [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:rounded [&_p_code]:break-all [&_pre]:bg-surface [&_pre]:p-4 [&_pre]:rounded-xl [&_pre]:overflow-x-auto [&_pre_code]:font-mono [&_pre_code]:text-[12px] [&_pre_code]:leading-[1.25] [&_pre_code]:tracking-normal [&_pre_code]:whitespace-pre [&_code]:font-mono [&_code]:text-[12px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_li]:text-text-muted [&_li_strong]:text-white [&_li_code]:font-mono [&_li_code]:text-[12px] [&_li_code]:text-zinc-200 [&_li_code]:bg-[#141414] [&_li_code]:px-1.5 [&_li_code]:py-0.5 [&_li_code]:rounded [&_table]:w-full [&_table]:border-collapse [&_table]:my-4 [&_thead]:hidden [&_thead]:md:table-header-group [&_thead_tr]:border-b [&_thead_tr]:border-white/[0.08] [&_tbody]:block [&_tbody]:md:table-row-group [&_tbody_tr]:border-b [&_tbody_tr]:border-white/[0.04] [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-[#060606] [&_th]:py-3.5 [&_th]:px-4 [&_th]:text-left [&_th]:text-white [&_th]:text-xs [&_th]:font-semibold [&_th:first-child]:md:w-[38%] [&_tr]:flex [&_tr]:flex-col [&_tr]:py-3 [&_tr]:md:table-row [&_tr]:md:py-0 [&_tr]:transition-colors [&_tr]:hover:bg-white/[0.02] [&_td]:block [&_td]:p-0 [&_td]:md:table-cell [&_td]:md:py-3.5 [&_td]:md:px-4 [&_td]:text-xs [&_td]:leading-relaxed [&_td:first-child]:font-mono [&_td:first-child]:text-[13px] [&_td:first-child]:font-semibold [&_td:first-child]:text-white [&_td:first-child]:mb-1 [&_td:first-child]:md:mb-0 [&_td:first-child]:md:text-zinc-100 [&_td:first-child]:md:whitespace-nowrap [&_td:last-child]:font-sans [&_td:last-child]:text-text-muted [&_td:last-child]:text-xs [&_hr]:hidden [&_a]:text-white [&_a]:underline"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}

              {/* Custom Children Content */}
              {children}

              <Footer className="pt-8" />
            </div>
          </div>
        </div>

        {/* Floating Bottom TOC Pill for narrow containers (< @3xl) */}
        {hasSections && (
          <div
            ref={mobileMenuRef}
            className={`${styles.articleMobilePill} fixed ${hasActiveDocOp
              ? "bottom-[calc(var(--mobile-bottom-nav-height,56px)+var(--mobile-minibar-height,56px)+1rem)]"
              : "bottom-[calc(var(--mobile-bottom-nav-height,56px)+1rem)]"
              } md:absolute md:bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center transition-[bottom] duration-300 ease-[var(--mobile-panel-easing,ease)]`}
          >
            {/* Stacked Pills Menu (Louis Vuitton Floating Stack aesthetic) */}
            {isMobileMenuOpen && (
              <div className="relative flex flex-col items-center">
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
                          } flex items-center justify-center px-6 py-3 rounded-full text-[13px] font-medium transition-all duration-200 cursor-pointer active:scale-95 select-none w-max max-w-[320px] ${isActive
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
              < svg
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
