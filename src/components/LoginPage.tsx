import { useState, useCallback, type ChangeEvent, type KeyboardEvent, type FormEvent } from 'react';

export interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string) => Promise<void>;
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleUsernameChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setUsername(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPassword(e.target.value);
  }, []);

  const handleConfirmPasswordChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setConfirmPassword(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (submitting) return;

      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          return;
        }
      }

      setSubmitting(true);
      setError(null);

      try {
        if (mode === 'login') {
          await onLogin(username.trim(), password);
        } else {
          await onRegister(username.trim(), password);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setSubmitting(false);
      }
    },
    [mode, username, password, confirmPassword, submitting, onLogin, onRegister]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  const toggleMode = useCallback(() => {
    setMode((m) => (m === 'login' ? 'register' : 'login'));
    setError(null);
  }, []);
  void toggleMode; // exported for API consumers (e.g. programmatic switch)

  const submitLabel = mode === 'login' ? 'Sign in' : 'Create account';
  const submitText = submitting
    ? mode === 'login'
      ? 'Signing in…'
      : 'Creating account…'
    : submitLabel;

  return (
    <div className="min-h-screen bg-black text-zinc-300 flex items-center justify-center p-4">
      {/* Aurora glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Centered card */}
      <div className="relative w-full max-w-sm bg-zinc-950 rounded-3xl border border-zinc-900 shadow-2xl p-8">
        {/* Gradient app icon */}
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent header-shimmer">
          My Todos
        </h1>

        {/* Tabs */}
        <div className="flex bg-zinc-900 rounded-full p-1 mb-6">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            aria-pressed={mode === 'login'}
            onClick={() => setMode('login')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
              mode === 'login'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            aria-pressed={mode === 'register'}
            onClick={() => setMode('register')}
            className={`flex-1 py-2 text-sm font-medium rounded-full transition-colors ${
              mode === 'register'
                ? 'bg-zinc-800 text-white shadow'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Create account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-zinc-400 mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoFocus
              value={username}
              onChange={handleUsernameChange}
              onKeyDown={handleKeyDown}
              autoComplete="username"
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              onKeyDown={handleKeyDown}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'register' ? 8 : undefined}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
              placeholder={mode === 'login' ? 'Enter your password' : 'At least 8 characters'}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-400 mb-1">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors"
                placeholder="Re-enter your password"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div role="alert" className="p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
          >
            {submitText}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-600 mt-6">
          Local accounts · Stored securely in SQLite
        </p>
      </div>
    </div>
  );
}
