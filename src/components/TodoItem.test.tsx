import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TodoItem } from './TodoItem';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: '1',
  text: 'Test todo',
  completed: false,
  createdAt: Date.now(),
  ...overrides,
});

describe('TodoItem', () => {
  test('calls onToggle on checkbox click', () => {
    const todo = makeTodo();
    const onToggle = vi.fn();
    render(
      <TodoItem todo={todo} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('calls onDelete on delete click', () => {
    const todo = makeTodo();
    const onDelete = vi.fn();
    render(
      <TodoItem todo={todo} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />
    );

    const deleteBtn = screen.getByLabelText('Delete');
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('applies completed styles', () => {
    const todo = makeTodo({ completed: true });
    render(
      <TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

    const text = screen.getByText('Test todo');
    const checkbox = screen.getByRole('checkbox');

    expect(checkbox.checked).toBe(true);
  });

  test('shows edit input on double-click', () => {
    const todo = makeTodo();
    render(
      <TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
    );

    const textEl = screen.getByText('Test todo');
    fireEvent.doubleClick(textEl);

    const input = screen.getByRole('textbox', { name: '' });
    expect(input).toBeDefined();
  });
});
