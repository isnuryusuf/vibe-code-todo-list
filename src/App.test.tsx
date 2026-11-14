import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App smoke test', () => {
  test('renders the app', () => {
    render(<App />);
    expect(document.body.children.length).toBeGreaterThan(0);
  });

  test('full user flow: add, toggle, edit, filter, delete', async () => {
    render(<App />);

    // Add "Learn React"
    const input = screen.getByPlaceholderText(/what needs/i);
    expect(input).toBeTruthy();

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
  });

  test('shows the calendar beside the list at desktop widths', () => {
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
      render(<App />);
      expect(screen.getByRole('grid')).toBeDefined();
      expect(screen.getByText('All')).toBeDefined();
      expect(screen.getByRole('complementary', { name: /calendar/i })).toBeDefined();
    } finally {
      window.matchMedia = original;
    }
  });

  test('shows the ICS export control in the header', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /export/i })).toBeDefined();
  });

  test('switches to calendar view', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Calendar'));
    expect(screen.getByRole('grid')).toBeDefined();
  });

  test('selecting a calendar date filters list to that date', async () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/what needs/i);
    fireEvent.change(input, { target: { value: 'Meeting' } });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));
    await screen.findByText('Meeting');

    fireEvent.click(screen.getByLabelText(/pick due date/i));
    fireEvent.click(screen.getByText('25'));

    fireEvent.click(screen.getByText('Calendar'));
    fireEvent.click(screen.getByText('25'));

    await screen.findByText('Meeting');
  });
});
