import React from "react";
import clsx from "clsx";
import { ToggleButtonGroup, ToggleButton } from "@mui/material";
import { SlidingPillProps } from "./slidingPillTypes";
import styles from "./slidingPill.module.css";

export function SlidingPill<T extends string>({
  options,
  activeValue,
  onChange,
  height,
  radius,
}: SlidingPillProps<T>) {
  const groupRef = React.useRef<HTMLDivElement | null>(null);
  const [pillStyle, setPillStyle] = React.useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const activeVal = React.useMemo(() => {
    return options.find((o) => o.value === activeValue)?.value ?? "";
  }, [options, activeValue]);

  const handleOptionsChange = React.useCallback(
    (_: React.MouseEvent<HTMLElement>, newValue: T | null) => {
      if (newValue !== null) onChange(newValue);
    },
    [onChange]
  );

  const measure = React.useCallback(() => {
    const group = groupRef.current;
    if (!group) return;

    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>(".MuiToggleButton-root:not(.overlay)"));
    if (!buttons || buttons.length === 0) return;

    const activeBtn = buttons.find((btn) => btn.getAttribute("value") === String(activeValue));
    if (!activeBtn) return;

    const groupRect = group.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    setPillStyle({
      left: btnRect.left - groupRect.left,
      width: btnRect.width,
    });
  }, [activeValue]);

  React.useLayoutEffect(() => {
    measure();
  }, [measure]);

  React.useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const ro = new ResizeObserver(measure);
    ro.observe(group);
    return () => ro.disconnect();
  }, [measure]);

  const containerStyle = React.useMemo<React.CSSProperties>(() => {
    const customStyle: Record<string, string | number> = {};
    if (height !== undefined) {
      customStyle["--sliding-pill-height"] = `${height}px`;
    }
    if (radius !== undefined) {
      customStyle["--sliding-pill-border-radius"] = typeof radius === "number" ? `${radius}px` : radius;
    }
    return customStyle as React.CSSProperties;
  }, [height, radius]);

  return (
    <div
      className={clsx(styles.slidingPillContainer, "relative")}
      style={containerStyle}
    >
      <ToggleButtonGroup
        ref={groupRef}
        value={activeValue}
        exclusive
        onChange={handleOptionsChange}
      >
        {options.map((opt) => (
          <ToggleButton
            disableRipple={true}
            className="[border:unset] whitespace-nowrap text-inherit"
            key={opt.value}
            value={opt.value}
          >
            {opt.label}
          </ToggleButton>
        ))}
        <ToggleButton
          value={activeVal}
          className="overlay !absolute flex items-center justify-center whitespace-nowrap pointer-events-none"
          sx={{
            top: "2px",
            left: 0,
            height: "calc(100% - 4px) !important",
            width: pillStyle.width,
            transform: `translate3d(${pillStyle.left}px, 0, 0)`,
            willChange: "transform, width",
            transition: "transform 240ms cubic-bezier(0.16, 1, 0.3, 1), width 240ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </ToggleButtonGroup>
    </div>
  );
}

export default SlidingPill;
