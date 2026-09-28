import { NormalizedDeliverable, NormalizedLiveSession } from "./canvas/types";

/**
 * Formats a Date object into iCal format: YYYYMMDDTHHMMSSZ
 */
function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Generates an RFC 5545 compliant .ics calendar string
 */
export function generateICalFeed(params: {
  deliverables: NormalizedDeliverable[];
  liveSessions: NormalizedLiveSession[];
  calendarName?: string;
}): string {
  const { deliverables, liveSessions, calendarName = "UNC MBA Master Schedule" } = params;
  const now = new Date();
  const dtStamp = formatICalDate(now);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//UNC Kenan-Flagler Online MBA//Centralized Hub 1.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calendarName}`,
    "X-WR-TIMEZONE:America/New_York",
  ];

  // 1. Deliverables (due dates)
  deliverables.forEach((item) => {
    if (!item.dueAt) return;
    const dueDate = new Date(item.dueAt);
    const startDate = new Date(dueDate.getTime() - 60 * 60 * 1000); // 1 hour block for submission
    const uid = `deliv-${item.id}@unc-mba-hub`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(dueDate)}`,
      `SUMMARY:[DUE] [${item.courseCode}] ${item.title}`,
      `DESCRIPTION:Points: ${item.pointsPossible}\\nStatus: ${item.status}\\nCanvas URL: ${item.canvasUrl}`,
      `URL:${item.canvasUrl}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-P1D", // 24 hour reminder
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder: ${item.title} due tomorrow`,
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT2H", // 2 hour reminder
      "ACTION:DISPLAY",
      `DESCRIPTION:Final reminder: ${item.title} due in 2 hours`,
      "END:VALARM",
      "END:VEVENT"
    );
  });

  // 2. Live sessions (Zoom classes)
  liveSessions.forEach((session) => {
    const startDate = new Date(session.startAt);
    const endDate = new Date(session.endAt || startDate.getTime() + 90 * 60 * 1000);
    const uid = `live-${session.id}@unc-mba-hub`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:[LIVE] [${session.courseCode}] ${session.title}`,
      `DESCRIPTION:Live Class Session\\nZoom Link: ${session.zoomUrl || "See Canvas"}\\nCanvas: ${session.canvasUrl}`,
      `LOCATION:${session.zoomUrl || session.location || "Zoom"}`,
      `URL:${session.zoomUrl || session.canvasUrl}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT15M", // 15 min reminder
      "ACTION:DISPLAY",
      `DESCRIPTION:UNC MBA Class starting in 15 minutes`,
      "END:VALARM",
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Initiates client-side file download of the generated .ics file
 */
export function downloadICSFile(filename: string, content: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
