import React from "react";
import { Search, Close } from "@mui/icons-material";
import type { SearchInputProps } from "./types";

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchInputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={`relative flex flex-col group ${className}`}>
      <div className="relative flex items-center">
        {/* Search Icon with focus-driven luminescence */}
        <span
          className={`absolute left-0 bottom-3 flex items-center justify-center pointer-events-none transition-colors duration-200 ${isFocused ? "text-white" : "text-[#c2c2c2] group-hover:text-white"
            }`}
        >
          <Search sx={{ fontSize: 18 }} />
        </span>

        {/* Clean input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent pl-7 pr-7 pt-1 pb-3 text-[14px] font-medium leading-none font-sans text-white placeholder:text-neutral-400 placeholder:text-[14px] placeholder:font-medium outline-none border-none tracking-normal"
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            className={`absolute right-0 bottom-2.5 w-5 h-5 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer ${isFocused
                ? "text-white hover:bg-white/15"
                : "text-[#c2c2c2] hover:text-white hover:bg-white/10"
              }`}
            title="Clear search"
          >
            <Close sx={{ fontSize: 13 }} />
          </button>
        )}
      </div>

      {/* Focus indicator: subtle center-expanding underline */}
      <div className="relative w-full h-[1px] overflow-hidden">
        <div
          className={`h-full w-full bg-white/40 transition-transform duration-250 ease-out origin-center ${isFocused ? "scale-x-100" : "scale-x-0"
            }`}
        />
      </div>
    </div>
  );
}
