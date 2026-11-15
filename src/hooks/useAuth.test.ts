import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';
import { installFakeApi } from '../test/fakeApi';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useAuth', () => {
  test('bootstrap with 401 /me returns loading:false and user:null', async () => {
    installFakeApi({ authenticated: false });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('authenticated /me restores the user and runs import', async () => {
    const { state, fetchMock } = installFakeApi();
    localStorage.setItem('todos-app', JSON.stringify([{ id: '1', text: 'Legacy', completed: false, createdAt: 1 }]));

    renderHook(() => useAuth());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(state.user).not.toBeNull();
    expect(state.importCalls).toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2); // /me + /import
  });

  test('login sets the user and triggers migration', async () => {
    const { state } = installFakeApi({ authenticated: false });
    localStorage.setItem('todos-app', JSON.stringify([{ id: '1', text: 'Legacy', completed: false, createdAt: 1 }]));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.user).toBeNull();

    await act(async () => {
      await result.current.login('mimin', 'Mimin2026');
    });

    expect(result.current.user).not.toBeNull();
    expect(state.importCalls).toBe(1);
  });

  test('a failed login rejects and leaves user null', async () => {
    const { state } = installFakeApi({ authenticated: false });
    localStorage.clear();

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.user).toBeNull();

    const error = await act(async () => {
      try {
        await result.current.login('mimin', 'wrong-password');
      } catch (e) {
        return e;
      }
    });

    expect(error).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(state.user).toBeNull();
  });

  test('logout calls the API and clears the user', async () => {
    const { state } = installFakeApi();

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(result.current.user).not.toBeNull();

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(state.user).toBeNull();
  });
});
