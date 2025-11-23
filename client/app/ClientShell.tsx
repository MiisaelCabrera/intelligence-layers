"use client";

import { ReactNode, useEffect, useState } from "react";
import ThemeSwitcher, { Theme } from "../components/ThemeSwitcher";

export default function ClientShell({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    try {
      const stored = (localStorage.getItem("theme") as Theme | null) ?? "light";
      setTheme(stored);
    } catch {
      // ignore
    }
  }, []);

  return (
    <>
      {children}
      <ThemeSwitcher theme={theme} onThemeChange={setTheme} />
    </>
  );
}
