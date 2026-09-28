import { CanvasCourse, StudentAuthTokens, WeeklyBundle } from "./canvas/types";

const STORAGE_KEYS = {
  TOKENS: "unc_mba_tokens",
  COMPLETED_ITEMS: "unc_mba_completed_items",
  CACHED_COURSES: "unc_mba_cached_courses",
  CACHED_BUNDLES: "unc_mba_cached_bundles",
  SELECTED_COURSE_ID: "unc_mba_selected_course",
  SELECTED_WEEK: "unc_mba_selected_week",
  IS_DEMO_MODE: "unc_mba_demo_mode",
};

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

  static isDemoMode(): boolean {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEYS.IS_DEMO_MODE) === "true";
  }

  static setDemoMode(enabled: boolean): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.IS_DEMO_MODE, enabled ? "true" : "false");
  }

  static getCachedCourses(): CanvasCourse[] | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CACHED_COURSES);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static saveCachedCourses(courses: CanvasCourse[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.CACHED_COURSES, JSON.stringify(courses));
  }

  static getCachedBundles(): Record<number, WeeklyBundle[]> | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CACHED_BUNDLES);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static saveCachedBundles(bundles: Record<number, WeeklyBundle[]>): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.CACHED_BUNDLES, JSON.stringify(bundles));
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

  static getSelectedWeek(): number {
    if (typeof window === "undefined") return 1;
    const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_WEEK);
    return stored ? parseInt(stored, 10) : 1;
  }

  static setSelectedWeek(week: number): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SELECTED_WEEK, week.toString());
  }

  /**
   * Export cohort schedule mapping configuration as JSON string
   */
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
