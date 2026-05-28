"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const label = theme === "dark" ? "DARK" : theme === "system" ? "AUTO" : "LIGHT";

  function handleClick() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed top-4 right-4 z-50 min-h-11 min-w-11 px-3 border border-pen text-pen text-xs uppercase tracking-widest transition-colors duration-200 font-[family-name:var(--font-body)] cursor-pointer"
    >
      {label}
    </button>
  );
}
