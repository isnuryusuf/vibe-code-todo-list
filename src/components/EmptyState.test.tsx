import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  test('shows "No tasks yet" message for all filter', () => {
    render(<EmptyState filter="all" />);
    expect(screen.getByText('No tasks yet. Add one above!')).toBeTruthy();
  });

  test('shows "No active tasks" message for active filter', () => {
    render(<EmptyState filter="active" />);
    expect(screen.getByText(/No active tasks/i)).toBeTruthy();
  });

  test('shows "No completed tasks" message for completed filter', () => {
    render(<EmptyState filter="completed" />);
    expect(screen.getByText(/No completed tasks/i)).toBeTruthy();
  });
});
