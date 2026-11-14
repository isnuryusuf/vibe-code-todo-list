import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CalendarExportButton } from './CalendarExportButton';
import type { Todo } from '../types/todo';

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: '1',
  text: 'Test todo',
  completed: false,
  createdAt: Date.now(),
  ...overrides,
});

describe('CalendarExportButton', () => {
  test('is disabled when no todo has a due date', () => {
    render(<CalendarExportButton todos={[makeTodo()]} />);

    const button = screen.getByRole('button', { name: /export/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  test('downloads an ICS file when clicked', async () => {
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL as typeof URL.createObjectURL;
    URL.revokeObjectURL = revokeObjectURL as typeof URL.revokeObjectURL;
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    try {
      render(<CalendarExportButton todos={[makeTodo({ dueDate: '2026-12-25' })]} />);
      fireEvent.click(screen.getByRole('button', { name: /export/i }));

      expect(createObjectURL).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock'));
    } finally {
      clickSpy.mockRestore();
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });
});
