import React from "react";
import type { SidebarSearchInputProps } from "./types";

export function SidebarSearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SidebarSearchInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={`relative flex flex-col group ${className}`}>
      <div className="relative flex items-center">
        {/* Minimal Search Icon with focus-driven luminescence */}
        <span
          className={`absolute left-0 pointer-events-none transition-colors duration-200 ${
            isFocused ? "text-white" : "text-text-dim group-hover:text-text-muted"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>

        {/* Borderless, translucent input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent pl-6 pr-6 pb-2 text-[13px] font-sans text-white placeholder:text-text-dim placeholder:text-[13px] placeholder:font-normal outline-none border-none tracking-wide"
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className="absolute right-0 pb-2 text-text-dim hover:text-white transition-colors cursor-pointer text-[12px] flex items-center justify-center"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Subtle bottom accent line that glows and expands on focus */}
      <div className="relative w-full h-[1px] bg-white/10 overflow-hidden">
        <div
          className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent transition-all duration-300 ease-out transform ${
            isFocused
              ? "opacity-100 scale-x-100"
              : "opacity-0 scale-x-50"
          }`}
        />
      </div>
    </div>
  );
}
