/**
 * Accessible color palette for UNC MBA Courses
 * Provides distinct, consistent colors for badges, chips, and borders.
 */

export interface CourseColorStyle {
  badge: string;       // Background + text + border for tags
  border: string;      // Accent border
  pillActive: string;  // Active state for filter chips
  text: string;
}

const PALETTE: CourseColorStyle[] = [
  {
    // Carolina Blue / Sky
    badge: "bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/30",
    border: "border-sky-500/40",
    pillActive: "bg-sky-700 text-white dark:bg-sky-600",
    text: "text-sky-800 dark:text-sky-300",
  },
  {
    // Deep Indigo / Purple
    badge: "bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border-indigo-500/30",
    border: "border-indigo-500/40",
    pillActive: "bg-indigo-700 text-white dark:bg-indigo-600",
    text: "text-indigo-800 dark:text-indigo-300",
  },
  {
    // Emerald Green
    badge: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30",
    border: "border-emerald-500/40",
    pillActive: "bg-emerald-700 text-white dark:bg-emerald-600",
    text: "text-emerald-800 dark:text-emerald-300",
  },
  {
    // Amber / Warm Gold
    badge: "bg-amber-500/10 text-amber-900 dark:text-amber-300 border-amber-500/30",
    border: "border-amber-500/40",
    pillActive: "bg-amber-700 text-white dark:bg-amber-600",
    text: "text-amber-900 dark:text-amber-300",
  },
  {
    // Rose / Crimson
    badge: "bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30",
    border: "border-rose-500/40",
    pillActive: "bg-rose-700 text-white dark:bg-rose-600",
    text: "text-rose-800 dark:text-rose-300",
  },
  {
    // Teal
    badge: "bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/30",
    border: "border-teal-500/40",
    pillActive: "bg-teal-700 text-white dark:bg-teal-600",
    text: "text-teal-800 dark:text-teal-300",
  },
];

export function getCourseColor(courseIdOrCode: number | string): CourseColorStyle {
  let hash = 0;
  const str = String(courseIdOrCode);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
}

/**
 * Extracts a clean, concise course tag from messy Canvas course titles.
 * Examples:
 *   "973D MBA 714 BUSINESS STATISTICS AND ANALYTICS 2026-0926" -> "MBA 714"
 *   "973D MBA 744 CUSTOMER VALUE STRATEGIES 2026-0926" -> "MBA 744"
 *   "MBA707-973B: ORIENTATION" -> "Orientation"
 *   "Digital Campus Technology Tutorial" -> "Tech Tutorial"
 */
export function getCleanCourseCode(rawCode?: string | null, rawName?: string | null): string {
  const text = (rawCode || rawName || "").trim();

  // Match MBA + number (e.g., MBA 714, MBA 801, MBA 773)
  const mbaMatch = text.match(/MBA\s*(\d{3}[A-Z]?)/i);
  if (mbaMatch && mbaMatch[1]) {
    return `MBA ${mbaMatch[1].toUpperCase()}`;
  }

  // Common UNC MBA program modules
  if (/orientation/i.test(text)) return "Orientation";
  if (/technology|tutorial/i.test(text)) return "Tech Tutorial";
  if (/foundations/i.test(text)) return "Foundations";
  if (/microeconomics/i.test(text)) return "Microeconomics";
  if (/statistics/i.test(text)) return "Statistics";

  // Fallback: take first 14 chars
  return text.split(/[-–:]/)[0].trim().slice(0, 14);
}
