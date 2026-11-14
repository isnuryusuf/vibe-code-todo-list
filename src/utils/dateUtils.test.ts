import { describe, test, expect } from 'vitest';
import { isOverdue, isToday, isUpcoming, formatDate, toISODate } from './dateUtils';

describe('dateUtils', () => {
  test('isOverdue returns true for past uncompleted todo', () => {
    expect(isOverdue('2020-01-01', false)).toBe(true);
  });

  test('isOverdue returns false for completed todo even if past', () => {
    expect(isOverdue('2020-01-01', true)).toBe(false);
  });

  test('isOverdue returns false for today', () => {
    const today = toISODate(new Date());
    expect(isOverdue(today, false)).toBe(false);
  });

  test('isToday returns true for today', () => {
    const today = toISODate(new Date());
    expect(isToday(today)).toBe(true);
  });

  test('isUpcoming returns true for future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 3);
    expect(isUpcoming(toISODate(future))).toBe(true);
  });

  test('formatDate formats ISO date to readable string', () => {
    expect(formatDate('2025-12-25')).toMatch(/Dec/);
  });
});
