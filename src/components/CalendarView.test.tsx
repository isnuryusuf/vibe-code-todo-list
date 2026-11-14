import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from './CalendarView';
import type { Todo } from '../types/todo';

const makeTodo = (text: string, dueDate: string): Todo => ({
  id: text,
  text,
  completed: false,
  createdAt: Date.now(),
  dueDate,
});

describe('CalendarView', () => {
  test('renders month grid', () => {
    render(<CalendarView todos={[]} onDateSelect={vi.fn()} />);
    expect(screen.getByRole('grid')).toBeDefined();
  });

  test('highlights the selected date', () => {
    render(
      <CalendarView
        todos={[]}
        onDateSelect={vi.fn()}
        initialMonth={new Date('2025-12-01')}
        selectedDate="2025-12-15"
      />
    );
    expect(screen.getByLabelText(/December 15th, 2025, selected/i)).toBeDefined();
  });

  test('calls onDateSelect when a day with a todo is clicked', () => {
    const onSelect = vi.fn();
    render(
      <CalendarView
        todos={[makeTodo('A', '2025-12-25')]}
        onDateSelect={onSelect}
        initialMonth={new Date('2025-12-01')}
      />
    );
    fireEvent.click(screen.getByText('25'));
    expect(onSelect).toHaveBeenCalledWith('2025-12-25');
  });
});
