import React from "react";
import { ContentCopy } from "@mui/icons-material";
import { GalaxyLogo, WaveLogo } from "../../../elements";
import { useCopyToClipboard } from "../../../../hooks/useCopyToClipboard";
import { useLayout } from "../../../../hooks/useLayout";
import { useBackgroundTheme } from "../../../../hooks/useBackgroundTheme";

export function Home() {
  const { copy, isCopied } = useCopyToClipboard();
  const { isMobile } = useLayout();
  const { backgroundTheme } = useBackgroundTheme();
  const [copyPulse, setCopyPulse] = React.useState(0);

  const handleCopy = () => {
    copy("npm install df-script", "install");
    setCopyPulse((prev) => prev + 1);
  };

  return (
    <>
      {/* <MagneticParticles /> */}
      <main className="flex-grow overflow-hidden h-full flex flex-col justify-between min-w-0 min-h-0 relative z-10">

        {/* Centered Hero Contents with subtle ambient cosmic glow */}
        <div className="relative flex flex-col items-center justify-center text-center gap-6 max-w-2xl mx-auto flex-grow px-6 py-4 md:py-20 overflow-hidden w-full h-full">
          {/* Soft cosmic nebula depth aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[280px] bg-gradient-to-tr from-sky-500/10 via-blue-600/5 to-purple-500/5 blur-3xl pointer-events-none rounded-full -z-10" />

          {backgroundTheme === "galaxy" ? (
            <GalaxyLogo
              text="df-script"
              className={isMobile ? "" : "animate-fade-in"}
              triggerPulse={copyPulse}
              skipIntro={isMobile}
            />
          ) : (
            <WaveLogo
              text="df-script"
              className={isMobile ? "" : "animate-fade-in"}
              triggerPulse={copyPulse}
              skipIntro={isMobile}
            />
          )}

          <div className={isMobile ? "max-w-lg" : "animate-hero-desc max-w-lg"}>
            <p
              className={`text-sm md:text-base diamond-glisten leading-relaxed select-none transition-all duration-300 ${
                backgroundTheme === "wave"
                  ? "[--base-color:#e0f2fe] [--glint-color:#ffffff] [--glint-prism:#7dd3fc] drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                  : "[--base-color:#9c9c9c] [--glint-color:#ffffff] [--glint-prism:#dbeafe]"
              }`}
            >
              A zero-dependency, high-performance, expression-based DataFrame engine designed for lightning-fast data processing in JavaScript and TypeScript.
            </p>
          </div>

          {/* Quick Install Pill with subtle cosmic hover border */}
          <div className={isMobile ? "w-full max-w-sm mt-2" : "animate-hero-pill w-full max-w-sm mt-2"}>
            <div className="group flex items-center justify-between gap-4 p-2 px-4 rounded bg-[#0a0a0a]/90 backdrop-blur-sm border border-[#1e1e1e] hover:border-sky-500/30 transition-all duration-300 font-mono text-[11px] text-[#e5e5e5] w-full shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] hover:shadow-[0_0_25px_-5px_rgba(56,189,248,0.12)]">
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
          </div>

          {/* Enter Playground CTA */}
          {/* <a
            href="/notebook"
            className="mt-6 px-6 py-2.5 text-[11px] font-medium tracking-widest text-[#ffffff] uppercase flat-border-btn"
          >
            ENTER PLAYGROUND →
          </a> */}
        </div>

        {/* Footer of Hero (hidden on mobile, shown on md+ screens) */}
        <div
          className={`hidden md:grid w-full grid-cols-3 items-center text-[10px] font-mono p-4 md:px-8 bg-transparent shrink-0 select-none transition-colors duration-300 ${
            backgroundTheme === "wave"
              ? "text-sky-200/75 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]"
              : "text-[#5c5c5c]"
          }`}
        >
          <span className="text-left">ZERO DEPENDENCIES</span>
          <span className="text-center">&lt; 43.4 KB GZIPPED</span>
          <span className="text-right">HIGH-PERFORMANCE DATA PIPELINES</span>
        </div>
      </main>
    </>
  );
}
