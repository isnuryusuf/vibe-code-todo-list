import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import type { AuthUser } from './types.ts';
import { hashPassword, verifyPassword } from './password.ts';
import {
  SESSION_COOKIE,
  clearSessionCookie,
  createSession,
  deleteSession,
  getSessionUser,
  readCookie,
  sessionCookie,
} from './sessions.ts';

interface UserRow {
  id: number;
  username: string;
  password_hash: string;
}

interface Credentials {
  username: string;
  password: string;
}

const USERNAME_PATTERN = /^[A-Za-z0-9_.-]+$/;

function readCredentials(body: unknown): Credentials | null {
  if (!body || typeof body !== 'object') return null;

  const { username, password } = body as Record<string, unknown>;
  if (typeof username !== 'string' || typeof password !== 'string') return null;

  return { username: username.trim(), password };
}

function validateUsername(username: string): string | null {
  if (username.length < 3 || username.length > 32) {
    return 'Username must be 3-32 characters';
  }
  if (!USERNAME_PATTERN.test(username)) {
    return 'Username may only contain letters, numbers, dots, dashes, and underscores';
  }
  return null;
}

function validatePassword(password: string): string | null {
  if (password.length < 8 || password.length > 128) {
    return 'Password must be 8-128 characters';
  }
  return null;
}

export function requireAuth(db: DatabaseSync): RequestHandler {
  return (req, res, next) => {
    const token = readCookie(req, SESSION_COOKIE);
    const user = token ? getSessionUser(db, token) : null;

    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    res.locals.user = user;
    next();
  };
}

export function createAuthRouter(db: DatabaseSync): Router {
  const router = Router();

  router.post('/register', async (req, res) => {
    const credentials = readCredentials(req.body);
    if (!credentials) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const usernameError = validateUsername(credentials.username);
    if (usernameError) {
      res.status(400).json({ error: usernameError });
      return;
    }

    const passwordError = validatePassword(credentials.password);
    if (passwordError) {
      res.status(400).json({ error: passwordError });
      return;
    }

    const existing = db
      .prepare('SELECT id FROM users WHERE username = ?')
      .get(credentials.username);
    if (existing) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    const passwordHash = await hashPassword(credentials.password);

    let userId: number;
    try {
      const result = db
        .prepare('INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)')
        .run(credentials.username, passwordHash, Date.now());
      userId = Number(result.lastInsertRowid);
    } catch (error) {
      if (String(error).includes('UNIQUE')) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }
      throw error;
    }

    const user: AuthUser = { id: userId, username: credentials.username };
    res.setHeader('Set-Cookie', sessionCookie(createSession(db, userId)));
    res.status(201).json({ user });
  });

  router.post('/login', async (req, res) => {
    const credentials = readCredentials(req.body);
    if (!credentials || !credentials.username || !credentials.password) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const row = db
      .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
      .get(credentials.username) as UserRow | undefined;

    if (!row || !(await verifyPassword(credentials.password, row.password_hash))) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const user: AuthUser = { id: row.id, username: row.username };
    res.setHeader('Set-Cookie', sessionCookie(createSession(db, row.id)));
    res.json({ user });
  });

  router.post('/logout', (req, res) => {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) {
      deleteSession(db, token);
    }

    res.setHeader('Set-Cookie', clearSessionCookie());
    res.status(204).end();
  });

  router.get('/me', requireAuth(db), (_req, res) => {
    res.json({ user: res.locals.user as AuthUser });
  });

  return router;
}
