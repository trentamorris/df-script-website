import React from "react";
import { ArticleCanvas } from "../../../elements/article-canvas";
import { useGithubDonations } from "../../../../hooks/useGithubHooks";

export function Support() {
  const { markdown, isLoading, error } = useGithubDonations();

  return (
    <ArticleCanvas
      markdown={markdown}
      isLoading={isLoading}
      error={error}
      showToc={false}
      headerSlot={
        <div className="flex items-center justify-between pb-2">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white font-outfit lowercase">
              support df-script
            </h1>
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-wider">
              zero-dependency open source DataFrame engine
            </p>
          </div>
        </div>
      }
    />
  );
}
