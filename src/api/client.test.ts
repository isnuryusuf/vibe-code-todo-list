import { afterEach, describe, expect, test, vi } from 'vitest';
import { api, ApiError } from './client';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function mockFetch(...responses: Response[]) {
  const fetchMock = vi.fn();
  for (const response of responses) {
    fetchMock.mockResolvedValueOnce(response);
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('api client', () => {
  test('logs in with JSON credentials and returns the user', async () => {
    const fetchMock = mockFetch(jsonResponse({ user: { id: 1, username: 'alice' } }));

    const result = await api.login('alice', 'password1');

    expect(result).toEqual({ user: { id: 1, username: 'alice' } });
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'alice', password: 'password1' }),
      credentials: 'include',
    });
  });

  test('creates a todo and parses the response', async () => {
    const todo = {
      id: 'todo-1',
      text: 'Buy milk',
      completed: false,
      createdAt: 100,
      dueDate: '2026-12-25',
    };
    const fetchMock = mockFetch(jsonResponse(todo, 201));

    const result = await api.createTodo({ text: 'Buy milk', dueDate: '2026-12-25' });

    expect(result).toEqual(todo);
    expect(fetchMock).toHaveBeenCalledWith('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Buy milk', dueDate: '2026-12-25' }),
      credentials: 'include',
    });
  });

  test('throws ApiError with the server message and status', async () => {
    mockFetch(jsonResponse({ error: 'Task text is required' }, 400));

    const error = await api.createTodo({ text: '' }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      name: 'ApiError',
      message: 'Task text is required',
      status: 400,
    });
  });

  test('resolves a 204 response without parsing JSON', async () => {
    mockFetch({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('should not parse a 204 body');
      },
    } as unknown as Response);

    await expect(api.logout()).resolves.toBeUndefined();
  });

  test('sends null to clear a due date', async () => {
    const todo = { id: 'todo-1', text: 'Buy milk', completed: false, createdAt: 100 };
    const fetchMock = mockFetch(jsonResponse(todo));

    await api.updateTodo('todo-1', { dueDate: null });

    expect(fetchMock).toHaveBeenCalledWith('/api/todos/todo-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate: null }),
      credentials: 'include',
    });
  });
});
