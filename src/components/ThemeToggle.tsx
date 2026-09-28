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

  const handleSetTheme = (newTheme: "light" | "dark") => {
    AppStorage.setTheme(newTheme);
    setTheme(newTheme);
  };

  if (!mounted) {
    return (
      <div className="h-9 w-36 rounded-md bg-card border border-border" aria-hidden="true" />
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme switcher"
      className="inline-flex items-center bg-card border border-border rounded-md p-1 shadow-2xs"
    >
      {/* Light Option */}
      <button
        type="button"
        role="radio"
        aria-checked={theme === "light"}
        onClick={() => handleSetTheme("light")}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs sm:text-sm font-bold tracking-tight transition-all active:scale-[0.98] cursor-pointer ${
          theme === "light"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground bg-transparent font-medium"
        }`}
      >
        <Sun className={`w-3.5 h-3.5 ${theme === "light" ? "text-primary-foreground" : "text-muted-foreground"}`} />
        <span>Light</span>
      </button>

      {/* Dark Option */}
      <button
        type="button"
        role="radio"
        aria-checked={theme === "dark"}
        onClick={() => handleSetTheme("dark")}
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs sm:text-sm font-bold tracking-tight transition-all active:scale-[0.98] cursor-pointer ${
          theme === "dark"
            ? "bg-primary text-primary-foreground shadow-xs"
            : "text-muted-foreground hover:text-foreground bg-transparent font-medium"
        }`}
      >
        <Moon className={`w-3.5 h-3.5 ${theme === "dark" ? "text-primary-foreground" : "text-muted-foreground"}`} />
        <span>Dark</span>
      </button>
    </div>
  );
}
