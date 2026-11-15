import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import { importLegacyTodos } from '../utils/legacyImport';
import type { User } from '../types/user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const completeSignIn = useCallback(
    async (authUser: User) => {
      try {
        await importLegacyTodos(authUser.id);
      } catch {
        // Import failure is non-fatal; the user is already signed in.
      }
      setUser(authUser);
      setLoading(false);
    },
    []
  );

  // Bootstrap on mount
  useEffect(() => {
    api.me()
      .then(({ user: authUser }) => completeSignIn(authUser))
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function login(username: string, password: string): Promise<void> {
    const { user: authUser } = await api.login(username, password);
    await completeSignIn(authUser);
  }

  async function register(username: string, password: string): Promise<void> {
    const { user: authUser } = await api.register(username, password);
    await completeSignIn(authUser);
  }

  async function logout(): Promise<void> {
    try {
      await api.logout();
    } catch {
      // Network failure — still clear local state.
    }
    setUser(null);
  }

  return { user, loading, login, register, logout };
}
