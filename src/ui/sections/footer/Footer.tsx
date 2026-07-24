import React from "react";

export interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`border-t border-border-dark pt-8 pb-8 text-center text-[10px] text-text-dim font-mono select-none ${className}`}>
      <div className="flex items-center justify-between">
        <span>© 2026 df-script project</span>
        <div className="flex gap-4">
          <a
            href="https://github.com/trentamorris/df-script"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors"
          >
            GITHUB
          </a>
          <a
            href="https://www.npmjs.com/package/df-script"
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
