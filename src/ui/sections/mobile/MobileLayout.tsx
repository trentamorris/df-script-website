import React from "react";

export function MobileLayout() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#060606] text-[#9c9c9c] p-6 text-center select-none font-sans">
      <div className="flex flex-col gap-3 items-center">
        <span className="text-4xl animate-bounce">📱</span>
        <h1 className="text-lg font-semibold text-white uppercase font-outfit tracking-wider">Mobile View coming soon</h1>
        <p className="text-xs text-[#5c5c5c] max-w-[280px] leading-relaxed">
          The df-script workbench and documentation are optimized for larger desktop displays.
        </p>
      </div>
    </div>
  );
}
