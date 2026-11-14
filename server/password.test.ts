// @vitest-environment node
import { describe, test, expect } from 'vitest';
import { hashPassword, verifyPassword } from './password.ts';

describe('password hashing', () => {
  test('stores a salted scrypt hash that verifies the original password', async () => {
    const hash = await hashPassword('Mimin2026');
    expect(hash.startsWith('scrypt$')).toBe(true);
    expect(hash).not.toContain('Mimin2026');
    expect(await verifyPassword('Mimin2026', hash)).toBe(true);
  });

  test('uses a unique salt for every hash', async () => {
    expect(await hashPassword('same-password')).not.toBe(await hashPassword('same-password'));
  });

  test('rejects a wrong password and malformed hashes', async () => {
    const hash = await hashPassword('correct-horse');
    expect(await verifyPassword('wrong-horse', hash)).toBe(false);
    expect(await verifyPassword('anything', 'not-a-valid-hash')).toBe(false);
    expect(await verifyPassword('anything', 'scrypt$bad')).toBe(false);
  });
});
