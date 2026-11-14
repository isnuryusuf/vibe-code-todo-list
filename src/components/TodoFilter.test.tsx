import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { TodoFilter } from './TodoFilter';

describe('TodoFilter', () => {
  test('shows six tabs: All, Active, Completed, Today, Upcoming, Overdue', () => {
    render(<TodoFilter filter="all" onChange={vi.fn()} />);

    expect(screen.getByText('All')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('Upcoming')).toBeTruthy();
    expect(screen.getByText('Overdue')).toBeTruthy();
  });

  test('calls onChange when tab is clicked', () => {
    const onChange = vi.fn();
    render(<TodoFilter filter="all" onChange={onChange} />);

    fireEvent.click(screen.getByText('Active'));
    expect(onChange).toHaveBeenCalledWith('active');

    fireEvent.click(screen.getByText('Completed'));
    expect(onChange).toHaveBeenCalledWith('completed');

    fireEvent.click(screen.getByText('Today'));
    expect(onChange).toHaveBeenCalledWith('today');

    fireEvent.click(screen.getByText('Overdue'));
    expect(onChange).toHaveBeenCalledWith('overdue');
  });

  test('highlights active tab', () => {
    render(<TodoFilter filter="completed" onChange={vi.fn()} />);

    const completedBtn = screen.getByText('Completed') as HTMLElement;
    expect(completedBtn.className).toContain('text-indigo-300');
    expect(completedBtn.className).toContain('border-indigo-400');
  });
});
