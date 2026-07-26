import React from "react";

export const MOBILE_BREAKPOINT_BOUNDS_PX = { lower: 0, upper: 768 } as const;
export const TABLET_BREAKPOINT_BOUNDS_PX = { lower: 769, upper: 1024 } as const;
export const DESKTOP_BREAKPOINT_BOUNDS_PX = { lower: 1025, upper: Infinity } as const;

export type DeviceType = "mobile" | "tablet" | "desktop";
export type BrowserType = "Chrome" | "Firefox" | "Safari" | "Edge" | "Unknown";
export type OSType = "Windows" | "MacOS" | "iOS" | "Android" | "Linux" | "Unknown";
export type OrientationType = "portrait" | "landscape";
export type ThemeType = "dark" | "light";

export interface LayoutDetails {
  width: number;
  height: number;
  defaultScrollbarWidth: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  device: DeviceType;
  browser: BrowserType;
  os: OSType;
  orientation: OrientationType;
  isTouch: boolean;
  theme: ThemeType;
}

const LayoutContext = React.createContext<LayoutDetails | null>(null);

const getBrowser = (ua: string): BrowserType => {
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("Chrome") && !ua.includes("Chromium")) return "Chrome";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Firefox")) return "Firefox";
  return "Unknown";
};

const getOS = (ua: string): OSType => {
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Macintosh")) return "MacOS";
  if (ua.includes("like Mac OS X")) return "iOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("Linux")) return "Linux";
  return "Unknown";
};

const calculateScrollbarWidth = (): number => {
  if (typeof document === "undefined") return 0;
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.overflow = "scroll";
  outer.style.width = "100px";
  document.body.appendChild(outer);
  const widthNoScroll = outer.clientWidth;
  const width = 100 - widthNoScroll;
  if (outer.parentNode) {
    outer.parentNode.removeChild(outer);
  }
  return width;
};

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [dimensions, setDimensions] = React.useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1280,
    height: typeof window !== "undefined" ? window.innerHeight : 800
  });
  const [defaultScrollbarWidth, setDefaultScrollbarWidth] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Calculate scrollbar width once DOM is ready
    setDefaultScrollbarWidth(calculateScrollbarWidth());

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;

  // Breakpoints evaluated using structured bounds
  const isMobile = width >= MOBILE_BREAKPOINT_BOUNDS_PX.lower && width <= MOBILE_BREAKPOINT_BOUNDS_PX.upper;
  const isTablet = width >= TABLET_BREAKPOINT_BOUNDS_PX.lower && width <= TABLET_BREAKPOINT_BOUNDS_PX.upper;
  const isDesktop = width >= DESKTOP_BREAKPOINT_BOUNDS_PX.lower;

  const device = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
  const orientation = height > width ? "portrait" : "landscape";

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = getBrowser(ua);
  const os = getOS(ua);

  const isTouch = typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  const theme = typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  // Set CSS Variables & Data Attributes on document root
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.style.setProperty("--viewport-width", `${width}px`);
    root.style.setProperty("--viewport-height", `${height}px`);
    root.style.setProperty("--default-scrollbar-width-px", `${defaultScrollbarWidth}px`);

    // Synced breakpoint bounds
    root.style.setProperty("--breakpoint-mobile-lower-px", `${MOBILE_BREAKPOINT_BOUNDS_PX.lower}px`);
    root.style.setProperty("--breakpoint-mobile-upper-px", `${MOBILE_BREAKPOINT_BOUNDS_PX.upper}px`);
    root.style.setProperty("--breakpoint-tablet-lower-px", `${TABLET_BREAKPOINT_BOUNDS_PX.lower}px`);
    root.style.setProperty("--breakpoint-tablet-upper-px", `${TABLET_BREAKPOINT_BOUNDS_PX.upper}px`);
    root.style.setProperty("--breakpoint-desktop-lower-px", `${DESKTOP_BREAKPOINT_BOUNDS_PX.lower}px`);

    root.setAttribute("data-device", device);
    root.setAttribute("data-browser", browser.toLowerCase());
    root.setAttribute("data-os", os.toLowerCase());
    root.setAttribute("data-orientation", orientation);
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-touch", String(isTouch));
  }, [width, height, defaultScrollbarWidth, device, browser, os, orientation, theme, isTouch]);

  const value: LayoutDetails = {
    width,
    height,
    defaultScrollbarWidth,
    isMobile,
    isTablet,
    isDesktop,
    device,
    browser,
    os,
    orientation,
    isTouch,
    theme
  };

  return React.createElement(LayoutContext.Provider, { value }, children);
}

export function useLayout(): LayoutDetails {
  const context = React.useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
