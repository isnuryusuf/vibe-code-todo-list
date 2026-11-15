import type { LegacyTodoInput, Todo } from '../types/todo';
import type { User } from '../types/user';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Use a full base URL in dev so the frontend can call the API directly,
// avoiding the Vite proxy (which causes a startup race on Windows).
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? `http://localhost:3001` : '');

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const hasBody = init.body !== undefined;
  const headers: Record<string, string> = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };

  const url = API_BASE ? `${API_BASE}${path}` : path;
  const response = await fetch(url, { ...init, headers });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body.error === 'string' && body.error.length > 0) {
        message = body.error;
      }
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  me(): Promise<{ user: User }> {
    return request('/api/auth/me');
  },

  login(username: string, password: string): Promise<{ user: User }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  register(username: string, password: string): Promise<{ user: User }> {
    return request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout(): Promise<void> {
    return request('/api/auth/logout', { method: 'POST' });
  },

  listTodos(): Promise<Todo[]> {
    return request('/api/todos');
  },

  createTodo(input: { text: string; dueDate?: string }): Promise<Todo> {
    return request('/api/todos', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  updateTodo(
    id: string,
    input: { text?: string; completed?: boolean; dueDate?: string | null }
  ): Promise<Todo> {
    return request(`/api/todos/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  deleteTodo(id: string): Promise<void> {
    return request(`/api/todos/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  clearCompleted(): Promise<{ deleted: number }> {
    return request('/api/todos/completed', { method: 'DELETE' });
  },

  importTodos(todos: LegacyTodoInput[]): Promise<{ imported: number }> {
    return request('/api/todos/import', {
      method: 'POST',
      body: JSON.stringify({ todos }),
    });
  },
};
