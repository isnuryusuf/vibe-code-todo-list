import { describe, test, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodos } from './useTodos';
import type { Todo } from '../types/todo';

const STORAGE_KEY = 'todos-app';

describe('useTodos', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('adds a new todo', () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      const id = result.current.addTodo('Buy milk');
      expect(id).toBeDefined();
    });

    act(() => {
      const todos = result.current.todos;
      expect(todos).toHaveLength(1);
      expect(todos[0].text).toBe('Buy milk');
      expect(todos[0].completed).toBe(false);
      expect(todos[0].createdAt).toBeGreaterThan(0);
    });
  });

  test('toggles a todo\'s completed status', () => {
    const { result } = renderHook(() => useTodos());

    let todoId: string;
    act(() => {
      todoId = result.current.addTodo('Buy milk');
    });

    // Initially not completed
    expect(result.current.todos[0].completed).toBe(false);

    act(() => {
      result.current.toggleTodo(todoId);
    });

    expect(result.current.todos[0].completed).toBe(true);

    act(() => {
      result.current.toggleTodo(todoId);
    });

    expect(result.current.todos[0].completed).toBe(false);
  });

  test('deletes a todo', () => {
    let todoId: string;
    const { result } = renderHook(() => useTodos());

    act(() => {
      todoId = result.current.addTodo('Buy milk');
    });

    expect(result.current.todos).toHaveLength(1);

    act(() => {
      result.current.deleteTodo(todoId);
    });

    expect(result.current.todos).toHaveLength(0);
  });

  test('persists todos to localStorage', () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo('Persist me');
    });

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed: Todo[] = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].text).toBe('Persist me');
  });

  test('loads todos from localStorage on init', () => {
    const initialTodos: Todo[] = [
      {
        id: 'pre-existing',
        text: 'Already here',
        completed: false,
        createdAt: 12345,
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTodos));

    const { result } = renderHook(() => useTodos());

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].text).toBe('Already here');
    expect(result.current.todos[0].id).toBe('pre-existing');
  });

  test('clearCompleted removes only completed todos', () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo('Do this');
      result.current.addTodo('Do that');
    });

    const firstId = result.current.todos[0].id;
    act(() => {
      result.current.toggleTodo(firstId);
    });

    expect(result.current.todos).toHaveLength(2);
    expect(result.current.completedCount).toBe(1);
    expect(result.current.activeCount).toBe(1);

    act(() => {
      result.current.clearCompleted();
    });

    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].completed).toBe(false);
    expect(result.current.todos[0].text).toBe('Do that');
  });

  test('counts are correct', () => {
    const { result } = renderHook(() => useTodos());

    act(() => {
      result.current.addTodo('Task A');
      result.current.addTodo('Task B');
      result.current.addTodo('Task C');
    });

    act(() => {
      result.current.toggleTodo(result.current.todos[0].id);
    });

    expect(result.current.totalCount).toBe(3);
    expect(result.current.activeCount).toBe(2);
    expect(result.current.completedCount).toBe(1);
  });
});
