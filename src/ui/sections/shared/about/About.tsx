import React from "react";
import { ArticleCanvas } from "../../../elements/article-canvas";
import { useGithubReadme } from "../../../../hooks/useGithubHooks";
import type { AboutProps } from "./types";

export function About({ hasActiveDocOp = false }: AboutProps = {}) {
  const { markdown, isLoading, error } = useGithubReadme();

  return (
    <ArticleCanvas
      markdown={markdown}
      isLoading={isLoading}
      error={error}
      hasActiveDocOp={hasActiveDocOp}
    />
  );
}
