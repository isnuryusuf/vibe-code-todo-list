import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TodoList } from './TodoList';
import { Todo } from '../types/todo';

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
});
