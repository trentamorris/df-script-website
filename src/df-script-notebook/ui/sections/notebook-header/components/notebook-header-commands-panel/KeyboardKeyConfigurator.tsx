import React from "react";
import { ALL_NOTEBOOK_COMMANDS } from "../../../../../commands";
import { NotebookCommand } from "../../../../../types";
import { VirtualKeyboard } from "../../../../elements/virtual-keyboard/VirtualKeyboard";
import { VirtualKeyboardLayoutType } from "../../../../elements/virtual-keyboard/types";
import { MODIFIERS, ALPHA_ROWS } from "../../../../elements/virtual-keyboard/constants";
import { Chip } from "../../../../elements";
import {
  StrikeThroughIcon,
  UndoIcon,
  RedoIcon,
  RecordMicIcon,
} from "../../../../../svgs";

export interface KeyboardKeyConfiguratorProps {
  command: NotebookCommand;
  currentBinding: string;
  allBindings?: Record<string, string>;
  onSave: (newBinding: string) => void;
  onBack: () => void;
}

/** Parses a standard keybinding string like "Ctrl + Shift + L" or "D, D" into active keys */
function parseKeybinding(binding: string): string[] {
  if (!binding) return [];
  if (binding.includes(", ")) {
    return binding.split(", ").map((k) => k.trim());
  }
  if (binding.includes(" + ")) {
    return binding.split(" + ").map((k) => k.trim());
  }
  return [binding.trim()];
}

/** Formats an array of keys back to standard keybinding format */
function formatKeybinding(keys: string[]): string {
  if (keys.length === 0) return "Unassigned";

  const mods = keys.filter((k) => MODIFIERS.includes(k as any));
  const nonMods = keys.filter((k) => !MODIFIERS.includes(k as any));

  // If there are no modifiers and multiple repeated/sequential keys (e.g. ["D", "D"] or ["0", "0"]), format with commas
  if (mods.length === 0 && nonMods.length > 1) {
    return nonMods.join(", ");
  }

  return [...mods, ...nonMods].join(" + ");
}

/** Normalizes a key identifier from KeyboardEvent to our standard representation */
function normalizeEventKey(e: KeyboardEvent): string | null {
  if (e.key === "Control") return "Ctrl";
  if (e.key === "Shift") return "Shift";
  if (e.key === "Alt") return "Alt";
  if (e.key === "Meta") return "Meta";
  if (e.key === "Escape") return "Esc";
  if (e.key === "Enter") return "Enter";
  if (e.key === "Backspace") return "Backspace";
  if (e.key === "Tab") return "Tab";
  if (e.key === " ") return "Space";
  if (e.key === "ArrowUp") return "ArrowUp";
  if (e.key === "ArrowDown") return "ArrowDown";
  if (e.key === "ArrowLeft") return "ArrowLeft";
  if (e.key === "ArrowRight") return "ArrowRight";

  if (e.key.length === 1) {
    return e.key.toUpperCase();
  }
  return null;
}

export function KeyboardKeyConfigurator({
  command,
  currentBinding,
  allBindings = {},
  onSave,
  onBack,
}: KeyboardKeyConfiguratorProps) {
  const [layout, setLayout] = React.useState<VirtualKeyboardLayoutType>("qwerty");

  // History stacks for Undo / Redo
  const initialKeys = React.useMemo(
    () => parseKeybinding(currentBinding || command.defaultKeybinding),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [selectedKeys, setSelectedKeys] = React.useState<string[]>(initialKeys);
  const [historyPast, setHistoryPast] = React.useState<string[][]>([]);
  const [historyFuture, setHistoryFuture] = React.useState<string[][]>([]);

  // Subtle shake state for the (x/4) counter
  const [isShaking, setIsShaking] = React.useState(false);

  // Physical keyboard listening mode
  const [isListening, setIsListening] = React.useState(false);

  const MAX_KEYS = 4;

  const triggerShake = () => {
    setIsShaking(false);
    requestAnimationFrame(() => {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 380);
    });
  };

  const updateKeysWithHistory = (newKeys: string[]) => {
    setHistoryPast((prev) => [...prev, selectedKeys]);
    setHistoryFuture([]);
    setSelectedKeys(newKeys);
  };

  const handleUndo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((prev) => prev.slice(0, prev.length - 1));
    setHistoryFuture((prev) => [selectedKeys, ...prev]);
    setSelectedKeys(previous);
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((prev) => prev.slice(1));
    setHistoryPast((prev) => [...prev, selectedKeys]);
    setSelectedKeys(next);
  };

  // Appending key on click up to MAX_KEYS
  const handleKeyClick = (key: string) => {
    if (selectedKeys.length >= MAX_KEYS) {
      triggerShake();
      return;
    }
    updateKeysWithHistory([...selectedKeys, key]);
  };

  // Remove specific key instance by its index in the sequence
  const removeKeyAtIndex = (index: number) => {
    updateKeysWithHistory(selectedKeys.filter((_, i) => i !== index));
  };

  const formattedBinding = formatKeybinding(selectedKeys);

  const handleReset = () => {
    updateKeysWithHistory(parseKeybinding(command.defaultKeybinding));
  };

  const handleSave = () => {
    onSave(formattedBinding);
    onBack();
  };

  // Collision detection against other commands in the system
  const collisionCommand = React.useMemo(() => {
    if (!formattedBinding || formattedBinding === "Unassigned") return null;

    for (const cmd of ALL_NOTEBOOK_COMMANDS) {
      if (cmd.id === command.id) continue;
      // In same mode / scope or global
      const cmdBinding = allBindings[cmd.id] || cmd.defaultKeybinding;
      if (cmdBinding === formattedBinding) {
        return cmd;
      }
    }
    return null;
  }, [formattedBinding, command.id, allBindings]);

  // Global physical keyboard capture during Listening Mode with pause & inactivity timeout
  React.useEffect(() => {
    if (!isListening) return;

    // Clear binding when entering listening mode so the user starts fresh
    updateKeysWithHistory([]);

    // Inactivity timeout: automatically ends if no key pressed for 6 seconds
    const inactivityTimer = setTimeout(() => {
      setIsListening(false);
    }, 6000);

    let debounceFinishTimer: NodeJS.Timeout | null = null;
    let recordedSequence: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape exits listening mode immediately
      if (e.key === "Escape") {
        if (debounceFinishTimer) clearTimeout(debounceFinishTimer);
        setIsListening(false);
        return;
      }

      const keyName = normalizeEventKey(e);
      const isModifierOnly =
        keyName === "Ctrl" || keyName === "Shift" || keyName === "Alt" || keyName === "Meta";

      const hasModifiers = e.ctrlKey || e.metaKey || e.altKey;

      if (hasModifiers) {
        // Chord combination (e.g. Ctrl + Shift + L)
        const chord: string[] = [];
        if (e.ctrlKey) chord.push("Ctrl");
        if (e.metaKey) chord.push("Meta");
        if (e.altKey) chord.push("Alt");
        if (e.shiftKey) chord.push("Shift");
        if (keyName && !chord.includes(keyName)) {
          chord.push(keyName);
        }
        recordedSequence = chord.slice(0, MAX_KEYS);
        updateKeysWithHistory(recordedSequence);
      } else if (!isModifierOnly && keyName) {
        // Sequential keypress without modifiers (e.g. D then D -> D, D)
        if (e.shiftKey && keyName.length === 1) {
          // e.g. Shift + V chord
          recordedSequence = ["Shift", keyName].slice(0, MAX_KEYS);
        } else {
          // Append sequential key press (supports repeated keys like D, D or 0, 0)
          if (recordedSequence.length < MAX_KEYS) {
            recordedSequence = [...recordedSequence, keyName];
          }
        }
        updateKeysWithHistory(recordedSequence);
      } else if (isModifierOnly) {
        // Holding modifier standalone
        if (keyName && recordedSequence.length === 0) {
          updateKeysWithHistory([keyName]);
        }
      }

      if (recordedSequence.length > 0) {
        // Reset debounce timer on every keystroke: finishes 900ms after user stops pressing
        if (debounceFinishTimer) clearTimeout(debounceFinishTimer);
        debounceFinishTimer = setTimeout(() => {
          setIsListening(false);
        }, 900);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      clearTimeout(inactivityTimer);
      if (debounceFinishTimer) clearTimeout(debounceFinishTimer);
    };
  }, [isListening]);

  // Check if character key exists on the active layout
  const isKeyInLayout = (key: string) => {
    if (key.length !== 1 || (key >= "0" && key <= "9")) return true;
    const { row1, row2, row3 } = ALPHA_ROWS[layout];
    return row1.includes(key) || row2.includes(key) || row3.includes(key);
  };

  return (
    <div className="flex flex-col gap-2 w-full select-none">
      {/* Preview Display Bar - fixed min-h-[32px] with Undo/Redo */}
      <div className="flex items-center justify-between min-h-[32px] px-0.5">
        <div className="flex items-center gap-1.5 flex-wrap min-h-[26px]">
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold mr-1 leading-none select-none">
            Binding{" "}
            <span
              className={`inline-block font-normal text-white/30 lowercase transition-transform ${
                isShaking ? "animate-subtle-shake text-amber-400 font-semibold" : ""
              }`}
            >
              ({selectedKeys.length}/{MAX_KEYS})
            </span>
            :
          </span>
          {selectedKeys.length > 0 ? (
            selectedKeys.map((k, index) => {
              const inLayout = isKeyInLayout(k);
              return (
                <kbd
                  key={`${k}-${index}`}
                  onClick={() => removeKeyAtIndex(index)}
                  title={
                    inLayout
                      ? "Click to remove"
                      : `Not on ${layout.toUpperCase()} keyboard • Click to remove`
                  }
                  className={`group relative inline-flex items-center justify-center px-2.5 h-[26px] text-xs font-mono font-bold rounded-md border-0 bg-[#a8c7fa] text-[#041e49] shadow-[0_1px_4px_rgba(0,0,0,0.3)] cursor-pointer select-none transition-all active:scale-95 hover:bg-[#90b8f8] ${
                    inLayout ? "opacity-100" : "opacity-40 hover:opacity-80"
                  }`}
                >
                  {/* Key label - stays visible and dims slightly on hover */}
                  <span className="transition-opacity duration-150 group-hover:opacity-60 leading-none">
                    {k}
                  </span>

                  {/* Clean diagonal strike-through slash that draws across the key on hover */}
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none text-red-500">
                    <StrikeThroughIcon />
                  </span>
                </kbd>
              );
            })
          ) : (
            <span className="inline-flex items-center h-[26px] text-xs text-white/30 italic leading-none">
              None selected
            </span>
          )}
        </div>

        {/* Undo & Redo History Controls */}
        <div className="flex items-center gap-0.5 shrink-0 ml-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyPast.length === 0}
            title="Undo key change (Back)"
            className={`w-7 h-7 rounded-md flex items-center justify-center border-0 transition-all ${
              historyPast.length > 0
                ? "text-white/80 hover:text-white hover:bg-white/[0.08] active:scale-95 cursor-pointer"
                : "text-white/20 cursor-not-allowed"
            }`}
          >
            <UndoIcon />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={historyFuture.length === 0}
            title="Redo key change (Forward)"
            className={`w-7 h-7 rounded-md flex items-center justify-center border-0 transition-all ${
              historyFuture.length > 0
                ? "text-white/80 hover:text-white hover:bg-white/[0.08] active:scale-95 cursor-pointer"
                : "text-white/20 cursor-not-allowed"
            }`}
          >
            <RedoIcon />
          </button>
        </div>
      </div>

      {/* Main interactive area: Virtual Keyboard OR Pure Sound Wave Listening Line */}
      {isListening ? (
        <div className="h-[188px] w-full flex flex-col items-center justify-center gap-4 select-none">
          {/* Pure animated sound wave line matching user's image */}
          <div className="flex items-center justify-center gap-[4px] h-8 px-4">
            {Array.from({ length: 48 }).map((_, i) => {
              // Sound wave profile: higher in the middle sections, subtle on the edges
              const centerDist = Math.abs(i - 24);
              const maxH = Math.max(3, 20 - centerDist * 0.6);
              const height = 3 + ((i * 5) % Math.round(maxH));
              const delay = (i * 0.035).toFixed(2);
              const duration = (0.6 + (i % 6) * 0.12).toFixed(2);

              return (
                <span
                  key={i}
                  style={{
                    height: `${height}px`,
                    animation: `waveformPulse ${duration}s ease-in-out ${delay}s infinite alternate`,
                  }}
                  className="w-[2.5px] rounded-full bg-white/70"
                />
              );
            })}
          </div>

          {/* Subtext info */}
          <div className="flex flex-col items-center gap-1 text-center">
            <span className="text-xs text-white/70 font-medium">
              Listening for keystrokes...
            </span>
            <span className="text-[10px] text-white/35">
              Pause typing or press <kbd className="font-mono text-white/50">Esc</kbd> to finish
            </span>
          </div>
        </div>
      ) : (
        <VirtualKeyboard
          layout={layout}
          onLayoutChange={setLayout}
          selectedKeys={selectedKeys}
          onKeyToggle={handleKeyClick}
        />
      )}

      {/* Reserved Collision Warning Slot - fixed min-h-[22px] prevents layout shifts */}
      <div className="min-h-[22px] flex items-center justify-center px-1">
        {collisionCommand ? (
          <div className="text-[11px] text-amber-400/90 font-medium tracking-tight">
            Replaces &ldquo;{collisionCommand.name}&rdquo; ({allBindings[collisionCommand.id] || collisionCommand.defaultKeybinding})
          </div>
        ) : (
          <div className="h-[22px] opacity-0 pointer-events-none" />
        )}
      </div>

      {/* Action Buttons with Centered Physical Record / Mic Button */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {/* Reset to default */}
        <Chip onClick={handleReset} title="Reset to default keybinding">
          Reset Default
        </Chip>

        {/* Center: Record from Physical Keyboard Button */}
        <button
          type="button"
          onClick={() => setIsListening((prev) => !prev)}
          title="Record shortcut directly from physical keyboard"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-0 transition-all cursor-pointer ${
            isListening
              ? "bg-[#a8c7fa] text-[#041e49] shadow-[0_0_12px_rgba(168,199,250,0.4)]"
              : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white"
          }`}
        >
          <RecordMicIcon />
          <span>{isListening ? "Listening..." : "Record Key"}</span>
        </button>

        <div className="flex items-center gap-2">
          <Chip variant="muted" onClick={onBack}>
            Cancel
          </Chip>
          <Chip variant="primary" onClick={handleSave}>
            Save
          </Chip>
        </div>
      </div>
    </div>
  );
}

