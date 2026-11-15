import { vi } from 'vitest';
import type { Todo } from '../types/todo';
import type { User } from '../types/user';

export interface FakeApiState {
  authenticated: boolean;
  user: User | null;
  todos: Todo[];
  importCalls: number;
  failTodos: boolean;
}

export interface FakeApiOptions {
  authenticated?: boolean;
  user?: User;
  todos?: Todo[];
  loginPassword?: string;
  failTodos?: boolean;
}

const DEFAULT_USER: User = { id: 1, username: 'alice' };
const DEFAULT_PASSWORD = 'password1';

function reply(status: number, body?: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function parseBody(init?: RequestInit): Record<string, unknown> {
  if (!init?.body || typeof init.body !== 'string') return {};
  try {
    return JSON.parse(init.body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function installFakeApi(options: FakeApiOptions = {}) {
  let account: User = options.user ?? DEFAULT_USER;
  const password = options.loginPassword ?? DEFAULT_PASSWORD;

  const state: FakeApiState = {
    authenticated: options.authenticated ?? true,
    user: options.authenticated ?? true ? { ...account } : null,
    todos: (options.todos ?? []).map((todo) => ({ ...todo })),
    importCalls: 0,
    failTodos: options.failTodos ?? false,
  };

  function unauthorized(): Response {
    return reply(401, { error: 'Unauthorized' });
  }

  function signedIn(): boolean {
    return state.authenticated && state.user !== null;
  }

  function findTodo(id: string): Todo | undefined {
    return state.todos.find((todo) => todo.id === id);
  }

  async function handle(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = parseBody(init);

    if (url === '/api/health') {
      return reply(200, { ok: true });
    }

    if (url === '/api/auth/login' && method === 'POST') {
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      const supplied = typeof body.password === 'string' ? body.password : '';
      const matchesAccount = username.toLowerCase() === account.username.toLowerCase();
      const matchesPassword = supplied === password;

      if (!matchesAccount || !matchesPassword) {
        return reply(401, { error: 'Invalid username or password' });
      }

      state.authenticated = true;
      state.user = { ...account };
      return reply(200, { user: state.user });
    }

    if (url === '/api/auth/register' && method === 'POST') {
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      const supplied = typeof body.password === 'string' ? body.password : '';

      if (username.length < 3 || supplied.length < 8) {
        return reply(400, { error: 'Invalid username or password' });
      }
      if (username.toLowerCase() === account.username.toLowerCase()) {
        return reply(409, { error: 'Username already taken' });
      }

      account = { id: account.id + 1, username };
      state.authenticated = true;
      state.user = { ...account };
      return reply(201, { user: state.user });
    }

    if (url === '/api/auth/logout' && method === 'POST') {
      state.authenticated = false;
      state.user = null;
      return reply(204);
    }

    if (url === '/api/auth/me' && method === 'GET') {
      if (!signedIn()) return unauthorized();
      return reply(200, { user: state.user });
    }

    if (url === '/api/todos' && method === 'GET') {
      if (!signedIn()) return unauthorized();
      if (state.failTodos) {
        return reply(500, { error: 'Database unavailable' });
      }
      return reply(200, state.todos);
    }

    if (url === '/api/todos' && method === 'POST') {
      if (!signedIn()) return unauthorized();

      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (text.length === 0 || text.length > 500) {
        return reply(400, { error: 'Task text is required and must be 500 characters or fewer' });
      }

      const todo: Todo = {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: Date.now(),
        ...(typeof body.dueDate === 'string' ? { dueDate: body.dueDate } : {}),
      };
      state.todos = [...state.todos, todo];
      return reply(201, todo);
    }

    if (url === '/api/todos/import' && method === 'POST') {
      if (!signedIn()) return unauthorized();

      state.importCalls += 1;
      const items = Array.isArray(body.todos) ? body.todos : [];
      let imported = 0;

      for (const raw of items) {
        if (!raw || typeof raw !== 'object') continue;
        const item = raw as Record<string, unknown>;
        const text = typeof item.text === 'string' ? item.text.trim() : '';
        if (text.length === 0) continue;

        const id = typeof item.id === 'string' && item.id.length > 0 ? item.id : crypto.randomUUID();
        if (findTodo(id)) continue;

        const todo: Todo = {
          id,
          text,
          completed: Boolean(item.completed),
          createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
          ...(typeof item.dueDate === 'string' ? { dueDate: item.dueDate } : {}),
        };
        state.todos = [...state.todos, todo];
        imported += 1;
      }

      return reply(200, { imported });
    }

    if (url === '/api/todos/completed' && method === 'DELETE') {
      if (!signedIn()) return unauthorized();

      const before = state.todos.length;
      state.todos = state.todos.filter((todo) => !todo.completed);
      return reply(200, { deleted: before - state.todos.length });
    }

    const todoMatch = /^\/api\/todos\/([^/]+)$/.exec(url);
    if (todoMatch) {
      if (!signedIn()) return unauthorized();
      const id = decodeURIComponent(todoMatch[1]);
      const todo = findTodo(id);

      if (method === 'PATCH') {
        if (!todo) return reply(404, { error: 'Todo not found' });

        const updated: Todo = { ...todo };
        if (typeof body.text === 'string') updated.text = body.text.trim();
        if (typeof body.completed === 'boolean') updated.completed = body.completed;
        if (body.dueDate === null) {
          delete updated.dueDate;
        } else if (typeof body.dueDate === 'string') {
          updated.dueDate = body.dueDate;
        }

        state.todos = state.todos.map((item) => (item.id === id ? updated : item));
        return reply(200, updated);
      }

      if (method === 'DELETE') {
        if (!todo) return reply(404, { error: 'Todo not found' });
        state.todos = state.todos.filter((item) => item.id !== id);
        return reply(204);
      }
    }

    return reply(404, { error: 'Not found' });
  }

  const fetchMock = vi.fn(handle);
  vi.stubGlobal('fetch', fetchMock);

  return { state, fetchMock };
}
