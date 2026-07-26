import React from "react";
import { GITHUB_REPO_URL, NPM_PACKAGE_URL } from "../../../../../constants";
import type { FooterProps } from "./types";

export function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`border-t border-border-dark pt-8 pb-8 text-center text-[10px] text-text-dim font-mono select-none ${className}`}>
      <div className="flex items-center justify-between">
        <span>© 2026 df-script project</span>
        <div className="flex gap-4">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            GITHUB
          </a>
          <a
            href={NPM_PACKAGE_URL}
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            NPM
          </a>
        </div>
      </div>
    </footer>
  );
}
