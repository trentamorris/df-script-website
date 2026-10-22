import React from "react";
import { marked } from "marked";
import { Footer } from "../footer/Footer";
import { useGithubReadme } from "../../../../../hooks/useGithubHooks";

export function About() {
  const { markdown, isLoading, error } = useGithubReadme();

  return (
    <main className="flex-grow flex flex-col h-full bg-[#060606] min-w-0 select-text overflow-hidden">
      {/* Pinned Header: Title & Contributor Credit */}
      <div className="w-full bg-[#060606]/95 backdrop-blur-md z-20 shrink-0 px-6 md:px-12 pt-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between border-b border-border-dark relative">
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

      {/* Scrollable Content Body */}
      <div className="flex-grow overflow-y-auto py-8 flex justify-center px-6 md:px-12">
        <div className="w-full flex flex-col gap-8 pb-20 max-w-3xl">
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider">
                df-script repository readme
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-dim">
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    isLoading ? "bg-amber-400 animate-pulse" : error ? "bg-red-400" : "bg-emerald-400"
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

            {markdown && !isLoading && (
              <div
                className="flex flex-col gap-4 text-text-muted leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:text-white [&_h1]:font-outfit [&_h1]:mt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:font-outfit [&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-border-dark [&_h2]:pb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:font-outfit [&_h3]:mt-4 [&_p]:mb-2 [&_p_strong]:text-white [&_p_code]:font-mono [&_p_code]:text-[11px] [&_p_code]:text-emerald-400 [&_p_code]:bg-[#111111] [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:rounded [&_pre]:bg-[#0c0c0c] [&_pre]:border [&_pre]:border-border-dark [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_code]:font-mono [&_code]:text-[11px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_li]:text-text-muted [&_li_strong]:text-white [&_li_code]:font-mono [&_li_code]:text-[11px] [&_li_code]:text-emerald-400 [&_li_code]:bg-[#111111] [&_li_code]:px-1.5 [&_li_code]:py-0.5 [&_li_code]:rounded [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border-dark [&_th]:p-2 [&_th]:text-left [&_th]:text-white [&_th]:text-xs [&_td]:border [&_td]:border-border-dark [&_td]:p-2 [&_td]:text-xs [&_hr]:border-border-dark [&_hr]:my-6 [&_a]:text-emerald-400 [&_a]:underline"
                dangerouslySetInnerHTML={{
                  __html: marked.parse(markdown, { gfm: true, breaks: true }) as string
                }}
              />
            )}
          </section>

          <Footer className="pt-8" />
        </div>
      </div>
    </main>
  );
}
