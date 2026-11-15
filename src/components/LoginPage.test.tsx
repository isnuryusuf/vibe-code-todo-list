import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  test('renders username/password fields and a "Sign in" submit button', () => {
    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} onRegister={vi.fn()} />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('switching to "Create account" reveals a confirm-password field', () => {
    render(<LoginPage onLogin={vi.fn()} onRegister={vi.fn()} />);

    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /create account/i }));

    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  test('mismatched passwords show "Passwords do not match" and do not call onRegister', async () => {
    const onRegister = vi.fn();
    render(<LoginPage onLogin={vi.fn()} onRegister={onRegister} />);

    fireEvent.click(screen.getByRole('tab', { name: /create account/i }));

    const password = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    const confirmPassword = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

    fireEvent.change(password, { target: { value: 'password1' } });
    fireEvent.change(confirmPassword, { target: { value: 'differs1' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/passwords do not match/i);
    });
    expect(onRegister).not.toHaveBeenCalled();
  });

  test('a short registration password is rejected client-side', () => {
    render(<LoginPage onLogin={vi.fn()} onRegister={vi.fn()} />);

    fireEvent.click(screen.getByRole('tab', { name: /create account/i }));

    const password = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    const confirmPassword = screen.getByLabelText(/confirm password/i) as HTMLInputElement;
    fireEvent.change(password, { target: { value: 'short' } });
    fireEvent.change(confirmPassword, { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i);
  });

  test('successful login sends the trimmed username and exact password once', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<LoginPage onLogin={onLogin} onRegister={vi.fn()} />);

    const input = screen.getByLabelText(/username/i) as HTMLInputElement;
    const password = screen.getByLabelText(/password/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: '  alice  ' } });
    fireEvent.change(password, { target: { value: 'password1' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('alice', 'password1');
    });
  });

  test('successful registration sends credentials once', async () => {
    const onRegister = vi.fn().mockResolvedValue(undefined);
    render(<LoginPage onLogin={vi.fn()} onRegister={onRegister} />);

    fireEvent.click(screen.getByRole('tab', { name: /create account/i }));

    const inputs = screen.getAllByRole('textbox');
    const password = screen.getByLabelText(/^Password$/i) as HTMLInputElement;
    const confirmPassword = screen.getByLabelText(/confirm password/i) as HTMLInputElement;

    fireEvent.change(inputs[0], { target: { value: '  alice  ' } });
    fireEvent.change(password, { target: { value: 'password1' } });
    fireEvent.change(confirmPassword, { target: { value: 'password1' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(onRegister).toHaveBeenCalledWith('alice', 'password1');
    });
  });

  test('a rejected promise displays its message in role="alert" and re-enables the submit button', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    render(<LoginPage onLogin={onLogin} onRegister={vi.fn()} />);

    const input = screen.getByLabelText(/username/i) as HTMLInputElement;
    const password = screen.getByLabelText(/password/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'alice' } });
    fireEvent.change(password, { target: { value: 'wrong' } });

    const button = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(button);

    // Button should show loading state
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/signing in/i);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
      expect(button).not.toBeDisabled();
    });
  });
});
