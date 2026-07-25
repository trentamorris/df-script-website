import { useState, useEffect } from "react";
import type { OperationItem, DocsVersion } from "../types";

const GITHUB_RAW_BASE_URL = "https://raw.githubusercontent.com/trentamorris/df-script";
const GITHUB_API_BASE_URL = "https://api.github.com/repos/trentamorris/df-script";

export function useGithubVersions() {
  const [versionOptions, setVersionOptions] = useState<DocsVersion[]>(["v1.7.0"]);

  useEffect(() => {
    fetch(`${GITHUB_API_BASE_URL}/branches`)
      .then((r) => r.json())
      .then(async (branches: { name: string }[]) => {
        const versionBranches = branches
          .map((b) => b.name)
          .filter((name): name is DocsVersion => /^v\d+\.\d+\.\d+$/.test(name));

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
  const [operationsIndex, setOperationsIndex] = useState<OperationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
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
              signature: info.signature
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
