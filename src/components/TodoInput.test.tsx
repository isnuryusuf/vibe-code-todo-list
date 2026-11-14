import { describe, test, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TodoInput } from './TodoInput';

describe('TodoInput', () => {
  test('calls addTodo on Enter key press', () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Buy milk' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onAdd).toHaveBeenCalledWith('Buy milk');
  });

  test('does not call addTodo on empty input', () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onAdd).not.toHaveBeenCalled();
  });

  test('clears input after adding', async () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Buy milk' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  test('calls addTodo on button click', () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Buy milk' } });
    fireEvent.click(screen.getByRole('button'));

    expect(onAdd).toHaveBeenCalledWith('Buy milk');
  });
});
