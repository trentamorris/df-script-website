import React from "react";
import { Footer } from "../footer/Footer";

export function Support() {
  return (
    <main className="flex-grow overflow-y-auto p-12 bg-[#060606] h-full flex justify-center min-w-0 select-text">
      <div className="w-full max-w-2xl flex flex-col gap-12 pb-20">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight text-white font-outfit lowercase">
            support df-script
          </h1>
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-wider">
            zero-dependency open source DataFrame engine
          </p>
        </div>

        <div className="text-[13px] text-text-muted leading-relaxed flex flex-col gap-4">
          <p>
            We developed <strong>df-script</strong> because we wanted JavaScript and TypeScript developers to have access to a clean, fast, and unified DataFrame API that works identically in both browsers and Node.js backend servers.
          </p>
          <p>
            Maintaining an open-source project, optimizing calculation graphs, and responding to feature requests takes a significant amount of collective time and effort. If df-script has saved you development hours, improved your app's performance, or helped you in your workflow, please consider sponsoring our ongoing development!
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {/* Card 1: GitHub Sponsors */}
          <div className="border border-border-dark rounded bg-[#0c0c0c] p-6 flex flex-col justify-between gap-6 hover:border-[#fb7185]/50 transition-colors group">
            <div className="flex flex-col gap-3">
              <div className="text-[#fb7185]/90 group-hover:scale-110 transition-transform duration-300 w-fit">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold tracking-wider font-condensed uppercase text-white">GitHub Sponsors</h3>
              <p className="text-[11.5px] text-text-muted leading-relaxed">
                Support the project directly on GitHub. Sponsors receive special badges, priority issue review, and recognition in the repo's README.
              </p>
            </div>
            <a
              href="https://github.com/sponsors/trentamorris"
              target="_blank"
              rel="noreferrer"
              className="w-full text-center py-2 text-[10px] font-mono tracking-widest bg-transparent hover:bg-white text-white hover:text-black border border-border-dark hover:border-white transition-all uppercase font-semibold rounded"
            >
              Sponsor on Github
            </a>
          </div>

          {/* Card 2: Buy Me a Coffee */}
          <div className="border border-border-dark rounded bg-[#0c0c0c] p-6 flex flex-col justify-between gap-6 hover:border-[#facc15]/50 transition-colors group">
            <div className="flex flex-col gap-3">
              <div className="text-[#facc15] group-hover:scale-110 transition-transform duration-300 w-fit">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                  <path d="M2 21h18v-2H2v2zM20 8h-2V5h2v3zm2-5h-6v5h6V3zm-10 13c3.31 0 6-2.69 6-6H6c0 3.31 2.69 6 6 6zm-7-6c0-3.87 3.13-7 7-7s7 3.13 7 7H5z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold tracking-wider font-condensed uppercase text-white">Buy Me a Coffee</h3>
              <p className="text-[11.5px] text-text-muted leading-relaxed">
                Send a quick, one-time donation to keep developer fuel high. Perfect for showing appreciation for quick bug fixes or documentation additions.
              </p>
            </div>
            <a
              href="https://buymeacoffee.com/trentamorris"
              target="_blank"
              rel="noreferrer"
              className="w-full text-center py-2 text-[10px] font-mono tracking-widest bg-transparent hover:bg-white text-white hover:text-black border border-border-dark hover:border-white transition-all uppercase font-semibold rounded"
            >
              Send a Coffee
            </a>
          </div>

          {/* Card 3: Patreon */}
          <div className="border border-border-dark rounded bg-[#0c0c0c] p-6 flex flex-col justify-between gap-6 hover:border-[#f97316]/50 transition-colors group">
            <div className="flex flex-col gap-3">
              <div className="text-[#f97316] group-hover:scale-110 transition-transform duration-300 w-fit">
                <svg className="w-8.5 h-8.5 fill-current" viewBox="0 0 24 24">
                  <circle cx="14.8" cy="9.2" r="5.8" />
                  <rect x="5.2" y="3.4" width="3.2" height="17.2" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold tracking-wider font-condensed uppercase text-white">Patreon</h3>
              <p className="text-[11.5px] text-text-muted leading-relaxed">
                Join our Patreon community to unlock monthly supporter tiers, early access to next-gen updates, and exclusive roadmap polls.
              </p>
            </div>
            <a
              href="https://patreon.com/trentamorris"
              target="_blank"
              rel="noreferrer"
              className="w-full text-center py-2 text-[10px] font-mono tracking-widest bg-transparent hover:bg-white text-white hover:text-black border border-border-dark hover:border-white transition-all uppercase font-semibold rounded"
            >
              Join Patreon
            </a>
          </div>
        </div>
        <Footer className="pt-8" />
      </div>
    </main>
  );
}
