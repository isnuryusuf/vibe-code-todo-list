import { createHash, randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Request } from 'express';
import type { AuthUser } from './types.ts';

export const SESSION_COOKIE = 'todo_session';
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface SessionRow {
  id: number;
  username: string;
  expires_at: number;
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(db: DatabaseSync, userId: number, now = Date.now()): string {
  const token = randomBytes(32).toString('hex');

  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
  db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).run(hashToken(token), userId, now + SESSION_TTL_MS, now);

  return token;
}

export function getSessionUser(
  db: DatabaseSync,
  rawToken: string,
  now = Date.now()
): AuthUser | null {
  const tokenHash = hashToken(rawToken);
  const row = db
    .prepare(
      `SELECT u.id AS id, u.username AS username, s.expires_at AS expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as SessionRow | undefined;

  if (!row) return null;

  if (row.expires_at <= now) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }

  return { id: row.id, username: row.username };
}

export function deleteSession(db: DatabaseSync, rawToken: string): void {
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(rawToken));
}

function cookieAttributes(): string {
  const secure = process.env.COOKIE_SECURE === 'true' ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export function sessionCookie(token: string): string {
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Max-Age=${maxAge}; ${cookieAttributes()}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Max-Age=0; ${cookieAttributes()}`;
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;

  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;

    const key = part.slice(0, separator).trim();
    if (key !== name) continue;

    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}
