import React from "react";
import { Favorite, GitHub } from "@mui/icons-material";
import { SUPPORT_PATH } from "../../desktop/constants";

interface MobileHeaderProps {
  activeVersion?: string;
  isMenuOpen?: boolean;
}

export function MobileHeader({}: MobileHeaderProps) {
  return (
    <header className="sticky top-0 left-0 right-0 z-30 h-[var(--mobile-header-height,56px)] bg-bg-pitch/90 backdrop-blur-md px-4 flex items-center justify-between select-none">
      {/* Brand logo */}
      <a href="/" className="flex items-center">
        <span className="text-lg font-medium tracking-wide text-white font-outfit lowercase">
          df-script
        </span>
      </a>

      {/* Action link: GitHub */}
      <div className="flex items-center gap-4 text-xs font-outfit uppercase tracking-widest">
        <a
          href="https://github.com/trentamorris/df-script"
          target="_blank"
          rel="noopener noreferrer"
          className="text-text-muted hover:text-white transition-colors"
          title="GitHub Repository"
          aria-label="GitHub Repository"
        >
          <GitHub style={{ fontSize: "18px" }} />
        </a>
      </div>
    </header>
  );
}
