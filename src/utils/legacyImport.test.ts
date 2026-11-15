import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { importLegacyTodos } from './legacyImport';
import { installFakeApi } from '../test/fakeApi';

const STORAGE_KEY = 'todos-app';
const MARKER_KEY = 'todos-imported:1';

const legacyTodo = {
  id: '11111111-1111-4111-8111-111111111111',
  text: 'Old task',
  completed: true,
  createdAt: 100,
  dueDate: '2026-01-02',
};

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('importLegacyTodos', () => {
  test('imports legacy todos once and records the marker', async () => {
    const { state } = installFakeApi();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([legacyTodo]));

    const imported = await importLegacyTodos(1);

    expect(imported).toBe(1);
    expect(state.importCalls).toBe(1);
    expect(state.todos).toEqual([legacyTodo]);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(MARKER_KEY)).not.toBeNull();
  });

  test('does not call the import endpoint again after a successful import', async () => {
    const { state } = installFakeApi();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([legacyTodo]));

    await importLegacyTodos(1);
    const callsAfterFirst = state.importCalls;
    const imported = await importLegacyTodos(1);

    expect(imported).toBe(0);
    expect(state.importCalls).toBe(callsAfterFirst);
  });

  test('keeps the legacy data when the import request fails', async () => {
    const { state } = installFakeApi({ authenticated: false });
    const raw = JSON.stringify([legacyTodo]);
    localStorage.setItem(STORAGE_KEY, raw);

    const imported = await importLegacyTodos(1);

    expect(imported).toBe(0);
    expect(state.importCalls).toBe(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBe(raw);
    expect(localStorage.getItem(MARKER_KEY)).toBeNull();
  });

  test('discards malformed legacy data without calling the endpoint', async () => {
    const { state } = installFakeApi();
    localStorage.setItem(STORAGE_KEY, '{not-json');

    const imported = await importLegacyTodos(1);

    expect(imported).toBe(0);
    expect(state.importCalls).toBe(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
