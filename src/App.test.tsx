import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App smoke test', () => {
  test('renders the app', () => {
    render(<App />);
    // Check if anything rendered at all
    const body = document.body;
    console.log('body html:', body.innerHTML);
    expect(body.children.length).toBeGreaterThan(0);
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
    const deleteBtn = screen.getByLabelText('Delete');
    fireEvent.click(deleteBtn);

    // Verify it's gone
    await screen.findByText(/no tasks/i);
    expect(screen.queryByText('Learn TypeScript')).toBeFalsy();
  });
});
