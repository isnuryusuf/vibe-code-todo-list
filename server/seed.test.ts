// @vitest-environment node
import { describe, test, expect } from 'vitest';
import { createDatabase } from './db.ts';
import { seedDefaultUser } from './seed.ts';
import { verifyPassword } from './password.ts';

describe('seedDefaultUser', () => {
  test('creates mimin with the requested password', async () => {
    const db = createDatabase(':memory:');
    expect(await seedDefaultUser(db)).toBe(true);

    const row = db
      .prepare('SELECT username, password_hash FROM users WHERE username = ?')
      .get('mimin') as { username: string; password_hash: string };

    expect(row.username).toBe('mimin');
    expect(await verifyPassword('Mimin2026', row.password_hash)).toBe(true);
    expect(await verifyPassword('wrong', row.password_hash)).toBe(false);
  });

  test('is idempotent and never overwrites an existing account', async () => {
    const db = createDatabase(':memory:');
    await seedDefaultUser(db);
    const before = db
      .prepare('SELECT password_hash FROM users WHERE username = ?')
      .get('mimin') as { password_hash: string };

    expect(await seedDefaultUser(db)).toBe(false);

    const after = db
      .prepare('SELECT password_hash FROM users WHERE username = ?')
      .get('mimin') as { password_hash: string };
    expect(after.password_hash).toBe(before.password_hash);
    expect(
      (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n
    ).toBe(1);
  });
});
