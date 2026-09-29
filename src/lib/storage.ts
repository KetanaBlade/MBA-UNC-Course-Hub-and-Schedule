import { CanvasCourse, StudentAuthTokens, WeeklyBundle } from "./canvas/types";

export const STORAGE_KEYS = {
  TOKENS: "unc_mba_tokens",
  COMPLETED_ITEMS: "unc_mba_completed_items",
  CACHED_COURSES: "unc_mba_cached_courses",
  CACHED_BUNDLES: "unc_mba_cached_bundles",
  SELECTED_COURSE_ID: "unc_mba_selected_course",
  SELECTED_COURSE_IDS: "unc_mba_selected_courses",
  SELECTED_WEEK: "unc_mba_selected_week",
  IS_DEMO_MODE: "unc_mba_demo_mode",
  THEME: "unc_mba_theme",
  MAIN_TAB: "unc_mba_main_tab",
  READINGS_TAB: "unc_mba_readings_tab",
  FILES_TAB: "unc_mba_files_tab",
  CALENDAR_FILTER: "unc_mba_calendar_filter",
};

export const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes (1800000ms)
export const DEFAULT_CACHE_TTL = DEFAULT_CACHE_TTL_MS;

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_KEYS = [
  STORAGE_KEYS.CACHED_COURSES,
  STORAGE_KEYS.CACHED_BUNDLES,
];

export function setWithTTL<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    console.warn(`Failed to set cached item for key "${key}":`, e);
  }
}

export function getWithTTL<T>(key: string, maxAgeMs: number = DEFAULT_CACHE_TTL_MS): T | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Backward compatibility: if cached data lacks a timestamp field, treat it as expired and re-fetch
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      !("timestamp" in parsed) ||
      typeof parsed.timestamp !== "number" ||
      !Number.isFinite(parsed.timestamp) ||
      !("data" in parsed)
    ) {
      localStorage.removeItem(key);
      return null;
    }

    const age = Date.now() - parsed.timestamp;
    if (age > maxAgeMs || age < 0) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data as T;
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors when clearing corrupted cache
    }
    return null;
  }
}

export function clearExpiredCaches(maxAgeMs: number = DEFAULT_CACHE_TTL_MS): void {
  if (typeof window === "undefined") return;
  try {
    const keysToCheck = new Set<string>(CACHE_KEYS);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("unc_mba_cached_")) {
        keysToCheck.add(key);
      }
    }
    keysToCheck.forEach((key) => {
      getWithTTL(key, maxAgeMs);
    });
  } catch (e) {
    console.warn("Failed to clear expired caches:", e);
  }
}

export class AppStorage {
  static getTokens(): StudentAuthTokens {
    if (typeof window === "undefined") {
      return { digitalCampusToken: "", kenanFlaglerToken: "" };
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.TOKENS);
      return stored ? JSON.parse(stored) : { digitalCampusToken: "", kenanFlaglerToken: "" };
    } catch {
      return { digitalCampusToken: "", kenanFlaglerToken: "" };
    }
  }

  static saveTokens(tokens: StudentAuthTokens): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokens));
  }

  static clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEYS.TOKENS);
  }

  static getCompletedItems(): Set<string> {
    if (typeof window === "undefined") return new Set();
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPLETED_ITEMS);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  }

  static hasStoredCompletedItems(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.COMPLETED_ITEMS) !== null;
  }

  static saveCompletedItems(items: Set<string> | string[]): void {
    if (typeof window === "undefined") return;
    const array = items instanceof Set ? Array.from(items) : items;
    localStorage.setItem(STORAGE_KEYS.COMPLETED_ITEMS, JSON.stringify(array));
  }

  static toggleCompletedItem(itemId: string): boolean {
    if (typeof window === "undefined") return false;
    const current = this.getCompletedItems();
    let isNowCompleted = false;
    if (current.has(itemId)) {
      current.delete(itemId);
      isNowCompleted = false;
    } else {
      current.add(itemId);
      isNowCompleted = true;
    }
    localStorage.setItem(
      STORAGE_KEYS.COMPLETED_ITEMS,
      JSON.stringify(Array.from(current))
    );
    return isNowCompleted;
  }

  static exportBackupData(): string {
    if (typeof window === "undefined") return "";
    const backup = {
      app: "UNC_MBA_Hub",
      version: 1,
      exportedAt: new Date().toISOString(),
      completedItems: Array.from(this.getCompletedItems()),
      selectedCourseIds: this.getSelectedCourseIds(),
      filters: {
        taskStatus: this.getTaskStatusFilter(),
        activeReadingTab: this.getReadingsCourseTab(),
        activeFilesTab: this.getFilesCourseTab(),
        fileStatus: this.getFileStatusFilter(),
        calendarFilter: this.getCalendarFilter(),
      },
    };
    return JSON.stringify(backup, null, 2);
  }

  static importBackupData(jsonString: string): { success: boolean; count: number; error?: string } {
    if (typeof window === "undefined") return { success: false, count: 0, error: "SSR" };
    try {
      const data = JSON.parse(jsonString);
      if (!data || typeof data !== "object") {
        return { success: false, count: 0, error: "Invalid backup format: expected JSON object" };
      }

      let restoredCount = 0;
      if (Array.isArray(data.completedItems)) {
        const validIds = data.completedItems.filter((id: unknown) => typeof id === "string" && id.trim().length > 0);
        this.saveCompletedItems(validIds);
        restoredCount = validIds.length;
      }

      if (Array.isArray(data.selectedCourseIds)) {
        const validCourseIds = data.selectedCourseIds.filter((id: unknown) => typeof id === "number");
        if (validCourseIds.length > 0) {
          this.setSelectedCourseIds(validCourseIds);
        }
      }

      if (data.filters && typeof data.filters === "object") {
        if (data.filters.taskStatus) this.setTaskStatusFilter(data.filters.taskStatus);
        if (data.filters.activeReadingTab) this.setReadingsCourseTab(data.filters.activeReadingTab);
        if (data.filters.activeFilesTab) this.setFilesCourseTab(data.filters.activeFilesTab);
        if (data.filters.fileStatus) this.setFileStatusFilter(data.filters.fileStatus);
        if (data.filters.calendarFilter) this.setCalendarFilter(data.filters.calendarFilter);
      }

      return { success: true, count: restoredCount };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to parse backup file";
      return { success: false, count: 0, error: msg };
    }
  }

  static isDemoMode(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.IS_DEMO_MODE) === "true";
  }

  static setDemoMode(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.IS_DEMO_MODE, enabled ? "true" : "false");
  }

  static getCachedCourses(maxAgeMs: number = DEFAULT_CACHE_TTL_MS): CanvasCourse[] | null {
    return getWithTTL<CanvasCourse[]>(STORAGE_KEYS.CACHED_COURSES, maxAgeMs);
  }

  static saveCachedCourses(courses: CanvasCourse[]): void {
    setWithTTL<CanvasCourse[]>(STORAGE_KEYS.CACHED_COURSES, courses);
  }

  static getCachedBundles(maxAgeMs: number = DEFAULT_CACHE_TTL_MS): Record<number, WeeklyBundle[]> | null {
    return getWithTTL<Record<number, WeeklyBundle[]>>(STORAGE_KEYS.CACHED_BUNDLES, maxAgeMs);
  }

  static saveCachedBundles(bundles: Record<number, WeeklyBundle[]>): void {
    setWithTTL<Record<number, WeeklyBundle[]>>(STORAGE_KEYS.CACHED_BUNDLES, bundles);
  }

  static setWithTTL<T>(key: string, data: T): void {
    setWithTTL<T>(key, data);
  }

  static getWithTTL<T>(key: string, maxAgeMs: number = DEFAULT_CACHE_TTL_MS): T | null {
    return getWithTTL<T>(key, maxAgeMs);
  }

  static clearExpiredCaches(maxAgeMs: number = DEFAULT_CACHE_TTL_MS): void {
    clearExpiredCaches(maxAgeMs);
  }

  static getSelectedCourseId(): number | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_COURSE_ID);
    return stored ? parseInt(stored, 10) : null;
  }

  static setSelectedCourseId(courseId: number): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SELECTED_COURSE_ID, courseId.toString());
  }

  static getSelectedCourseIds(): number[] | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_COURSE_IDS);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static setSelectedCourseIds(courseIds: number[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SELECTED_COURSE_IDS, JSON.stringify(courseIds));
  }

  static getSelectedWeek(): number {
    if (typeof window === "undefined") return 1;
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_WEEK);
    return stored ? parseInt(stored, 10) : 1;
  }

  static setSelectedWeek(week: number): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SELECTED_WEEK, week.toString());
  }

  static getTheme(): "light" | "dark" {
    if (typeof window === "undefined") return "light";
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.THEME);
      if (stored === "dark" || stored === "light") return stored;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "light";
    }
  }

  static setTheme(theme: "light" | "dark"): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.warn("Failed to save theme in localStorage:", e);
    }
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }

  static toggleTheme(): "light" | "dark" {
    const current = this.getTheme();
    const next = current === "dark" ? "light" : "dark";
    this.setTheme(next);
    return next;
  }

  static getMainTab(): "weekly" | "calendar" {
    if (typeof window === "undefined") return "weekly";
    const stored = localStorage.getItem(STORAGE_KEYS.MAIN_TAB);
    return stored === "calendar" ? "calendar" : "weekly";
  }

  static setMainTab(tab: "weekly" | "calendar"): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.MAIN_TAB, tab);
  }

  static getReadingsCourseTab(): string {
    if (typeof window === "undefined") return "all";
    return localStorage.getItem(STORAGE_KEYS.READINGS_TAB) || "all";
  }

  static setReadingsCourseTab(tab: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.READINGS_TAB, tab);
  }

  static getFilesCourseTab(): string {
    if (typeof window === "undefined") return "all";
    return localStorage.getItem(STORAGE_KEYS.FILES_TAB) || "all";
  }

  static setFilesCourseTab(tab: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.FILES_TAB, tab);
  }

  static getCalendarFilter(): "weeks" | "timeline" {
    if (typeof window === "undefined") return "weeks";
    const stored = localStorage.getItem(STORAGE_KEYS.CALENDAR_FILTER);
    return stored === "timeline" ? "timeline" : "weeks";
  }

  static setCalendarFilter(filter: "weeks" | "timeline"): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.CALENDAR_FILTER, filter);
  }

  static getTaskStatusFilter(): "all" | "todo" | "completed" {
    if (typeof window === "undefined") return "all";
    const stored = localStorage.getItem("unc_mba_task_status_filter");
    if (stored === "all" || stored === "todo" || stored === "completed") {
      return stored;
    }
    return "all";
  }

  static setTaskStatusFilter(filter: "all" | "todo" | "completed"): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("unc_mba_task_status_filter", filter);
  }

  static getFileStatusFilter(): "all" | "todo" | "completed" {
    if (typeof window === "undefined") return "all";
    const stored = localStorage.getItem("unc_mba_file_status_filter");
    if (stored === "all" || stored === "todo" || stored === "completed") {
      return stored;
    }
    return "all";
  }

  static setFileStatusFilter(filter: "all" | "todo" | "completed"): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("unc_mba_file_status_filter", filter);
  }

  static exportCohortConfig(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      app: "UNC MBA Centralized Resource Hub",
      version: "1.0",
      courses: this.getCachedCourses(),
    };
    return JSON.stringify(data, null, 2);
  }
}
