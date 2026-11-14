import { describe, test, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useIsDesktop } from './useMediaQuery';

const originalMatchMedia = window.matchMedia;

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe('useIsDesktop', () => {
  test('returns true when the viewport is at least 900px wide', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(true);
  });

  test('returns false when the viewport is below 900px wide', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);
  });

  test('returns false when matchMedia is unavailable', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).matchMedia = undefined;
    const { result } = renderHook(() => useIsDesktop());
    expect(result.current).toBe(false);
  });
});
