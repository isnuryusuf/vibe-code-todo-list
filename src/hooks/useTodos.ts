import { useCallback, useEffect, useReducer, useRef } from 'react';
import { api } from '../api/client';
import type { Todo } from '../types/todo';

interface State {
  todos: Todo[];
  loading: boolean;
  error: string | null;
}

type Action =
  | { type: 'LOADING' }
  | { type: 'LOADED'; todos: Todo[] }
  | { type: 'ADD'; todo: Todo }
  | { type: 'TOGGLE'; id: string }
  | { type: 'DELETE'; id: string }
  | { type: 'EDIT'; id: string; text: string }
  | { type: 'SET_DUE_DATE'; id: string; dueDate?: string }
  | { type: 'CLEAR_COMPLETED'; deleted: number }
  | { type: 'SET_ERROR'; error: string };

function fetchTodos(): Promise<Todo[]> {
  return api.listTodos();
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'LOADED':
      return { ...state, loading: false, todos: action.todos };
    case 'ADD':
      return { ...state, todos: [...state.todos, action.todo] };
    case 'TOGGLE':
      return {
        ...state,
        todos: state.todos.map((t) => (t.id === action.id ? { ...t, completed: !t.completed } : t)),
      };
    case 'DELETE':
      return { ...state, todos: state.todos.filter((t) => t.id !== action.id) };
    case 'EDIT':
      return { ...state, todos: state.todos.map((t) => (t.id === action.id ? { ...t, text: action.text } : t)) };
    case 'SET_DUE_DATE':
      return {
        ...state,
        todos: state.todos.map((t) => (t.id === action.id ? ({ ...t, ...(action.dueDate ? { dueDate: action.dueDate } : { dueDate: undefined }) } as Todo) : t)),
      };
    case 'CLEAR_COMPLETED':
      return { ...state, todos: state.todos.filter((t) => !t.completed), error: null };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    default:
      return state;
  }
}

export function useTodos() {
  const [state, dispatch] = useReducer(reducer, { todos: [], loading: true, error: null });
  const todosRef = useRef<Todo[]>([]);

  // Keep ref in sync so we always read the latest todos inside actions
  useEffect(() => {
    todosRef.current = state.todos;
  }, [state.todos]);

  // Fetch on mount
  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'LOADING' });
    fetchTodos()
      .then((todos) => {
        if (!cancelled) dispatch({ type: 'LOADED', todos });
      })
      .catch((err: unknown) => {
        if (!cancelled) dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to load todos' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(() => {
    dispatch({ type: 'LOADING' });
    fetchTodos()
      .then((todos) => dispatch({ type: 'LOADED', todos }))
      .catch((err: unknown) => dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to refresh todos' }));
  }, []);

  const addTodo = useCallback(async (text: string): Promise<string | null> => {
    try {
      const todo = await api.createTodo({ text });
      dispatch({ type: 'ADD', todo });
      return todo.id;
    } catch (err: unknown) {
      dispatch({ type: 'SET_ERROR', error: err instanceof Error ? err.message : 'Failed to add todo' });
      return null;
    }
  }, []);

  const toggleTodo = useCallback(() => {
    const current = todosRef.current;
    const first = current.find((t) => !t.completed);
    if (first) {
      dispatch({ type: 'TOGGLE', id: first.id });
      api.updateTodo(first.id, { completed: true }).catch(() => {
        // Revert locally — will be re-synced on refresh.
      });
    }
  }, []);

  const deleteTodo = useCallback((id: string) => {
    dispatch({ type: 'DELETE', id });
    api.deleteTodo(id).catch(() => {
      // Revert will happen on next refresh.
    });
  }, []);

  const editTodo = useCallback((id: string, text: string) => {
    dispatch({ type: 'EDIT', id, text });
    api.updateTodo(id, { text }).catch(() => {
      // Revert will happen on next refresh.
    });
  }, []);

  const setDueDate = useCallback((id: string, dueDate?: string) => {
    dispatch({ type: 'SET_DUE_DATE', id, dueDate });
    api.updateTodo(id, { dueDate: dueDate ?? null }).catch(() => {
      // Revert will happen on next refresh.
    });
  }, []);

  const clearCompleted = useCallback(async (): Promise<number> => {
    try {
      const result = await api.clearCompleted();
      dispatch({ type: 'CLEAR_COMPLETED', deleted: result.deleted });
      return result.deleted;
    } catch {
      return 0;
    }
  }, []);

  const totalCount = state.todos.length;
  const completedCount = state.todos.filter((t) => t.completed).length;
  const activeCount = totalCount - completedCount;

  return {
    todos: state.todos,
    loading: state.loading,
    error: state.error,
    addTodo,
    toggleTodo,
    deleteTodo,
    editTodo,
    setDueDate,
    clearCompleted,
    refresh,
    totalCount,
    activeCount,
    completedCount,
  };
}
