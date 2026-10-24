import React from "react";
import {
  Home,
  HomeOutlined,
  Search,
  Info,
  InfoOutlined,
  Favorite,
  FavoriteBorder,
} from "@mui/icons-material";
import { ABOUT_PATH, SUPPORT_PATH } from "../../desktop/constants";
import { SEARCH_PATH } from "../constants";

interface MobileBottomNavProps {
  currentPath: string;
  style?: React.CSSProperties;
  className?: string;
}

export function MobileBottomNav({
  currentPath,
  style,
  className,
}: MobileBottomNavProps) {
  const isSearchActive = currentPath === SEARCH_PATH;
  const isAboutActive = currentPath === ABOUT_PATH;
  const isSupportActive = currentPath === SUPPORT_PATH;
  const isHomeActive = !isSearchActive && !isAboutActive && !isSupportActive && !currentPath.startsWith("/docs");

  const navigateTo = (url: string) => {
    if (window.history.pushState) {
      window.history.pushState({}, "", url);
    } else {
      window.location.pathname = url;
    }
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <nav
      style={style}
      className={`fixed bottom-0 left-0 right-0 z-50 bg-[#1D1D1D] pb-[env(safe-area-inset-bottom,0px)] select-none will-change-transform ${
        className || ""
      }`}
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2">
        {/* Home Tab */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigateTo("/");
          }}
          className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-colors ${
            isHomeActive ? "text-white" : "text-text-muted hover:text-white"
          }`}
        >
          {isHomeActive ? (
            <Home style={{ fontSize: "24px" }} />
          ) : (
            <HomeOutlined style={{ fontSize: "24px", stroke: "currentColor", strokeWidth: 0.4 }} />
          )}
          <span className={`text-[10px] font-outfit uppercase tracking-wider ${isHomeActive ? "font-bold" : "font-medium"}`}>
            Home
          </span>
        </a>

        {/* Search Tab */}
        <a
          href={SEARCH_PATH}
          onClick={(e) => {
            e.preventDefault();
            navigateTo(SEARCH_PATH);
          }}
          aria-label="Search and API Explorer"
          className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-colors ${
            isSearchActive ? "text-white" : "text-text-muted hover:text-white"
          }`}
        >
          <Search
            style={{
              fontSize: "24px",
              stroke: "currentColor",
              strokeWidth: isSearchActive ? 1.2 : 0.6,
            }}
          />
          <span className={`text-[10px] font-outfit uppercase tracking-wider ${isSearchActive ? "font-bold" : "font-medium"}`}>
            Search
          </span>
        </a>

        {/* About Tab */}
        <a
          href={ABOUT_PATH}
          onClick={(e) => {
            e.preventDefault();
            navigateTo(ABOUT_PATH);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-colors ${
            isAboutActive ? "text-white" : "text-text-muted hover:text-white"
          }`}
        >
          {isAboutActive ? (
            <Info style={{ fontSize: "24px" }} />
          ) : (
            <InfoOutlined style={{ fontSize: "24px", stroke: "currentColor", strokeWidth: 0.4 }} />
          )}
          <span className={`text-[10px] font-outfit uppercase tracking-wider ${isAboutActive ? "font-bold" : "font-medium"}`}>
            About
          </span>
        </a>

        {/* Sponsor Tab */}
        <a
          href={SUPPORT_PATH}
          onClick={(e) => {
            e.preventDefault();
            navigateTo(SUPPORT_PATH);
          }}
          className={`flex flex-col items-center justify-center gap-0.5 w-16 transition-colors ${
            isSupportActive ? "text-[#ff6b81]" : "text-text-muted hover:text-[#ff6b81]"
          }`}
        >
          {isSupportActive ? (
            <Favorite style={{ fontSize: "23px", color: "#ff6b81" }} />
          ) : (
            <FavoriteBorder style={{ fontSize: "23px", stroke: "currentColor", strokeWidth: 0.4 }} />
          )}
          <span className={`text-[10px] font-outfit uppercase tracking-wider ${isSupportActive ? "font-bold text-[#ff6b81]" : "font-medium"}`}>
            Sponsor
          </span>
        </a>
      </div>
    </nav>
  );
}
