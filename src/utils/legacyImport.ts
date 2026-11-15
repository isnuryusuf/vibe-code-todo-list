import { api } from '../api/client';
import type { LegacyTodoInput } from '../types/todo';

const STORAGE_KEY = 'todos-app';

function markerKey(userId: number): string {
  return `todos-imported:${userId}`;
}

function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toLegacyTodo(value: unknown): LegacyTodoInput | null {
  if (!value || typeof value !== 'object') return null;

  const item = value as Record<string, unknown>;
  if (typeof item.text !== 'string' || item.text.trim().length === 0) return null;

  const todo: LegacyTodoInput = {
    text: item.text.trim(),
    completed: item.completed === true,
    createdAt:
      typeof item.createdAt === 'number' && Number.isFinite(item.createdAt)
        ? item.createdAt
        : Date.now(),
  };

  if (typeof item.id === 'string' && item.id.length > 0) {
    todo.id = item.id;
  }
  if (typeof item.dueDate === 'string' && isValidISODate(item.dueDate)) {
    todo.dueDate = item.dueDate;
  }

  return todo;
}

function markImported(userId: number): void {
  try {
    localStorage.setItem(markerKey(userId), String(Date.now()));
  } catch {
    // Storage unavailable — the server-side import is still idempotent.
  }
}

function discardLegacy(userId: number): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
  markImported(userId);
}

/**
 * Imports the pre-account localStorage todo list into the signed-in account.
 * The legacy key is removed only after a successful import, so a network
 * failure leaves the data in place for the next login. Returns the number of
 * todos the server reports as newly imported.
 */
export async function importLegacyTodos(userId: number): Promise<number> {
  let raw: string | null;

  try {
    if (localStorage.getItem(markerKey(userId)) !== null) return 0;
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return 0;
  }

  if (raw === null || raw.trim() === '') {
    markImported(userId);
    return 0;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    discardLegacy(userId);
    return 0;
  }

  if (!Array.isArray(parsed)) {
    discardLegacy(userId);
    return 0;
  }

  const todos = parsed
    .map(toLegacyTodo)
    .filter((todo): todo is LegacyTodoInput => todo !== null);

  if (todos.length === 0) {
    discardLegacy(userId);
    return 0;
  }

  try {
    const { imported } = await api.importTodos(todos);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage failures; the marker below still records success.
    }
    markImported(userId);
    return imported;
  } catch {
    return 0;
  }
}
