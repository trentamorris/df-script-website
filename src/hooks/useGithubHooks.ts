import React from "react";
import type { OperationItem, DocsVersion } from "../types";
import { GITHUB_RAW_BASE_URL, GITHUB_API_BASE_URL } from "../constants";

export function useGithubVersions() {
  const [versionOptions, setVersionOptions] = React.useState<DocsVersion[]>([]);

  React.useEffect(() => {
    fetch(`${GITHUB_API_BASE_URL}/branches`)
      .then((r) => r.json())
      .then(async (branches: { name: string }[]) => {
        const versionBranches = branches
          .map((b) => b.name)
          .filter((name): name is DocsVersion => {
            const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(name);
            if (!match) return false;
            const maj = Number(match[1]);
            const min = Number(match[2]);
            return maj > 2 || (maj === 2 && min >= 3);
          });

        const validVersions: DocsVersion[] = [];
        await Promise.all(
          versionBranches.map(async (v) => {
            try {
              const res = await fetch(`${GITHUB_API_BASE_URL}/contents?ref=${v}`);
              if (res.ok) {
                const files = await res.json();
                const hasDocs = Array.isArray(files) && files.some((f: any) => f.name === "docs.json");
                if (hasDocs) {
                  validVersions.push(v);
                }
              }
            } catch {
              // Ignore
            }
          })
        );

        // Sort descending semver-style
        validVersions.sort((a, b) => {
          const parse = (v: string) => v.slice(1).split(".").map(Number);
          const [aMaj, aMin, aPat] = parse(a);
          const [bMaj, bMin, bPat] = parse(b);
          if (aMaj !== bMaj) return bMaj - aMaj;
          if (aMin !== bMin) return bMin - aMin;
          return bPat - aPat;
        });

        if (validVersions.length > 0) {
          setVersionOptions(validVersions);
        }
      })
      .catch(() => {
        // Keep fallback
      });
  }, []);

  return versionOptions;
}

export function useGithubDocs(activeVersion: DocsVersion) {
  const [operationsIndex, setOperationsIndex] = React.useState<OperationItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (!activeVersion) return;
    setIsLoading(true);
    fetch(`${GITHUB_RAW_BASE_URL}/${activeVersion}/docs.json?t=${Date.now()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then((rawDocs: Record<string, Record<string, any>>) => {
        const mappedList: OperationItem[] = [];
        for (const [filePath, symbols] of Object.entries(rawDocs)) {
          for (const [symbolName, info] of Object.entries(symbols)) {
            let name = symbolName;
            if (info.category === "DataFrame") {
              name = `.${symbolName}()`;
            } else if (info.category === "ColumnExpression") {
              if (info.namespace === "$df") {
                name = `${symbolName}()`;
              } else if (info.namespace && info.namespace.startsWith("$df.col.")) {
                const sub = info.namespace.slice(8);
                name = `.${sub}.${symbolName}()`;
              } else {
                name = `.${symbolName}()`;
              }
            }

            mappedList.push({
              name,
              category: info.category || "ColumnExpression",
              syntax: info.syntax || "",
              desc: info.desc || "",
              version: activeVersion,
              examples: info.examples,
              params: info.params,
              returns: info.returns,
              signature: info.signature,
              filePath,
              lineStart: info.lineStart
            });
          }
        }
        setOperationsIndex(mappedList);
      })
      .catch(() => setOperationsIndex([]))
      .finally(() => setIsLoading(false));
  }, [activeVersion]);

  return { operationsIndex, isLoading };
}

/**
 * Dynamically fetches and extracts a specific section from the repository README on GitHub.
 * No hardcoded fallback text is stored or returned.
 */
export function useGithubReadme(sectionTitle?: string) {
  const [markdown, setMarkdown] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`${GITHUB_RAW_BASE_URL}/main/README.md?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to fetch README from GitHub`);
        }
        return res.text();
      })
      .then((fullReadme) => {
        if (isCancelled) return;

        if (!sectionTitle) {
          // Cleanly remove shields.io / badge links (e.g. [![...](https://img.shields.io/...)](...))
          const cleanedReadme = fullReadme
            .replace(/\[\!\[.*?\]\(https?:\/\/(?:img\.shields\.io|bundlephobia\.com)[^)]*\)\]\([^)]*\)\s*/gi, "")
            .replace(/\!\[.*?\]\(https?:\/\/(?:img\.shields\.io|bundlephobia\.com)[^)]*\)\s*/gi, "")
            .trim();

          setMarkdown(cleanedReadme);
          setError(null);
          return;
        }

        // Escape special regex characters in section title
        const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`##\\s+.*?${escapedTitle}[\\s\\S]*?\\n\\n([\\s\\S]*?)(?=\\n---\\n|\\n##\\s+|$)`, "i");
        const match = fullReadme.match(regex);

        if (match && match[1]) {
          setMarkdown(match[1].trim());
          setError(null);
        } else {
          throw new Error(`Section "${sectionTitle}" not found in GitHub README.`);
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        setMarkdown(null);
        setError(err instanceof Error ? err.message : "Error fetching README from GitHub");
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [sectionTitle]);

  return { markdown, isLoading, error };
}

// Backwards-compatible export
export const useGithubReadmeSection = useGithubReadme;
