import { isBefore, isSameDay, isAfter, format, startOfToday, parseISO } from 'date-fns';

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseISODate(date: string): Date {
  return parseISO(date);
}

export function isToday(date: string): boolean {
  return isSameDay(parseISO(date), startOfToday());
}

export function isOverdue(dueDate: string, completed: boolean): boolean {
  if (completed) return false;
  return isBefore(parseISO(dueDate), startOfToday());
}

export function isUpcoming(date: string): boolean {
  return isAfter(parseISO(date), startOfToday());
}

export function formatDate(date: string): string {
  return format(parseISO(date), 'MMM d, yyyy');
}
