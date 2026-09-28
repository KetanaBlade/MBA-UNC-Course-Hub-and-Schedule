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
