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

  test('closes the popover on Escape', () => {
    render(<DueDatePicker onChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/pick due date/i));
    expect(screen.getByRole('grid')).toBeDefined();
    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('grid')).toBeNull();
  });

  test('closes on outside pointerdown and the click still reaches the element underneath', () => {
    const onOutsideClick = vi.fn();
    render(
      <div>
        <DueDatePicker onChange={vi.fn()} />
        <button type="button" onClick={onOutsideClick}>somewhere else</button>
      </div>
    );
    fireEvent.click(screen.getByLabelText(/pick due date/i));
    expect(screen.getByRole('grid')).toBeDefined();
    fireEvent.pointerDown(screen.getByText('somewhere else'));
    fireEvent.click(screen.getByText('somewhere else'));
    expect(screen.queryByRole('grid')).toBeNull();
    expect(onOutsideClick).toHaveBeenCalledTimes(1);
  });

  test('closes when pressing down on a non-interactive part of the popover', () => {
    render(<DueDatePicker onChange={vi.fn()} />);
    fireEvent.click(screen.getByLabelText(/pick due date/i));
    expect(screen.getByRole('grid')).toBeDefined();
    const caption = document.querySelector('.rdp-month_caption');
    expect(caption).not.toBeNull();
    fireEvent.pointerDown(caption as Element);
    expect(screen.queryByRole('grid')).toBeNull();
  });

  test('closes the popover when the trigger is clicked again', () => {
    render(<DueDatePicker onChange={vi.fn()} />);
    const trigger = screen.getByLabelText(/pick due date/i);
    fireEvent.click(trigger);
    expect(screen.getByRole('grid')).toBeDefined();
    fireEvent.click(trigger);
    expect(screen.queryByRole('grid')).toBeNull();
  });
});
