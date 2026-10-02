import React from "react";
import { VirtualKeyboardProps } from "./types";
import { NUMBER_ROW, ALPHA_ROWS, ARROWS, MODIFIERS } from "./constants";

interface KeyButtonProps {
  keyId: string;
  label?: React.ReactNode;
  isSelected: boolean;
  onClick: (key: string) => void;
  className?: string;
  title?: string;
}

/** Atomic Key button helper to eliminate repetitive markup and styling */
function KeyButton({
  keyId,
  label,
  isSelected,
  onClick,
  className = "flex-1 min-w-[18px]",
  title,
}: KeyButtonProps) {
  const isMod = (MODIFIERS as readonly string[]).includes(keyId);

  const activeStyle = isMod
    ? "bg-blue-600/30 border-blue-500 text-blue-300 font-semibold shadow-[0_0_8px_rgba(59,130,246,0.3)]"
    : "bg-emerald-500/30 border-emerald-500 text-emerald-300 font-semibold shadow-[0_0_8px_rgba(16,185,129,0.3)]";

  const defaultStyle = isMod
    ? "bg-white/[0.05] border-white/[0.07] text-white/70 hover:bg-white/[0.12] hover:text-white"
    : "bg-white/[0.05] border-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white";

  return (
    <button
      type="button"
      title={title || keyId}
      onClick={() => onClick(keyId)}
      className={`h-6 rounded border transition-all flex items-center justify-center text-center ${
        isSelected ? activeStyle : defaultStyle
      } ${className}`}
    >
      {label || keyId}
    </button>
  );
}

export function VirtualKeyboard({
  layout = "qwerty",
  selectedKeys,
  onKeyToggle,
  className = "",
}: VirtualKeyboardProps) {
  const activeAlpha = ALPHA_ROWS[layout];
  const has = (key: string) => selectedKeys.includes(key);

  return (
    <div
      className={`flex flex-col gap-1 p-2 bg-[#121214] rounded-xl border border-white/[0.08] shadow-inner text-[11px] font-mono select-none ${className}`}
    >
      {/* Row 1: Numbers + Backspace */}
      <div className="flex gap-1 justify-between">
        {NUMBER_ROW.map((key) => (
          <KeyButton key={key} keyId={key} isSelected={has(key)} onClick={onKeyToggle} />
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
          <KeyButton key={key} keyId={key} isSelected={has(key)} onClick={onKeyToggle} />
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
          <KeyButton key={key} keyId={key} isSelected={has(key)} onClick={onKeyToggle} />
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
          <KeyButton key={key} keyId={key} isSelected={has(key)} onClick={onKeyToggle} />
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
