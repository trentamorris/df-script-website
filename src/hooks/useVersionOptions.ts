import { useState, useEffect } from "react";
import type { DocsVersion } from "../types";

export function useVersionOptions() {
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
              const res = await fetch(`https://raw.githubusercontent.com/trentamorris/df-script/${v}/docs.json`, { method: "HEAD" });
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
