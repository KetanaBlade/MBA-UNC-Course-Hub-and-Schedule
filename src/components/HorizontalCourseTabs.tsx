"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CourseTabItem {
  key: string;
  label: string;
  count?: number;
}

interface HorizontalCourseTabsProps {
  tabs: CourseTabItem[];
  selectedTab: string;
  onSelectTab: (key: string) => void;
  className?: string;
}

/**
 * Reusable horizontal scrollable tabs for filtering courses and modules.
 * Strictly flush with each other (gap-0, -mb-px), left-aligned, with smooth scroll arrows.
 */
export function HorizontalCourseTabs({
  tabs,
  selectedTab,
  onSelectTab,
  className,
}: HorizontalCourseTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener("resize", updateScrollButtons);
    return () => window.removeEventListener("resize", updateScrollButtons);
  }, [tabs.length]);

  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = 180;
      tabsRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(updateScrollButtons, 300);
    }
  };

  if (tabs.length <= 1) return null;

  return (
    <div className={cn("relative border-b border-border/80 group", className)}>
      {/* Scroll Left Trigger */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollTabs("left")}
          aria-label="Scroll courses left"
          className="absolute left-0 top-0 bottom-0 z-10 flex items-center justify-start pr-4 pl-0.5 bg-gradient-to-r from-card via-card/90 to-transparent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Flush Tabs Container */}
      <div
        ref={tabsRef}
        onScroll={updateScrollButtons}
        role="tablist"
        aria-orientation="horizontal"
        className="w-full flex items-center gap-0 overflow-x-auto no-scrollbar scroll-smooth -mb-px"
      >
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectTab(tab.key)}
              className={cn(
                "shrink-0 py-2 sm:py-2.5 px-3 sm:px-4 first:pl-0 sm:first:pl-0 text-xs sm:text-sm transition-colors cursor-pointer select-none border-b-2 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-primary text-foreground font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60 font-medium"
              )}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span className="text-[11px] font-mono text-muted-foreground/80 tabular-nums">
                  ({tab.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Trigger */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollTabs("right")}
          aria-label="Scroll courses right"
          className="absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end pl-4 pr-0.5 bg-gradient-to-l from-card via-card/90 to-transparent text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
