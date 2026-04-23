"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // On mount: check saved preference, otherwise use system
    const saved =
      (localStorage.getItem("languagehack-theme") as Theme | null) ??
      (localStorage.getItem("lemma-theme") as Theme | null);

    const resolved = saved ?? getSystemTheme();
    setTheme(resolved);
    applyTheme(resolved);

    // Listen for OS theme changes — always follow, override saved preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const next = e.matches ? "dark" : "light";
      setTheme(next);
      applyTheme(next);
      // Clear saved so we stay in "follow system" mode
      localStorage.removeItem("languagehack-theme");
      localStorage.removeItem("lemma-theme");
    };
    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("languagehack-theme", next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="icon-button"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
          <path d="M20 15.2A7.8 7.8 0 1 1 8.8 4 8.8 8.8 0 0 0 20 15.2Z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" />
        </svg>
      )}
    </button>
  );
}
