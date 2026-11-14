import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DueDatePicker } from './DueDatePicker';

describe('DueDatePicker', () => {
  test('opens calendar popover on button click', () => {
    render(<DueDatePicker onChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/pick due date/i));
    expect(screen.getByRole('grid')).toBeDefined();
  });

  test('calls onChange with selected date', () => {
    const onChange = vi.fn();
    render(<DueDatePicker onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/pick due date/i));
    fireEvent.click(screen.getByText('15'));
    expect(onChange).toHaveBeenCalled();
  });

  test('shows clear button when date is set', () => {
    render(<DueDatePicker value="2025-12-25" onChange={vi.fn()} />);
    expect(screen.getByLabelText(/clear due date/i)).toBeDefined();
  });
});
