import type { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './password.ts';

export const DEFAULT_USERNAME = 'mimin';
export const DEFAULT_PASSWORD = 'Mimin2026';

export async function seedDefaultUser(db: DatabaseSync): Promise<boolean> {
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(DEFAULT_USERNAME);

  if (existing) return false;

  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  db.prepare(
    'INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)'
  ).run(DEFAULT_USERNAME, passwordHash, Date.now());

  return true;
}
