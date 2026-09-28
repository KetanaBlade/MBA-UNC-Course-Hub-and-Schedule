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
      <div className="h-9 w-9 rounded-md bg-muted/40 border border-border" aria-hidden="true" />
    );
  }

  return (
    <button
      onClick={handleToggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="h-9 w-9 rounded-md border border-border bg-card hover:bg-muted/40 text-foreground text-xs font-semibold tracking-tight transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center"
    >
      {theme === "dark" ? (
        <Sun className="w-3.5 h-3.5 text-primary transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-primary transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
