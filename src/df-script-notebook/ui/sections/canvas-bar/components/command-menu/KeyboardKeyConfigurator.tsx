import React from "react";
import { NotebookCommand } from "./notebookCommands";
import { RestartAltRounded, CheckRounded } from "@mui/icons-material";
import { SlidingPill } from "../../../../elements/sliding-pill/SlidingPill";
import { SlidingPillOption } from "../../../../elements/sliding-pill/slidingPillTypes";
import { VirtualKeyboard } from "../../../../elements/virtual-keyboard/VirtualKeyboard";
import { VirtualKeyboardLayoutType } from "../../../../elements/virtual-keyboard/types";
import { LAYOUT_OPTIONS, MODIFIERS } from "../../../../elements/virtual-keyboard/constants";

export interface KeyboardKeyConfiguratorProps {
  command: NotebookCommand;
  currentBinding: string;
  onSave: (newBinding: string) => void;
  onBack: () => void;
}

/** Parses a standard keybinding string like "Ctrl + Shift + L" or "D, D" into active keys */
function parseKeybinding(binding: string): string[] {
  if (!binding) return [];
  if (binding.includes(" + ")) {
    return binding.split(" + ").map((k) => k.trim());
  }
  return [binding.trim()];
}

/** Formats an array of keys back to standard keybinding format */
function formatKeybinding(keys: string[]): string {
  if (keys.length === 0) return "Unassigned";

  // Sort modifiers first
  const mods = keys.filter((k) => MODIFIERS.includes(k as any));
  const nonMods = keys.filter((k) => !MODIFIERS.includes(k as any));

  return [...mods, ...nonMods].join(" + ");
}

export function KeyboardKeyConfigurator({
  command,
  currentBinding,
  onSave,
  onBack,
}: KeyboardKeyConfiguratorProps) {
  const [layout, setLayout] = React.useState<VirtualKeyboardLayoutType>("qwerty");
  const [selectedKeys, setSelectedKeys] = React.useState<string[]>(() =>
    parseKeybinding(currentBinding || command.defaultKeybinding)
  );

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const isMod = MODIFIERS.includes(key as any);

      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }

      if (isMod) {
        return [...prev, key];
      }

      // Non-modifier: replace existing non-modifier key
      const existingMods = prev.filter((k) => MODIFIERS.includes(k as any));
      return [...existingMods, key];
    });
  };

  const formattedBinding = formatKeybinding(selectedKeys);

  const handleReset = () => {
    setSelectedKeys(parseKeybinding(command.defaultKeybinding));
  };

  const handleSave = () => {
    onSave(formattedBinding);
    onBack();
  };

  return (
    <div className="flex flex-col gap-2.5 max-w-[360px] select-none">
      {/* Keyboard Layout Switcher on its own clean row */}
      <div className="flex items-center justify-between pb-1">
        <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
          Keyboard Layout
        </span>
        <SlidingPill<VirtualKeyboardLayoutType>
          options={LAYOUT_OPTIONS}
          activeValue={layout}
          onChange={(val: VirtualKeyboardLayoutType) => setLayout(val)}
          height={26}
        />
      </div>

      {/* Preview Display Bar */}
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/[0.08]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mr-1">
            Binding:
          </span>
          {selectedKeys.length > 0 ? (
            selectedKeys.map((k) => {
              const isMod = MODIFIERS.includes(k as any);
              return (
                <kbd
                  key={k}
                  className={`px-2.5 py-1 text-xs font-mono font-semibold rounded border shadow-sm ${
                    isMod
                      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  }`}
                >
                  {k}
                </kbd>
              );
            })
          ) : (
            <span className="text-xs text-zinc-500 italic">None selected</span>
          )}
        </div>
      </div>

      {/* Standalone Reusable Virtual Keyboard Element */}
      <VirtualKeyboard
        layout={layout}
        selectedKeys={selectedKeys}
        onKeyToggle={toggleKey}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.08]">
        {/* Reset to default */}
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all active:scale-95"
          title="Reset to default keybinding"
        >
          <RestartAltRounded sx={{ fontSize: 15 }} />
          <span>Reset Default</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md transition-all active:scale-95"
          >
            <CheckRounded sx={{ fontSize: 14 }} />
            <span>Save Binding</span>
          </button>
        </div>
      </div>
    </div>
  );
}
