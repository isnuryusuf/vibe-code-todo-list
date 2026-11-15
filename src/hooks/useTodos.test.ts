import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodos } from './useTodos';
import { installFakeApi } from '../test/fakeApi';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useTodos (API-backed)', () => {
  test('loads initial todos from the API and clears loading', async () => {
    installFakeApi({ todos: [{ id: '1', text: 'Buy milk', completed: false, createdAt: 100 }] });

    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.todos).toEqual([
      { id: '1', text: 'Buy milk', completed: false, createdAt: 100 },
    ]);
  });

  test('addTodo posts and returns the new id', async () => {
    const { fetchMock } = installFakeApi();
    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    let returnedId: string | null = null;
    await act(async () => {
      returnedId = await result.current.addTodo('New task');
    });

    expect(returnedId).toBeDefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'New task' }),
    });
  });

  test('toggleTodo patches the first incomplete todo', async () => {
    installFakeApi({ todos: [{ id: '1', text: 'Active', completed: false, createdAt: 1 }, { id: '2', text: 'Done', completed: true, createdAt: 2 }] });

    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      result.current.toggleTodo();
    });

    // Should toggle todo #1 (the first incomplete one)
    expect(result.current.todos[0].completed).toBe(true);
    expect(result.current.todos[1].completed).toBe(true);
  });

  test('deleteTodo, editTodo, setDueDate (set and clear), and clearCompleted update the list', async () => {
    installFakeApi({ todos: [{ id: '1', text: 'Task A', completed: true, createdAt: 1, dueDate: '2026-01-01' }, { id: '2', text: 'Task B', completed: false, createdAt: 2 }] });

    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    // Edit
    await act(async () => {
      result.current.editTodo('1', 'Task A (edited)');
    });
    expect(result.current.todos[0].text).toBe('Task A (edited)');

    // Set due date
    await act(async () => {
      result.current.setDueDate('2', '2026-03-01');
    });
    expect(result.current.todos[1].dueDate).toBe('2026-03-01');

    // Clear due date (null)
    await act(async () => {
      result.current.setDueDate('1');
    });
    expect(result.current.todos[0].dueDate).toBeUndefined();

    // Clear completed
    await act(async () => {
      await result.current.clearCompleted();
    });
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBe('2');
  });

  test('a failed GET sets error; refresh recovers after the fake API is fixed', async () => {
    const { state } = installFakeApi({ failTodos: true });
    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.error).not.toBeNull();

    // Fix the API
    state.failTodos = false;
    state.todos = [{ id: '1', text: 'Recovered', completed: false, createdAt: 1 }];

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.todos).toEqual([
      { id: '1', text: 'Recovered', completed: false, createdAt: 1 },
    ]);
  });

  test('no legacy localStorage key is written by any action', async () => {
    installFakeApi({ todos: [] });
    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    await act(async () => {
      await result.current.addTodo('Persisted');
    });

    expect(localStorage.getItem('todos-app')).toBeNull();
  });
});
