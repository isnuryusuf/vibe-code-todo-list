# Multi-user SQLite Todos — Design

**Date:** 2026-11-14
**Status:** Approved by request ("process"); self-service sign-up and one-time legacy import included.

## Intent

Move the todo app from a single browser-local list to a multi-user app with a login page, server-side sessions, and per-user storage in SQLite. Existing todo features (due dates, filters, calendar, calendar export) must keep working. A default account `mimin` / `Mimin2026` must exist on a fresh database.

## Goals

- Sign in, create an account, and sign out.
- Server-side sessions with HTTP-only cookies.
- Passwords stored as salted scrypt hashes, never plaintext.
- `users`, `sessions`, and `todos` tables in SQLite.
- Every todo read/write is scoped to the signed-in user.
- Existing `localStorage` todos are imported once into the first account used in that browser.
- Dev experience stays one command: `npm run dev`.
- Production: `npm run build && npm start` serves the built app and API from one server.

## Non-goals

- Password reset or password change.
- Email verification, OAuth, or social login.
- Sharing todos between users.
- Real-time multi-device sync.
- Admin UI, account deletion, or role management.
- Rate limiting and CSRF tokens (SameSite=Lax cookies and JSON-only endpoints are the baseline; add before exposing to the public internet).
- TLS termination (deploy behind HTTPS and set `COOKIE_SECURE=true`).

## Approaches considered

1. **Express + Node's built-in `node:sqlite` (chosen).** Node 26 runs TypeScript directly and ships SQLite, so the backend needs no native build step. Express is the only runtime dependency. Sessions live in SQLite.
2. **Hono + better-sqlite3.** Lean framework, but `better-sqlite3` is a native addon with platform build friction; the project already uses Node 26, so the built-in driver wins.
3. **Hosted auth/database (Supabase, Firebase).** Would remove backend code, but the requirement is explicitly local SQLite storage, and adding an external service contradicts that.

## Architecture

```
Browser (React, Vite :5173)
  │  /api/*  (proxied in dev, same origin in prod)
  ▼
Express API (:3001)
  ├─ auth routes → scrypt password hashes, sessions table, HTTP-only cookie
  └─ todo routes → user-scoped SQL in data/todos.db
```

- Dev: `npm run dev` runs Express (`node --watch server/index.ts`) and Vite together; Vite proxies `/api` to port 3001.
- Production: `npm run build` compiles/type-checks and builds `dist`; `npm start` runs Express, which serves `dist` plus the API.
- The frontend still uses `useTodos`, but its actions now call the API. No todo data is written to `localStorage`; the only remaining keys are the one-time import marker and the legacy source being imported.

## Data model

```sql
users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
)

sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
)

todos (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  due_date TEXT
)
```

Indexes: `todos(user_id, created_at)`, `sessions(user_id)`. WAL mode and foreign keys enabled for file databases.

## API

| Method | Path | Auth | Behavior |
|---|---|---|---|
| GET | `/api/health` | no | `{ ok: true }` |
| POST | `/api/auth/register` | no | Validate, create user, start session, 201 |
| POST | `/api/auth/login` | no | Verify password, start session, 200 |
| POST | `/api/auth/logout` | cookie | Delete session, clear cookie, 204 |
| GET | `/api/auth/me` | cookie | `{ user: { id, username } }` or 401 |
| GET | `/api/todos` | yes | Current user's todos, oldest first |
| POST | `/api/todos` | yes | Create `{ text, dueDate? }` |
| PATCH | `/api/todos/:id` | yes | Update `text`, `completed`, `dueDate` (`null` clears) |
| DELETE | `/api/todos/:id` | yes | Delete one owned todo |
| DELETE | `/api/todos/completed` | yes | Delete owned completed todos |
| POST | `/api/todos/import` | yes | Idempotent batch import of legacy todos |

Validation: username 3–32 chars matching `[A-Za-z0-9_.-]`; password 8–128 chars; todo text 1–500 chars after trim; due date must be a real `YYYY-MM-DD`; import batches capped at 500.

## Sessions and security

- Session token: 32 random bytes, hex-encoded in the cookie. Only its SHA-256 hash is stored in SQLite.
- Cookie: `todo_session`, `HttpOnly`, `SameSite=Lax`, `Path=/`, 7-day expiry. `Secure` only when `COOKIE_SECURE=true`.
- Passwords: `scrypt` with a random 16-byte salt and 64-byte derived key, stored as `scrypt$<salt>$<hash>`; verification uses `timingSafeEqual`.
- Login and registration return only `{ id, username }`.
- All todo queries include `user_id`; foreign objects return 404.
- JSON body limit 64 KB; generic 500 responses; no stack traces to clients.
- Seed `mimin` only if no user with that username exists, so restarts do not overwrite a changed account.

## Legacy migration

On successful login, registration, or session restore:

1. If `localStorage["todos-app"]` has a non-empty array, POST valid items to `/api/todos/import`.
2. The server inserts with the original IDs using `INSERT OR IGNORE`, so retries are safe.
3. On success, remove `todos-app` and set `todos-imported:<userId>`.
4. On failure, keep the legacy data and retry on the next login.

## Decisions made by the builder

- Express 5 + `node:sqlite`; no native dependencies.
- Server-side opaque sessions rather than JWTs, so logout revokes immediately.
- `node:sqlite`'s synchronous API; scrypt is async to avoid blocking the event loop during login.
- Self-service registration was accepted with "process"; the default `mimin` account remains the bootstrap account.
- Existing todo IDs are preserved during import; normal creates use server-generated UUIDs.
- Usernames are case-insensitive.

## Testing

- Backend: Vitest with the `node` environment and supertest, in-memory databases, cookie agents.
- Frontend: existing Testing Library suite driven by a stateful fake `fetch` that mirrors the API.
- Final check: run both users through the live browser, verify persistence survives reload, and inspect the SQLite file.
