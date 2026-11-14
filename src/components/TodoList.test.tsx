import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodoList } from './TodoList';
import type { Todo } from '../types/todo';

const makeTodos = (count: number, completedCount: number = 0): Todo[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `todo-${i}`,
    text: `Todo ${i + 1}`,
    completed: i < completedCount,
    createdAt: Date.now(),
  }));

describe('TodoList', () => {
  test('renders filtered todos', () => {
    const todos = makeTodos(3, 1);
    render(
      <TodoList
        todos={todos}
        filter="active"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('Todo 2')).toBeTruthy();
    expect(screen.getByText('Todo 3')).toBeTruthy();
    expect(screen.queryByText('Todo 1')).toBeFalsy();
  });

  test('renders TodoItem for each todo', () => {
    const todos = makeTodos(2, 0);
    render(
      <TodoList
        todos={todos}
        filter="all"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('Todo 1')).toBeTruthy();
    expect(screen.getByText('Todo 2')).toBeTruthy();
  });

  test('renders empty state when no todos match', () => {
    render(
      <TodoList
        todos={[]}
        filter="all"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText(/no tasks/i)).toBeTruthy();
  });

  test('filter overdue shows only overdue uncompleted todos', () => {
    const todos = [
      { id: '1', text: 'Old', completed: false, createdAt: 1, dueDate: '2020-01-01' },
      { id: '2', text: 'Done old', completed: true, createdAt: 1, dueDate: '2020-01-01' },
      { id: '3', text: 'Future', completed: false, createdAt: 1, dueDate: '2030-01-01' },
    ];
    render(
      <TodoList
        todos={todos}
        filter="overdue"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText('Old')).toBeTruthy();
    expect(screen.queryByText('Done old')).toBeFalsy();
    expect(screen.queryByText('Future')).toBeFalsy();
  });

  test('todos are sorted by due date', () => {
    const todos = [
      { id: '1', text: 'Later', completed: false, createdAt: 1, dueDate: '2030-01-01' },
      { id: '2', text: 'Sooner', completed: false, createdAt: 1, dueDate: '2025-01-01' },
    ];
    render(
      <TodoList
        todos={todos}
        filter="all"
        onToggle={vi.fn()}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    const items = screen.getAllByRole('listitem');
    expect(items[0].textContent).toContain('Sooner');
  });
});
