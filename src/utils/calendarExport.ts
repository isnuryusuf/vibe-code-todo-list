import { addDays, format, parseISO } from 'date-fns';
import type { Todo } from '../types/todo';

const GOOGLE_CALENDAR_ENDPOINT = 'https://calendar.google.com/calendar/render';
const OUTLOOK_CALENDAR_ENDPOINT =
  'https://outlook.live.com/calendar/0/deeplink/compose';

/** Convert an ISO `YYYY-MM-DD` date to the compact `YYYYMMDD` calendar format. */
function toCompactDate(isoDate: string): string {
  return isoDate.replaceAll('-', '');
}

/** All-day calendar events use an exclusive end date. */
function nextDay(isoDate: string): string {
  return format(addDays(parseISO(isoDate), 1), 'yyyy-MM-dd');
}

/**
 * Build an all-day Google Calendar "create event" link for a todo.
 * Returns an empty string when the todo has no due date.
 */
export function toGoogleCalendarUrl(todo: Todo): string {
  if (!todo.dueDate) return '';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: todo.text,
    dates: `${toCompactDate(todo.dueDate)}/${toCompactDate(nextDay(todo.dueDate))}`,
  });

  return `${GOOGLE_CALENDAR_ENDPOINT}?${params.toString()}`;
}

/**
 * Build an all-day Outlook Calendar "compose event" link for a todo.
 * Returns an empty string when the todo has no due date.
 */
export function toOutlookCalendarUrl(todo: Todo): string {
  if (!todo.dueDate) return '';

  const params = new URLSearchParams({
    rru: 'addevent',
    subject: todo.text,
    startdt: `${todo.dueDate}T00:00:00`,
    enddt: `${todo.dueDate}T23:59:59`,
    allday: 'true',
  });

  return `${OUTLOOK_CALENDAR_ENDPOINT}?${params.toString()}`;
}

/** Escape text values per RFC 5545. */
function escapeICSText(text: string): string {
  return text
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Format a date as a UTC ICS timestamp (`YYYYMMDDTHHMMSSZ`). */
function toICSTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  const day = `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
  const time = `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
  return `${day}T${time}Z`;
}

/**
 * Build a downloadable ICS calendar with one all-day event per dated todo.
 * Undated todos are skipped. `now` is injectable for deterministic output.
 */
export function buildICS(todos: Todo[], now: Date = new Date()): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//My Todos//Calendar Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const stamp = toICSTimestamp(now);

  for (const todo of todos) {
    if (!todo.dueDate) continue;

    lines.push(
      'BEGIN:VEVENT',
      `UID:todo-${todo.id}@my-todos.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toCompactDate(todo.dueDate)}`,
      `DTEND;VALUE=DATE:${toCompactDate(nextDay(todo.dueDate))}`,
      `SUMMARY:${escapeICSText(todo.text)}`
    );

    if (todo.completed) {
      lines.push('STATUS:COMPLETED');
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  // RFC 5545 requires CRLF line endings.
  return lines.join('\r\n') + '\r\n';
}

/**
 * Trigger a browser download of all dated todos as an `.ics` file.
 * Returns false when there is nothing to export.
 */
export function downloadICS(
  todos: Todo[],
  filename = 'my-todos.ics',
  now: Date = new Date()
): boolean {
  if (!todos.some((todo) => todo.dueDate)) return false;

  const blob = new Blob([buildICS(todos, now)], {
    type: 'text/calendar;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revocation so the browser has time to start reading the blob.
  setTimeout(() => URL.revokeObjectURL(url), 100);

  return true;
}
