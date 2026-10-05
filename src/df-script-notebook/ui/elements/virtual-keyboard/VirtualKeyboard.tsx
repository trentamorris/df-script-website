import React from "react";
import { VirtualKeyboardProps } from "./types";
import { NUMBER_ROW, ALPHA_ROWS, ARROWS, MODIFIERS, LAYOUT_OPTIONS } from "./constants";

interface KeyButtonProps {
  keyId: string;
  label?: React.ReactNode;
  isSelected: boolean;
  onClick: (key: string) => void;
  className?: string;
  title?: string;
}

/** Atomic Key button helper: borderless, clean, with subtle depth */
function KeyButton({
  keyId,
  label,
  isSelected,
  onClick,
  className = "flex-1 min-w-[18px]",
  title,
}: KeyButtonProps) {
  const activeStyle =
    "bg-[#a8c7fa] text-[#041e49] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.3)]";

  const defaultStyle =
    "bg-white/[0.04] text-white/70 hover:bg-white/[0.09] hover:text-white active:bg-white/[0.12]";

  return (
    <button
      type="button"
      title={title || keyId}
      onClick={() => onClick(keyId)}
      className={`relative h-7 rounded-md border-0 transition-all flex items-center justify-center text-center select-none cursor-pointer ${
        isSelected ? activeStyle : defaultStyle
      } ${className}`}
    >
      {label || keyId}
    </button>
  );
}

export function VirtualKeyboard({
  layout = "qwerty",
  onLayoutChange,
  selectedKeys,
  onKeyToggle,
  className = "",
}: VirtualKeyboardProps) {
  const activeAlpha = ALPHA_ROWS[layout];
  const selectedKeySet = React.useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const has = (key: string) => selectedKeySet.has(key);

  return (
    <div
      className={`flex flex-col gap-1.5 p-2.5 bg-[#121214] rounded-xl shadow-inner text-[11px] font-mono select-none w-full box-border ${className}`}
    >
      {/* Integrated Layout Switcher Header */}
      {onLayoutChange && (
        <div className="flex items-center justify-between px-1 pb-1 border-b border-white/[0.04]">
          <span className="text-[10px] uppercase font-sans font-medium text-white/30 tracking-wider">
            Layout
          </span>
          <div className="flex items-center gap-0.5">
            {LAYOUT_OPTIONS.map((opt) => {
              const isActive = layout === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onLayoutChange(opt.value)}
                  className={`text-[9px] font-sans px-2 py-0.5 rounded transition-all border-0 cursor-pointer ${
                    isActive
                      ? "text-white bg-white/[0.12] font-semibold shadow-sm"
                      : "text-white/40 hover:text-white/80 hover:bg-white/[0.05]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 1: Numbers + Backspace */}
      <div className="flex gap-1 justify-between">
        {NUMBER_ROW.map((key) => (
          <KeyButton
            key={key}
            keyId={key}
            isSelected={has(key)}
            onClick={onKeyToggle}
          />
        ))}
        <KeyButton
          keyId="Backspace"
          label="⌫"
          isSelected={has("Backspace")}
          onClick={onKeyToggle}
          className="px-1.5 text-[9px]"
        />
      </div>

      {/* Row 2: Tab + Alpha Row 1 */}
      <div className="flex gap-1 justify-between">
        <KeyButton
          keyId="Tab"
          label="Tab"
          isSelected={has("Tab")}
          onClick={onKeyToggle}
          className="px-1.5 text-[9px]"
        />
        {activeAlpha.row1.map((key) => (
          <KeyButton
            key={key}
            keyId={key}
            isSelected={has(key)}
            onClick={onKeyToggle}
          />
        ))}
      </div>

      {/* Row 3: Esc + Alpha Row 2 + Enter */}
      <div className="flex gap-1 justify-between">
        <KeyButton
          keyId="Esc"
          label="Esc"
          isSelected={has("Esc")}
          onClick={onKeyToggle}
          className="px-1.5 text-[9px]"
        />
        {activeAlpha.row2.map((key) => (
          <KeyButton
            key={key}
            keyId={key}
            isSelected={has(key)}
            onClick={onKeyToggle}
          />
        ))}
        <KeyButton
          keyId="Enter"
          label="Enter ↵"
          isSelected={has("Enter")}
          onClick={onKeyToggle}
          className="px-2 text-[9px] font-medium"
        />
      </div>

      {/* Row 4: Shift + Alpha Row 3 */}
      <div className="flex gap-1 justify-between">
        <KeyButton
          keyId="Shift"
          label="⇧ Shift"
          isSelected={has("Shift")}
          onClick={onKeyToggle}
          className="px-2.5 text-[10px] font-medium"
        />
        {activeAlpha.row3.map((key) => (
          <KeyButton
            key={key}
            keyId={key}
            isSelected={has(key)}
            onClick={onKeyToggle}
          />
        ))}
      </div>

      {/* Row 5: Modifiers Bottom Row + Space + Arrows */}
      <div className="flex gap-1 items-center pt-0.5">
        <KeyButton
          keyId="Ctrl"
          isSelected={has("Ctrl")}
          onClick={onKeyToggle}
          className="px-2 text-[10px] font-medium"
        />
        <KeyButton
          keyId="Meta"
          label="⌘/⊞"
          isSelected={has("Meta")}
          onClick={onKeyToggle}
          className="px-1.5 text-[10px] font-medium"
        />
        <KeyButton
          keyId="Alt"
          isSelected={has("Alt")}
          onClick={onKeyToggle}
          className="px-2 text-[10px] font-medium"
        />
        <KeyButton
          keyId="Space"
          label="Space"
          isSelected={has("Space")}
          onClick={onKeyToggle}
          className="flex-1 text-[10px] font-medium"
        />

        {/* Arrow cluster */}
        <div className="flex gap-0.5">
          {ARROWS.map((arr) => {
            const symbol =
              arr === "ArrowLeft"
                ? "←"
                : arr === "ArrowUp"
                  ? "↑"
                  : arr === "ArrowDown"
                    ? "↓"
                    : "→";
            return (
              <KeyButton
                key={arr}
                keyId={arr}
                label={symbol}
                title={arr}
                isSelected={has(arr)}
                onClick={onKeyToggle}
                className="w-5 text-[10px]"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default VirtualKeyboard;
