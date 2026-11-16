import React from "react";
import { Search, Close } from "@mui/icons-material";
import type { SearchInputProps } from "./types";

export function SearchInput({
  value,
  onChange,
  placeholder = "Type to Search",
  className = "",
  variant = "base",
}: SearchInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isPill = variant === "pill";
  const isUnderline = variant === "underline";

  return (
    <div
      className={`relative flex group transition-colors ${isPill
        ? `items-center w-full rounded-full bg-[#141414] px-4 py-2.5 ${className}`
        : `flex-col ${className}`
        }`}
    >
      <div className={`relative flex items-center ${isPill ? "w-full" : ""}`}>
        {/* Search Icon */}
        <span
          className={`flex items-center justify-center pointer-events-none transition-colors duration-200 shrink-0 ${isPill
            ? `mr-2.5 ${isFocused ? "text-white" : "text-zinc-200"}`
            : `absolute left-0 bottom-3 ${isFocused ? "text-white" : "text-zinc-200 group-hover:text-white"}`
            }`}
        >
          <Search sx={{ fontSize: { xs: 20, md: 18 } }} />
        </span>

        {/* Search Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`bg-transparent text-[16px] md:text-[14px] font-bold leading-none font-sans text-white placeholder:text-zinc-300 placeholder:text-[16px] md:placeholder:text-[14px] placeholder:font-bold outline-none border-none tracking-normal ${isPill ? "flex-1 min-w-0" : "w-full pl-8 md:pl-7 pr-7 pt-1 pb-3"
            }`}
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className={`w-5 h-5 flex items-center justify-center text-white hover:opacity-80 transition-opacity cursor-pointer shrink-0 ${isPill ? "ml-1.5" : "absolute right-0 bottom-2"
              }`}
            title="Clear search"
            aria-label="Clear search"
          >
            <Close sx={{ fontSize: { xs: 20, md: 18 }, stroke: "currentColor", strokeWidth: 1.2 }} />
          </button>
        )}
      </div>

      {/* Focus indicator: subtle center-expanding underline (underline variant only) */}
      {isUnderline && (
        <div className="relative w-full h-[1px] overflow-hidden">
          <div
            className={`h-full w-full bg-white/40 transition-transform duration-250 ease-out origin-center ${isFocused ? "scale-x-100" : "scale-x-0"
              }`}
          />
        </div>
      )}
    </div>
  );
}

