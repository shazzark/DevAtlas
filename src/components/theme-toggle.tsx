"use client";

import { useEffect } from "react";
import { FiMoon, FiSun } from "react-icons/fi";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = window.localStorage.getItem("devatlas-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // Storage can be unavailable in restricted browser contexts; system preference still works.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  useEffect(() => {
    const initialTheme = getInitialTheme();
    document.documentElement.dataset.theme = initialTheme;
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    try {
      window.localStorage.setItem("devatlas-theme", nextTheme);
    } catch {
      // The current page still changes theme when persistent storage is unavailable.
    }
  }

  return (
    <button
      aria-label="Toggle color theme"
      className="icon-button theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      <FiMoon aria-hidden="true" />
      <FiSun aria-hidden="true" />
    </button>
  );
}
