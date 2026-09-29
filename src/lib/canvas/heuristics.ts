import { DeliverableStatus, ReadingCategory } from "./types";

/**
 * Extracts a week number from a title, folder path, or description.
 * Supports patterns like "Week 1", "W02", "Module 3", "M4", "Session 5", "Week IV", etc.
 */
export function extractWeekNumber(text?: string | null): number | null {
  if (!text) return null;

  const clean = text.trim();

  // Primary: "Week 1", "Week 01", "Week-1", "Week_1"
  const weekMatch = clean.match(/(?:^|\b|_)week[\s_-]*0*(\d{1,2})\b/i);
  if (weekMatch && weekMatch[1]) {
    const num = parseInt(weekMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  // Secondary: "W1", "W01", "W 1"
  const wMatch = clean.match(/(?:^|\b|_)w[\s_-]*0*(\d{1,2})\b/i);
  if (wMatch && wMatch[1]) {
    const num = parseInt(wMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  // Tertiary: "Module 1", "Mod 1", "M1"
  const modMatch = clean.match(/(?:^|\b|_)(?:module|mod)[\s_-]*0*(\d{1,2})\b/i);
  if (modMatch && modMatch[1]) {
    const num = parseInt(modMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  // Quaternary: "Session 1", "Class 1"
  const sessionMatch = clean.match(/(?:^|\b|_)(?:session|class)[\s_-]*0*(\d{1,2})\b/i);
  if (sessionMatch && sessionMatch[1]) {
    const num = parseInt(sessionMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  // 5. Homework & Assignments: "Homework 1", "Homework Assignment 1", "HW 1", "HW-1", "Assignment 1"
  const hwMatch = clean.match(
    /(?:^|\b|_)(?:homework\s*(?:assignment)?|assignment|hw)[\s_#-]*0*(\d{1,2})\b/i
  );
  if (hwMatch && hwMatch[1]) {
    const num = parseInt(hwMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  // 6. Problem Sets: "Problem Set 1", "PSet 1", "PS 1", "PS1"
  const psMatch = clean.match(
    /(?:^|\b|_)(?:problem[\s_-]*set|pset|ps)[\s_#-]*0*(\d{1,2})\b/i
  );
  if (psMatch && psMatch[1]) {
    const num = parseInt(psMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  // 7. Quizzes: "Quiz 1", "Quiz #1"
  const quizMatch = clean.match(/(?:^|\b|_)quiz[\s_#-]*0*(\d{1,2})\b/i);
  if (quizMatch && quizMatch[1]) {
    const num = parseInt(quizMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  // 8. Cases & Memos: "Case 1", "Case Memo 1", "Memo 1"
  const caseMatch = clean.match(
    /(?:^|\b|_)(?:case[\s_-]*(?:memo|study|analysis)?|memo)[\s_#-]*0*(\d{1,2})\b/i
  );
  if (caseMatch && caseMatch[1]) {
    const num = parseInt(caseMatch[1], 10);
    if (num > 0 && num <= 20) return num;
  }

  // Roman numerals: "Week I", "Week II", "Week III", "Week IV", "Week V", "Week VI"
  const romanMatch = clean.match(
    /(?:^|\b|_)week[\s_-]*(i{1,3}|iv|v|vi{0,3}|ix|x)\b/i
  );
  if (romanMatch && romanMatch[1]) {
    const roman = romanMatch[1].toLowerCase();
    const romanMap: Record<string, number> = {
      i: 1,
      ii: 2,
      iii: 3,
      iv: 4,
      v: 5,
      vi: 6,
      vii: 7,
      viii: 8,
      ix: 9,
      x: 10,
    };
    if (romanMap[roman]) return romanMap[roman];
  }

  return null;
}

/**
 * Categorizes a file or resource based on its name and extension.
 */
export function categorizeResource(
  name: string,
  contentType?: string,
  source?: "module_item" | "files_tab" | "announcement"
): ReadingCategory {
  const lower = name.toLowerCase();

  // 1. Cases
  if (
    lower.includes("case") ||
    lower.includes("hbr") ||
    lower.includes("harvard business") ||
    lower.includes("scenario")
  ) {
    return "case";
  }

  // 2. Slide Decks
  if (
    lower.endsWith(".pptx") ||
    lower.endsWith(".ppt") ||
    lower.includes("slides") ||
    lower.includes("deck") ||
    lower.includes("lecture notes")
  ) {
    return "slides";
  }

  // 3. Spreadsheets & Models
  if (
    lower.endsWith(".xlsx") ||
    lower.endsWith(".xls") ||
    lower.endsWith(".csv") ||
    lower.includes("model") ||
    lower.includes("template") ||
    lower.includes("financials")
  ) {
    return "spreadsheet";
  }

  // 4. Syllabus
  if (lower.includes("syllabus") || lower.includes("course outline")) {
    return "syllabus";
  }

  // 5. 2U / DigitalCampus asynchronous module items are almost ALWAYS video lectures!
  // In UNC 2U modules, asynchronous coursework items include "1.1 Introduction...", "1.2 Video...", "Lecture...", "Discussion...", etc.
  if (source === "module_item") {
    // Only classify as reading if explicitly a document file format (.pdf, .doc) or explicitly "pre-reading"
    if (
      lower.endsWith(".pdf") ||
      lower.endsWith(".docx") ||
      lower.endsWith(".doc") ||
      lower.includes("pre-reading")
    ) {
      return "reading";
    }
    // Everything else in a 2U module item is an asynchronous video lecture
    return "video";
  }

  // 6. Explicit Readings / Books / Articles / PDFs
  if (
    lower.includes("reading") ||
    lower.includes("article") ||
    lower.includes("chapter") ||
    lower.includes("textbook") ||
    lower.includes("book") ||
    lower.includes("paper") ||
    lower.endsWith(".pdf") ||
    lower.endsWith(".docx") ||
    lower.endsWith(".doc")
  ) {
    return "reading";
  }

  // 7. Video fallback
  if (
    lower.endsWith(".mp4") ||
    lower.endsWith(".mov") ||
    contentType?.startsWith("video/") ||
    lower.includes("recording") ||
    lower.includes("video") ||
    lower.includes("lecture")
  ) {
    return "video";
  }

  return "video";
}

/**
 * Extracts Zoom or virtual meeting URLs from HTML announcement messages.
 */
export function extractZoomLinks(html?: string): string[] {
  if (!html) return [];
  const urls: string[] = [];

  // Match Zoom meeting URLs: unc.zoom.us, kenan-flagler.zoom.us, zoom.us
  const zoomRegex = /https:\/\/[a-zA-Z0-9.-]*zoom\.us\/(?:j|my)\/[a-zA-Z0-9?=&_-]+/gi;
  let match: RegExpExecArray | null;

  while ((match = zoomRegex.exec(html)) !== null) {
    if (!urls.includes(match[0])) {
      urls.push(match[0]);
    }
  }

  return urls;
}

/**
 * Formats byte size into human readable string.
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calculates due urgency and normalized status for deliverables.
 */
export function calculateDueUrgency(
  dueAt: string | null | undefined,
  submissionState?: string,
  score?: number | null
): {
  dueInDays?: number;
  dueInHours?: number;
  status: DeliverableStatus;
} {
  if (submissionState === "graded" || (score !== undefined && score !== null)) {
    return { status: "graded" };
  }

  if (submissionState === "submitted") {
    return { status: "submitted" };
  }

  if (!dueAt) {
    return { status: "unsubmitted" };
  }

  const dueDate = new Date(dueAt);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    return {
      dueInDays: diffDays,
      dueInHours: diffHours,
      status: "overdue",
    };
  }

  return {
    dueInDays: diffDays,
    dueInHours: diffHours,
    status: "upcoming",
  };
}

/**
 * Anchor date for Fall 2026 Term: Monday, September 28, 2026 (00:00:00 local time).
 */
export const FALL_2026_TERM_START = new Date(2026, 8, 28, 0, 0, 0, 0);

/**
 * Returns exact start (Monday 00:00:00) and end (Sunday 23:59:59.999) dates for a course week.
 */
export function getWeekDateBounds(
  weekNum: number,
  anchorMonday: Date = FALL_2026_TERM_START
): { start: Date; end: Date } {
  const start = new Date(anchorMonday.getTime() + (weekNum - 1) * 7 * 86400000);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 7 * 86400000 - 1); // Sunday 23:59:59.999
  return { start, end };
}

/**
 * Returns the week number (1-12) for a given date, strictly configured by Monday-Sunday boundaries.
 */
export function getWeekFromDate(
  dateInput?: string | Date | null,
  anchorMonday: Date = FALL_2026_TERM_START
): number | null {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;

  const anchorStart = new Date(
    anchorMonday.getFullYear(),
    anchorMonday.getMonth(),
    anchorMonday.getDate(),
    0,
    0,
    0,
    0
  ).getTime();

  const diffMs = d.getTime() - anchorStart;
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays < 0) {
    if (diffDays >= -7) return 1; // Prior week / orientation belongs to Week 1 prep
    return null;
  }

  const week = Math.floor(diffDays / 7) + 1;
  return week >= 1 && week <= 12 ? week : null;
}

/**
 * Checks whether a given date falls within the Monday-Sunday boundary of a specific week.
 */
export function isDateInWeek(
  dateInput?: string | Date | null,
  weekNum: number = 1,
  anchorMonday: Date = FALL_2026_TERM_START
): boolean {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return false;
  const { start, end } = getWeekDateBounds(weekNum, anchorMonday);
  return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
}
