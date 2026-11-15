import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { installFakeApi } from './test/fakeApi';

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe('App with auth', () => {
  test('full user flow: login, add, toggle, edit, filter, delete, logout', async () => {
    const { fetchMock: _fetchMock } = installFakeApi({ authenticated: false });

    render(<App />);

    // Wait for login form to be ready
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Login as alice
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'alice' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    // Add "Learn React"
    const input = screen.getByPlaceholderText(/what needs/i);
    fireEvent.change(input, { target: { value: 'Learn React' } });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    await screen.findByText('Learn React');

    // Toggle it (mark complete)
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Filter to "completed" - should appear
    fireEvent.click(screen.getByText('Completed'));
    await screen.findByText('Learn React');

    // Filter to "active" - should not appear
    fireEvent.click(screen.getByText('Active'));
    expect(screen.queryByText('Learn React')).toBeFalsy();

    // Go back to "all" to edit
    fireEvent.click(screen.getByText('All'));
    await screen.findByText('Learn React');

    // Edit text to "Learn TypeScript"
    const todoText = screen.getByText('Learn React');
    fireEvent.doubleClick(todoText);

    const editInput = screen.getByDisplayValue('Learn React');
    fireEvent.change(editInput, { target: { value: 'Learn TypeScript' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });

    // Verify updated text
    await screen.findByText('Learn TypeScript');
    expect(screen.queryByText('Learn React')).toBeFalsy();

    // Delete it
    const deleteBtn = screen.getByLabelText(/delete/i);
    fireEvent.click(deleteBtn);

    // Verify it's gone
    await screen.findByText(/no tasks/i);
    expect(screen.queryByText('Learn TypeScript')).toBeFalsy();

    // Logout should return to login page
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    // Login form mounts asynchronously after logout
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });
  });

  test('desktop two-column layout with authenticated API', async () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as unknown as typeof window.matchMedia;

    try {
      installFakeApi({ todos: [{ id: '1', text: 'Desktop task', completed: false, createdAt: 1 }] });
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText('Desktop task')).toBeInTheDocument();
      });

      expect(screen.getByRole('grid')).toBeDefined();
      expect(screen.getByText('All')).toBeDefined();
      expect(screen.getByRole('complementary', { name: /calendar/i })).toBeDefined();
    } finally {
      window.matchMedia = original;
    }
  });

  test('calendar toggle and calendar-date filter', async () => {
    installFakeApi({
      todos: [{ id: '1', text: 'Meeting', completed: false, createdAt: 1, dueDate: '2026-11-25' }],
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Meeting')).toBeInTheDocument();
    });

    // Switch to calendar view
    fireEvent.click(screen.getByText('Calendar'));
    expect(screen.getByRole('grid')).toBeDefined();

    // Click date 25 in the calendar (currently showing November)
    const day25 = screen.getByText('25');
    fireEvent.click(day25);

    // List should filter to only tasks due on that date
    await screen.findByText('Meeting');
  });

  test('header export control is present', async () => {
    installFakeApi();
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /export/i })).toBeDefined();
  });

  test('unauthenticated render shows the login form', async () => {
    installFakeApi({ authenticated: false });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  test('login with alice / password1 (fake loginPassword) reaches the todo app and shows the username', async () => {
    installFakeApi({ authenticated: false });
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'alice' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });
  });

  test('logout returns to the login form', async () => {
    installFakeApi();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    // Login form mounts asynchronously after logout
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });
  });

  test('legacy import: seed todos-app, boot authenticated, assert import call, key removed, imported task visible', async () => {
    const { state: _state, fetchMock } = installFakeApi({
      authenticated: false,
      todos: [],
    });
    localStorage.setItem(
      'todos-app',
      JSON.stringify([{ id: '1', text: 'Legacy task', completed: false, createdAt: 1 }])
    );

    render(<App />);

    // Wait for login form
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });

    // Login as alice
    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: 'alice' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('Legacy task')).toBeInTheDocument();
    });

    // Verify import was called
    expect(fetchMock).toHaveBeenCalledWith('/api/todos/import', expect.any(Object));

    // Verify legacy key removed
    expect(localStorage.getItem('todos-app')).toBeNull();

    // Verify import marker set
    expect(localStorage.getItem('todos-imported:1')).not.toBeNull();
  });

  test('API load failure shows the error banner and Retry recovers', async () => {
    const { state } = installFakeApi({
      failTodos: true,
    });
    render(<App />);

    // Wait for login form (bootstrap succeeds: me() returns user, todos fail)
    await waitFor(() => {
      expect(screen.getByText('alice')).toBeInTheDocument();
    });

    // Error banner should appear
    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Database unavailable');
    });

    // Fix the API
    state.failTodos = false;
    state.todos = [{ id: '1', text: 'Recovered', completed: false, createdAt: 1 }];

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    await screen.findByText('Recovered');
  });
});
