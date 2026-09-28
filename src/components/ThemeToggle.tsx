"use client";

import React, { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { AppStorage } from "@/lib/storage";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const active = AppStorage.getTheme();
    setTheme(active);
    if (active === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const handleToggle = () => {
    const next = AppStorage.toggleTheme();
    setTheme(next);
  };

  if (!mounted) {
    return (
      <div className="h-[38px] w-[38px] rounded-md bg-white/10" aria-hidden="true" />
    );
  }

  return (
    <button
      onClick={handleToggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="btn-tactile flex min-h-[38px] min-w-[38px] items-center justify-center rounded-md bg-white/10 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B9CD3]"
    >
      {theme === "dark" ? (
        <Sun className="h-3.5 w-3.5 text-amber-300 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-3.5 w-3.5 text-[#4B9CD3] transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
