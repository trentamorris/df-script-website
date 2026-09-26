import React from "react";
import { ContentCopy } from "@mui/icons-material";
import { GalaxyBackground, GalaxyLogo } from "../../../../elements";
import { useCopyToClipboard } from "../../../../../hooks/useCopyToClipboard";

export function Home() {
  const { copy, isCopied } = useCopyToClipboard();
  const [copyPulse, setCopyPulse] = React.useState(0);

  const handleCopy = () => {
    copy("npm install df-script", "install");
    setCopyPulse((prev) => prev + 1);
  };

  return (
    <>
      {/* <MagneticParticles /> */}
      <main className="flex-grow overflow-y-auto h-full flex flex-col justify-between min-w-0 relative z-10">

        {/* Centered Hero Contents with subtle ambient cosmic glow */}
        <div className="relative flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto flex-grow px-6 py-20">
          {/* Soft cosmic nebula depth aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[280px] bg-gradient-to-tr from-sky-500/10 via-blue-600/5 to-purple-500/5 blur-3xl pointer-events-none rounded-full -z-10" />

          <GalaxyLogo text="df-script" className="animate-fade-in" triggerPulse={copyPulse} />

          <p className="text-sm md:text-base diamond-glisten max-w-lg leading-relaxed select-none animate-hero-desc">
            A zero-dependency, high-performance, expression-based DataFrame engine designed for lightning-fast data processing in JavaScript and TypeScript.
          </p>

          {/* Quick Install Pill with subtle cosmic hover border */}
          <div className="group flex items-center justify-between gap-4 p-2 px-4 rounded bg-[#0a0a0a]/90 backdrop-blur-sm border border-[#1e1e1e] hover:border-sky-500/30 transition-all duration-300 font-mono text-[11px] text-[#e5e5e5] w-full max-w-sm mt-2 shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_-5px_rgba(56,189,248,0.12)] animate-hero-pill">
            <div className="flex items-center gap-2">
              <span className="text-[#5c5c5c] group-hover:text-sky-400/80 transition-colors select-none">$</span>
              <span className="diamond-glisten [--base-color:#e5e5e5] [--glint-color:#ffffff] [--glint-prism:#bae6fd]">npm install df-script</span>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center hover:text-[#ffffff] text-[#9c9c9c] transition-colors cursor-pointer select-none"
              title="Copy install command"
            >
              {isCopied("install") ? (
                <span className="text-[#e5e5e5] text-[10px] font-mono tracking-wider transition-opacity duration-200">COPIED!</span>
              ) : (
                <ContentCopy style={{ fontSize: "12px" }} />
              )}
            </button>
          </div>

          {/* Enter Playground CTA */}
          {/* <a
            href="/notebook"
            className="mt-6 px-6 py-2.5 text-[11px] font-medium tracking-widest text-[#ffffff] uppercase flat-border-btn"
          >
            ENTER PLAYGROUND →
          </a> */}
        </div>

        {/* Footer of Hero */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-[#5c5c5c] border-t border-[#1a1a1a] p-4 md:px-8 bg-[#060606] shrink-0 select-none">
          <span>ZERO DEPENDENCIES</span>
          <span>&lt; 43.4 KB GZIPPED</span>
          <span>HIGH-PERFORMANCE DATA PIPELINES</span>
        </div>
      </main>
    </>
  );
}
