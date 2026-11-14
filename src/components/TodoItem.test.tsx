import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TodoItem } from './TodoItem';
import type { Todo } from '../types/todo';

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
      <TodoItem todo={todo} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} onSetDueDate={vi.fn()} />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test('calls onDelete on delete click', () => {
    const todo = makeTodo();
    const onDelete = vi.fn();
    render(
      <TodoItem todo={todo} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} onSetDueDate={vi.fn()} />
    );

    const deleteBtn = screen.getByLabelText(/delete/i);
    fireEvent.click(deleteBtn);

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('applies completed styles', () => {
    const todo = makeTodo({ completed: true });
    render(
      <TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} onSetDueDate={vi.fn()} />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;

    expect(checkbox.checked).toBe(true);
  });

  test('shows edit input on double-click', () => {
    const todo = makeTodo();
    render(
      <TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} onSetDueDate={vi.fn()} />
    );

    const textEl = screen.getByText('Test todo');
    fireEvent.doubleClick(textEl);

    const input = screen.getByDisplayValue('Test todo');
    expect(input).toBeDefined();
  });

  test('cancels edit on Escape', () => {
    const onEdit = vi.fn();
    const todo = makeTodo();
    render(
      <TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} onSetDueDate={vi.fn()} />
    );

    fireEvent.doubleClick(screen.getByText('Test todo'));
    const input = screen.getByDisplayValue('Test todo') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Changed text' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText('Test todo')).toBeDefined();
  });

  test('displays formatted due date', () => {
    const todo = makeTodo({ dueDate: '2025-12-25' });
    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} onSetDueDate={vi.fn()} />);
    expect(screen.getByLabelText(/due:/i)).toBeDefined();
  });

  test('shows overdue badge for past uncompleted todo', () => {
    const todo = makeTodo({ dueDate: '2020-01-01' });
    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} onSetDueDate={vi.fn()} />);
    expect(screen.getByText(/overdue/i)).toBeDefined();
  });

  test('calls onSetDueDate when date is selected', () => {
    const onSetDueDate = vi.fn();
    const todo = makeTodo();
    render(<TodoItem todo={todo} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} onSetDueDate={onSetDueDate} />);
    fireEvent.click(screen.getByLabelText(/pick due date/i));
    fireEvent.click(screen.getByText('15'));
    expect(onSetDueDate).toHaveBeenCalled();
  });
});
