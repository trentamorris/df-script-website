import React from "react";
import { marked } from "marked";
import { Footer } from "../footer/Footer";
import { useGithubDonations } from "../../../../../hooks/useGithubHooks";

export function Support() {
  const { markdown, isLoading, error } = useGithubDonations();

  return (
    <main className="flex-grow overflow-y-auto p-6 md:p-12 bg-[#060606] h-full flex justify-center min-w-0 select-text">
      <div className="w-full max-w-3xl flex flex-col gap-8 pb-20">
        {/* Header Status Bar */}
        <div className="flex items-center justify-between border-b border-border-dark pb-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white font-outfit lowercase">
              support df-script
            </h1>
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-wider">
              zero-dependency open source DataFrame engine
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-text-dim">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${isLoading ? "bg-amber-400 animate-pulse" : error ? "bg-red-400" : "bg-emerald-400"
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

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="flex flex-col gap-4 py-6 animate-pulse">
            <div className="h-6 bg-[#111111] rounded w-1/3"></div>
            <div className="h-4 bg-[#111111] rounded w-full"></div>
            <div className="h-4 bg-[#111111] rounded w-5/6"></div>
            <div className="h-20 bg-[#111111] rounded w-full mt-2"></div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="border border-red-950/40 bg-red-950/10 rounded p-4 text-[12px] font-mono text-red-400">
            {error}
          </div>
        )}

        {/* Pure Markdown Rendered Content */}
        {markdown && !isLoading && (
          <div
            className="flex flex-col gap-4 text-text-muted leading-relaxed [&_h1]:hidden [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-white [&_h2]:font-outfit [&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-border-dark [&_h2]:pb-2 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-white [&_h3]:font-outfit [&_h3]:mt-4 [&_p]:mb-2 [&_p_strong]:text-white [&_p_code]:font-mono [&_p_code]:text-[11px] [&_p_code]:text-emerald-400 [&_p_code]:bg-[#111111] [&_p_code]:px-1.5 [&_p_code]:py-0.5 [&_p_code]:rounded [&_p_code]:break-all [&_pre]:bg-[#0c0c0c] [&_pre]:border [&_pre]:border-border-dark [&_pre]:p-4 [&_pre]:rounded [&_pre]:overflow-x-auto [&_code]:font-mono [&_code]:text-[11px] [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_li]:text-text-muted [&_li_strong]:text-white [&_li_code]:font-mono [&_li_code]:text-[11px] [&_li_code]:text-emerald-400 [&_li_code]:bg-[#111111] [&_li_code]:px-1.5 [&_li_code]:py-0.5 [&_li_code]:rounded [&_hr]:border-border-dark [&_hr]:my-6 [&_a]:text-emerald-400 [&_a]:underline hover:[&_a]:text-emerald-300 transition-colors"
            dangerouslySetInnerHTML={{
              __html: marked.parse(markdown, { gfm: true, breaks: true }) as string
            }}
          />
        )}

        <Footer className="pt-8" />
      </div>
    </main>
  );
}
