import { describe, test, expect } from 'vitest';
import type { Todo } from '../types/todo';
import { toGoogleCalendarUrl, toOutlookCalendarUrl, buildICS } from './calendarExport';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: '1',
  text: 'Buy milk',
  completed: false,
  createdAt: 1,
  dueDate: '2026-12-25',
  ...overrides,
});

describe('toGoogleCalendarUrl', () => {
  test('builds an all-day event URL with an exclusive end date', () => {
    const url = new URL(toGoogleCalendarUrl(makeTodo()));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Buy milk');
    expect(url.searchParams.get('dates')).toBe('20261225/20261226');
  });

  test('encodes special characters in the title', () => {
    const url = new URL(toGoogleCalendarUrl(makeTodo({ text: 'Milk & eggs, 2%' })));
    expect(url.searchParams.get('text')).toBe('Milk & eggs, 2%');
  });

  test('returns an empty string when there is no due date', () => {
    expect(toGoogleCalendarUrl(makeTodo({ dueDate: undefined }))).toBe('');
  });
});

describe('toOutlookCalendarUrl', () => {
  test('builds an all-day event URL', () => {
    const url = new URL(toOutlookCalendarUrl(makeTodo()));
    expect(url.origin + url.pathname).toBe('https://outlook.live.com/calendar/0/deeplink/compose');
    expect(url.searchParams.get('subject')).toBe('Buy milk');
    expect(url.searchParams.get('startdt')).toBe('2026-12-25T00:00:00');
    expect(url.searchParams.get('enddt')).toBe('2026-12-25T23:59:59');
    expect(url.searchParams.get('allday')).toBe('true');
  });

  test('returns an empty string when there is no due date', () => {
    expect(toOutlookCalendarUrl(makeTodo({ dueDate: undefined }))).toBe('');
  });
});

describe('buildICS', () => {
  const now = new Date('2026-11-14T12:00:00Z');

  test('includes one VEVENT per dated todo and skips undated ones', () => {
    const ics = buildICS(
      [
        makeTodo(),
        makeTodo({ id: '2', text: 'Second task', dueDate: '2026-12-26' }),
        makeTodo({ id: '3', text: 'No date task', dueDate: undefined }),
      ],
      now
    );

    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).not.toContain('No date task');
  });

  test('wraps events in a calendar and uses all-day dates', () => {
    const ics = buildICS([makeTodo()], now);

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261225');
    expect(ics).toContain('DTEND;VALUE=DATE:20261226');
    expect(ics).toContain('SUMMARY:Buy milk');
    expect(ics).toContain('END:VCALENDAR');
  });

  test('escapes special characters in text fields', () => {
    const ics = buildICS(
      [makeTodo({ text: 'Milk, eggs; bread\\jam\nline two' })],
      now
    );

    expect(ics).toContain('SUMMARY:Milk\\, eggs\\; bread\\\\jam\\nline two');
  });

  test('uses the provided timestamp for DTSTAMP', () => {
    expect(buildICS([makeTodo()], now)).toContain('DTSTAMP:20261114T120000Z');
  });

  test('marks completed todos', () => {
    expect(buildICS([makeTodo({ completed: true })], now)).toContain('STATUS:COMPLETED');
  });

  test('uses CRLF line endings', () => {
    expect(buildICS([makeTodo()], now)).toContain('\r\n');
  });
});
