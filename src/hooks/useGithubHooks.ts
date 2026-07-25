import { useState, useEffect } from "react";
import type { OperationItem, DocsVersion } from "../types";

const GITHUB_RAW_BASE_URL = "https://raw.githubusercontent.com/trentamorris/df-script";

export function useGithubVersions() {
  const [versionOptions, setVersionOptions] = useState<DocsVersion[]>(["v1.7.0"]);

  useEffect(() => {
    fetch("https://api.github.com/repos/trentamorris/df-script/branches")
      .then((r) => r.json())
      .then(async (branches: { name: string }[]) => {
        const allowedVersions = ["v1.7.0", "v1.6.0", "v1.5.0"];
        const versionBranches = branches
          .map((b) => b.name)
          .filter((name): name is DocsVersion => allowedVersions.includes(name));

        const validVersions: DocsVersion[] = [];
        await Promise.all(
          versionBranches.map(async (v) => {
            try {
              const res = await fetch(`${GITHUB_RAW_BASE_URL}/${v}/docs.json`, { method: "HEAD" });
              if (res.ok) {
                validVersions.push(v);
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
    fetch(`${GITHUB_RAW_BASE_URL}/${activeVersion}/docs.json`)
      .then((r) => r.json())
      .then((rawDocs: Record<string, Record<string, any>>) => {
        const mappedList: OperationItem[] = [];
        for (const [filePath, symbols] of Object.entries(rawDocs)) {
          const isDf = filePath.includes("dataframe/");
          const isException = filePath.includes("exceptions/");
          const isDatatype = filePath.includes("datatypes/") || filePath.includes("types.ts");
          const isGlobal = filePath.includes("functions/");
          const isExprBase = filePath.includes("ExprBase.ts");

          let mixinNamespace = "";
          if (filePath.includes("mixins/")) {
            if (filePath.includes("StringExpr")) mixinNamespace = "str";
            else if (filePath.includes("TemporalExpr")) mixinNamespace = "dt";
            else if (filePath.includes("ArrayExpr")) mixinNamespace = "arr";
            else if (filePath.includes("StructExpr")) mixinNamespace = "struct";
          }

          for (const [symbolName, info] of Object.entries(symbols)) {
            let name = symbolName;
            let category: "DataFrame" | "ColumnExpression" | "DataType" | "Exception" = "ColumnExpression";
            let syntax = "";

            if (info.category && info.syntax) {
              category = info.category;
              syntax = info.syntax;
              if (category === "DataFrame") {
                name = `.${symbolName}()`;
              } else if (category === "ColumnExpression") {
                if (syntax.includes("$df.col(<column_name>).")) {
                  const parts = syntax.split("$df.col(<column_name>)");
                  name = parts[1].replace("(...)", "()");
                } else if (syntax.startsWith("$df.")) {
                  name = `${symbolName}()`;
                } else {
                  name = `.${symbolName}()`;
                }
              } else if (category === "DataType") {
                let typeDisplay = symbolName;
                if (symbolName.endsWith("DataType")) typeDisplay = symbolName.slice(0, -8);
                syntax = `DataType.${typeDisplay}`;
              }
            } else {
              if (isDf) {
                name = `.${symbolName}()`;
                category = "DataFrame";
                syntax = `df.${symbolName}(...)`;
              } else if (isException) {
                category = "Exception";
                syntax = `throw new ${symbolName}("message")`;
              } else if (isDatatype) {
                category = "DataType";
                let typeDisplay = symbolName;
                if (symbolName.endsWith("DataType")) typeDisplay = symbolName.slice(0, -8);
                syntax = `DataType.${typeDisplay}`;
              } else if (isGlobal) {
                name = `${symbolName}()`;
                syntax = `$df.${symbolName}(...)`;
              } else if (isExprBase) {
                name = `.${symbolName}()`;
                syntax = `$df.col(<column_name>).${symbolName}(...)`;
              } else if (mixinNamespace) {
                name = `.${mixinNamespace}.${symbolName}()`;
                syntax = `$df.col(<column_name>).${mixinNamespace}.${symbolName}(...)`;
              } else {
                name = `.${symbolName}()`;
                syntax = `$df.col(<column_name>).${symbolName}(...)`;
              }
            }

            mappedList.push({
              name,
              category,
              syntax,
              desc: info.desc || "",
              version: activeVersion,
              examples: info.examples,
              params: info.params,
              returns: info.returns
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
