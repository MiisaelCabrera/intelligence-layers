"use client";

import React, { useEffect } from "react";

export const THEMES = ["light", "dark", "ocean"] as const;
export type Theme = (typeof THEMES)[number];

interface ThemeSwitcherProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export default function ThemeSwitcher({ theme, onThemeChange }: ThemeSwitcherProps) {

  // Map themes to background colors only
  const BG_BY_THEME: Record<Theme, string> = {
    light: "#ffffff",
    dark : "#9ca3af", // gray instead of pure dark
    ocean: "#e6f6ff",
  };

  useEffect(() => {
    try {
      const bg = BG_BY_THEME[theme] ?? "#ffffff";
      // Set only the background CSS variable so other colors remain unchanged
      document.documentElement.style.setProperty("--background", bg);
      // Fallback: directly set body background in case some styles override the CSS variable
      try {
        document.body.style.background = bg;
      } catch {}
      // Debug info to help verify the change
      // eslint-disable-next-line no-console
      console.debug("[ThemeSwitcher] applied background", bg);
      localStorage.setItem("theme", theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  return (
    <div className="theme-switcher" style={{ position: "fixed", right: 12, top: 12, zIndex: 9999 }}>
      <label aria-hidden>Theme:</label>
      <select
        value={theme}
        onChange={(e) => onThemeChange(e.target.value as Theme)}
        aria-label="Select theme"
      >
        {THEMES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
