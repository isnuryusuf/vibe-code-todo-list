# Multi-user SQLite Todos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add login/registration, server-side sessions, and per-user todo storage in SQLite, with a seeded `mimin` account and one-time import of existing browser todos.

**Architecture:** Express 5 on Node 26 using the built-in `node:sqlite` driver and `node:crypto` scrypt hashing. Vite proxies `/api` in development; Express serves `dist` in production. React gets an auth gate plus a rewritten API-backed `useTodos`.

**Tech Stack:** Node 26 type-stripped TypeScript, Express 5, `node:sqlite`, `node:crypto`, React 19, Vite 8, Vitest 5, supertest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-14-multiuser-sqlite-design.md`

## Global Constraints

- Node `>=26.0.0` (native TypeScript execution and `node:sqlite`).
- Server relative imports use explicit `.ts` extensions; app code keeps the existing Vite import style.
- `verbatimModuleSyntax: true` — every type-only import uses `import type`.
- `erasableSyntaxOnly: true` — no enums, namespaces, or constructor parameter properties.
- Every todo query and mutation includes `user_id`; cross-user access returns 404.
- Default account is exactly `mimin` / `Mimin2026`, seeded only when that username does not exist.
- After migration, todo data is never written to `localStorage`; only the import marker and the legacy source remain.
- Existing user-visible features (filters, due dates, calendar, export, desktop layout, black theme) keep working.
- Windows development environment; commands run through PowerShell.
- Commit after every task.

## Review Focus

- **Cross-user access (IDOR):** user B must not list, update, or delete user A's todos even when the ID is known — covered in Task 3.
- **Username/password edge inputs:** case-insensitive duplicates, whitespace, bad characters, short passwords, and malformed stored hashes must fail safely — covered in Tasks 1 and 2.
- **Session lifecycle:** missing, forged, expired, and logged-out cookies must never authenticate — covered in Task 2.
- **Legacy import retry:** repeating an import must not duplicate todos, and a failed import must not delete the browser copy — covered in Tasks 3 and 5.
- **API unavailable:** login and todo loading must show an error instead of crashing or silently discarding data — covered in Tasks 5–7.

---

### Task 1: Backend foundation — dependencies, SQLite schema, password hashing, default user

**Files:**
- Create: `server/password.ts`, `server/password.test.ts`
- Create: `server/db.ts`
- Create: `server/seed.ts`, `server/seed.test.ts`
- Modify: `package.json`, `package-lock.json`, `tsconfig.node.json`, `.gitignore`

**Interfaces:**
- Consumes: none.
- Produces:
  - `hashPassword(password: string): Promise<string>`
  - `verifyPassword(password: string, storedHash: string): Promise<boolean>`
  - `createDatabase(filename?: string): DatabaseSync` (default `process.env.DB_PATH ?? 'data/todos.db'`; `:memory:` supported)
  - `seedDefaultUser(db: DatabaseSync): Promise<boolean>` (true when created)
  - Schema: `users`, `sessions`, `todos` as defined in the spec.

- [ ] **Step 1: Install backend dependencies**

```powershell
npm install express
npm install -D @types/express supertest @types/supertest concurrently
```

- [ ] **Step 2: Include server code in type-checking**

Modify `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023"],
    "types": ["node"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "module": "nodenext",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["vite.config.ts", "server"]
}
```

Add to `.gitignore`:

```gitignore
# local database
data/
```

- [ ] **Step 3: Write the failing password tests**

Create `server/password.test.ts`:

```ts
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
```

- [ ] **Step 4: Run the password tests to verify they fail**

Run: `npx vitest run server/password.test.ts`
Expected: FAIL — cannot resolve `./password.ts`.

- [ ] **Step 5: Implement `server/password.ts`**

Use `scrypt` from `node:crypto` promisified with `node:util`, a random 16-byte salt, 64-byte key, and `timingSafeEqual` for verification. Stored format: `scrypt$<salt-base64>$<hash-base64>`. Return `false` for any malformed format or length mismatch.

- [ ] **Step 6: Create `server/db.ts` with the full schema**

`createDatabase` must:

- Create the parent directory for file paths (skip for `:memory:`).
- Execute `PRAGMA foreign_keys = ON`, `PRAGMA journal_mode = WAL`, `PRAGMA busy_timeout = 5000`.
- Create the three tables and two indexes with `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`, matching the spec exactly. Use `COLLATE NOCASE` on `users.username`.
- Return the `DatabaseSync` instance.

- [ ] **Step 7: Write the failing seed tests**

Create `server/seed.test.ts`:

```ts
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
```

- [ ] **Step 8: Run the seed tests to verify they fail**

Run: `npx vitest run server/seed.test.ts`
Expected: FAIL — cannot resolve `./seed.ts`.

- [ ] **Step 9: Implement `server/seed.ts`**

Export `DEFAULT_USERNAME = 'mimin'` and `DEFAULT_PASSWORD = 'Mimin2026'`. Look up the username; if present return `false`. Otherwise hash the default password and insert, returning `true`.

- [ ] **Step 10: Run the backend foundation tests**

Run: `npx vitest run server/password.test.ts server/seed.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 11: Commit**

```powershell
git add package.json package-lock.json tsconfig.node.json .gitignore server/password.ts server/password.test.ts server/db.ts server/seed.ts server/seed.test.ts
git commit -m "feat: add SQLite foundation, password hashing, and default user"
```

---

### Task 2: Sessions and authentication API

**Files:**
- Create: `server/types.ts`
- Create: `server/sessions.ts`
- Create: `server/auth.ts`
- Create: `server/app.ts`
- Create: `server/auth.test.ts`

**Interfaces:**
- Consumes: `createDatabase`, `seedDefaultUser`.
- Produces:
  - `interface AuthUser { id: number; username: string }`
  - `createSession(db, userId: number, now?: number): string`
  - `getSessionUser(db, rawToken: string, now?: number): AuthUser | null`
  - `deleteSession(db, rawToken: string): void`
  - `sessionCookie(token: string): string`, `clearSessionCookie(): string`
  - `readCookie(req: Request, name: string): string | null`
  - `requireAuth(db): RequestHandler` — sets `res.locals.user`
  - `createAuthRouter(db): Router`
  - `createApp(db, options?: { staticDir?: string }): Express`

- [ ] **Step 1: Write the failing auth API tests**

Create `server/auth.test.ts` with `// @vitest-environment node`, supertest, in-memory DB, and a fresh app per test:

```ts
// @vitest-environment node
import { beforeEach, describe, test, expect } from 'vitest';
import request from 'supertest';
import { createDatabase } from './db.ts';
import { seedDefaultUser } from './seed.ts';
import { createApp } from './app.ts';

let db: ReturnType<typeof createDatabase>;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  db = createDatabase(':memory:');
  await seedDefaultUser(db);
  app = createApp(db);
});
```

Cover these behaviors:

1. `mimin` / `Mimin2026` logs in, `GET /api/auth/me` returns `{ user: { id, username: 'mimin' } }`, and the response never contains `password_hash`.
2. The `Set-Cookie` header includes `todo_session=`, `HttpOnly`, `SameSite=Lax`, and `Path=/`.
3. Wrong password and unknown username both return 401 with `{ error: 'Invalid username or password' }`; `/me` without a session returns 401.
4. Registration returns 201, logs the new user in, and rejects a duplicate in different case (`MIMIN`) with 409.
5. Invalid registrations return 400: 2-character username, username with spaces, password shorter than 8 characters.
6. Logout returns 204, clears the cookie, and `/me` afterwards returns 401.
7. An expired session returns 401: log in, run `UPDATE sessions SET expires_at = 0`, then call `/me`.

- [ ] **Step 2: Run the auth tests to verify they fail**

Run: `npx vitest run server/auth.test.ts`
Expected: FAIL — cannot resolve `./app.ts`.

- [ ] **Step 3: Implement `server/types.ts` and `server/sessions.ts`**

`types.ts` exports `AuthUser`. `sessions.ts`:

- 32 random bytes as the raw token (hex), cookie name `todo_session`, TTL 7 days.
- Store only `sha256(rawToken)` under `token_hash`.
- `getSessionUser` joins `sessions` and `users`, checks `expires_at > now`, deletes expired rows, and returns `{ id, username }`.
- Cookie serialization uses `HttpOnly; Path=/; SameSite=Lax; Max-Age=604800` and adds `Secure` only when `process.env.COOKIE_SECURE === 'true'`.
- `readCookie` parses the `Cookie` header manually (no extra dependency).

- [ ] **Step 4: Implement `server/auth.ts`**

Validation rules from the spec. Use prepared statements. Return:

- Register: 201 `{ user }`.
- Login: 200 `{ user }`.
- Logout: 204 with cleared cookie (idempotent even without a session).
- Me: 200 `{ user }` or 401 `{ error: 'Unauthorized' }`.
- Validation failures: 400 `{ error }`; duplicate: 409 `{ error: 'Username already taken' }`; bad credentials: 401 `{ error: 'Invalid username or password' }`.

`requireAuth(db)` reads the cookie, resolves the session, stores the user in `res.locals.user`, and returns 401 otherwise.

- [ ] **Step 5: Implement `server/app.ts`**

Create the Express app with:

- `express.json({ limit: '64kb' })`.
- Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- `GET /api/health` → `{ ok: true }`.
- Mount `/api/auth`.
- JSON 404 for unknown `/api` paths.
- Error middleware logging the error and returning 500 `{ error: 'Internal server error' }` without a stack.
- Optional `staticDir`: `express.static` plus SPA fallback for non-API GETs using `path.resolve`.

- [ ] **Step 6: Run the auth tests to verify they pass**

Run: `npx vitest run server/auth.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 7: Commit**

```powershell
git add server/types.ts server/sessions.ts server/auth.ts server/app.ts server/auth.test.ts
git commit -m "feat: add session-based authentication API"
```

---

### Task 3: User-scoped todos API

**Files:**
- Create: `server/todos.ts`
- Create: `server/todos.test.ts`
- Modify: `server/app.ts`

**Interfaces:**
- Consumes: `requireAuth`, `AuthUser`, `createApp`.
- Produces: `createTodosRouter(db): Router`, mounted at `/api/todos`.
- Response shape: `{ id: string, text: string, completed: boolean, createdAt: number, dueDate?: string }`.

- [ ] **Step 1: Write the failing todos API tests**

Create `server/todos.test.ts` with `// @vitest-environment node`. Helper logs in an agent as `mimin`; a second agent registers `other`.

Cover:

1. All `/api/todos` routes return 401 without a session.
2. `POST /api/todos` with `{ text: 'Buy milk', dueDate: '2026-12-25' }` returns 201 and `GET` returns one todo with a boolean `completed`, numeric `createdAt`, and the due date.
3. Empty/whitespace text and invalid due dates (`2026-02-30`, `not-a-date`) return 400; text over 500 characters returns 400.
4. `PATCH` updates text, completion, and due date; sending `{ "dueDate": null }` clears it; unknown IDs return 404.
5. `DELETE` removes only the owned todo and returns 204; a second delete returns 404.
6. Isolation: agent B's list is empty; B cannot PATCH or DELETE agent A's todo and receives 404.
7. `DELETE /api/todos/completed` removes only the current user's completed todos and returns `{ deleted: n }`.
8. Import is idempotent: posting two legacy todos with fixed IDs twice yields `{ imported: 2 }` then `{ imported: 0 }`, preserves `completed`/`dueDate`, and keeps the list at two. A batch over 500 items returns 400.

Example isolation test:

```ts
const todo = await agentA.post('/api/todos').send({ text: 'Private' }).expect(201);

await agentB.get('/api/todos').expect(200).expect(({ body }) => {
  expect(body).toEqual([]);
});

await agentB.patch(`/api/todos/${todo.body.id}`).send({ text: 'Hijacked' }).expect(404);
await agentB.delete(`/api/todos/${todo.body.id}`).expect(404);
```

- [ ] **Step 2: Run the todos tests to verify they fail**

Run: `npx vitest run server/todos.test.ts`
Expected: FAIL — cannot resolve `./todos.ts`.

- [ ] **Step 3: Implement `server/todos.ts`**

- `router.use(requireAuth(db))` for every route.
- Declare `/import` and `/completed` before `/:id`.
- `GET /`: `ORDER BY created_at ASC, rowid ASC` scoped to `user_id`.
- `POST /`: server-generated `crypto.randomUUID()`, trimmed text, `createdAt = Date.now()`.
- `PATCH /:id`: validate provided fields, then `UPDATE ... WHERE id = ? AND user_id = ?`; return the refreshed row or 404.
- `DELETE /completed`: delete completed rows for the user.
- `DELETE /:id`: delete scoped row, 204 or 404.
- `POST /import`: validate the array (max 500), preserve supplied UUID ids, use `INSERT OR IGNORE` inside a transaction, generate ids when missing, return `{ imported }`.
- Date validation accepts only real `YYYY-MM-DD` dates.

- [ ] **Step 4: Mount the router in `server/app.ts`**

```ts
app.use('/api/todos', createTodosRouter(db));
```

- [ ] **Step 5: Run the todos tests to verify they pass**

Run: `npx vitest run server/todos.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Run all backend tests**

Run: `npx vitest run server`
Expected: PASS (20 tests) with no cross-test database bleed.

- [ ] **Step 7: Commit**

```powershell
git add server/todos.ts server/todos.test.ts server/app.ts
git commit -m "feat: add user-scoped todos API"
```

---

### Task 4: Server entry point, dev proxy, production serving, and scripts

**Files:**
- Create: `server/index.ts`
- Modify: `vite.config.ts`, `package.json`, `README.md`

**Interfaces:**
- Consumes: `createDatabase`, `seedDefaultUser`, `createApp`.
- Produces: API on `PORT` (default 3001); `/api` proxy from Vite; `npm run dev`, `npm start`.

- [ ] **Step 1: Create `server/index.ts`**

```ts
import { existsSync } from 'node:fs';
import { createDatabase } from './db.ts';
import { seedDefaultUser } from './seed.ts';
import { createApp } from './app.ts';

const port = Number(process.env.PORT ?? 3001);
const db = createDatabase(process.env.DB_PATH);
await seedDefaultUser(db);

const app = createApp(db, {
  staticDir: existsSync('dist') ? 'dist' : undefined,
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
```

- [ ] **Step 2: Configure the Vite proxy**

Add to `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:3001',
  },
},
```

- [ ] **Step 3: Add scripts and engines**

`package.json`:

```json
"engines": { "node": ">=26.0.0" },
"scripts": {
  "dev": "concurrently -k -n api,web -c cyan,magenta \"npm:dev:server\" \"npm:dev:client\"",
  "dev:client": "vite",
  "dev:server": "node --watch server/index.ts",
  "start": "node server/index.ts",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run",
  "lint": "oxlint"
}
```

- [ ] **Step 4: Verify the server starts and health responds**

Run in one terminal: `node server/index.ts`
Run in another: `Invoke-RestMethod http://localhost:3001/api/health`
Expected: `{ ok: True }`; `data/todos.db` exists; startup does not fail.

Stop the server after the check.

- [ ] **Step 5: Update `README.md`**

Document Node 26+, `npm install`, `npm run dev` (web 5173, API 3001), the default account, `data/todos.db`, `npm run build && npm start`, and that `COOKIE_SECURE=true` is required behind HTTPS.

- [ ] **Step 6: Run type-check/build**

Run: `npm run build`
Expected: PASS; server code is type-checked by `tsc -b`.

- [ ] **Step 7: Commit**

```powershell
git add server/index.ts vite.config.ts package.json package-lock.json README.md
git commit -m "chore: wire API server, dev proxy, and production serving"
```

---

### Task 5: Frontend API client, `useAuth`, legacy import, and fake API test helper

**Files:**
- Create: `src/types/user.ts`
- Create: `src/api/client.ts`, `src/api/client.test.ts`
- Create: `src/test/fakeApi.ts`
- Create: `src/utils/legacyImport.ts`, `src/utils/legacyImport.test.ts`
- Create: `src/hooks/useAuth.ts`, `src/hooks/useAuth.test.ts`

**Interfaces:**
- Consumes: backend API from Tasks 2–3.
- Produces:
  - `interface User { id: number; username: string }`
  - `ApiError` with `status: number`
  - `api.me/login/register/logout/listTodos/createTodo/updateTodo/deleteTodo/clearCompleted/importTodos`
  - `useAuth()` → `{ user, loading, login, register, logout }`
  - `importLegacyTodos(userId: number): Promise<number>`
  - `installFakeApi(options?): { state, fetchMock }`

- [ ] **Step 1: Write the failing API client tests**

`src/api/client.test.ts`, mocking `fetch` per test:

1. `api.login` sends POST `/api/auth/login` with JSON and returns the user.
2. `api.createTodo` returns the parsed todo.
3. A 400 response with `{ error: 'Task text is required' }` throws `ApiError` with that message and status 400.
4. A 204 response resolves without parsing JSON.
5. `api.updateTodo(id, { dueDate: null })` sends `dueDate: null`.

- [ ] **Step 2: Run the client tests to verify they fail**

Run: `npx vitest run src/api/client.test.ts`
Expected: FAIL — cannot resolve `./client`.

- [ ] **Step 3: Implement `src/types/user.ts` and `src/api/client.ts`**

`request<T>` sets `Content-Type: application/json` and parses `{ error }` on failure. All calls use same-origin paths (`/api/...`) so cookies flow automatically.

Exact methods:

```ts
me(): Promise<{ user: User }>
login(username: string, password: string): Promise<{ user: User }>
register(username: string, password: string): Promise<{ user: User }>
logout(): Promise<void>
listTodos(): Promise<Todo[]>
createTodo(input: { text: string; dueDate?: string }): Promise<Todo>
updateTodo(id: string, input: { text?: string; completed?: boolean; dueDate?: string | null }): Promise<Todo>
deleteTodo(id: string): Promise<void>
clearCompleted(): Promise<{ deleted: number }>
importTodos(todos: LegacyTodoInput[]): Promise<{ imported: number }>
```

- [ ] **Step 4: Implement `src/test/fakeApi.ts`**

A stateful `fetch` replacement that mirrors the API, including:

- `state.authenticated`, `state.user`, `state.todos`, `state.importCalls`.
- Auth routes, session behavior, CRUD, clear completed, import.
- Applies legacy IDs and ignores duplicates during import.
- `loginPassword` option to simulate a rejected login.
- Returns response-like objects (`ok`, `status`, `json`) rather than relying on global `Response`.

`installFakeApi` calls `vi.stubGlobal('fetch', fetchMock)` and returns both.

- [ ] **Step 5: Write the failing legacy import tests**

`src/utils/legacyImport.test.ts`:

1. Seeds `localStorage['todos-app']` with one todo; import posts it, removes the key, sets `todos-imported:1`, and returns the imported count.
2. A second call does not call the import endpoint again.
3. If the import request fails, the legacy key remains and the marker is not set.
4. Malformed JSON is discarded safely; no import request is made.

- [ ] **Step 6: Implement `src/utils/legacyImport.ts`**

Use `api.importTodos`, filter invalid entries, preserve `id/text/completed/createdAt/dueDate`, and wrap `localStorage` access in `try/catch`.

- [ ] **Step 7: Write the failing `useAuth` tests**

Using `installFakeApi` and `renderHook`:

1. A 401 `/me` resolves with `loading: false` and `user: null`.
2. An authenticated `/me` restores the user and runs legacy import before finishing loading.
3. `login` sets the user and triggers migration.
4. A failed login rejects and leaves `user` null.
5. `logout` calls the API and clears the user.

- [ ] **Step 8: Implement `src/hooks/useAuth.ts`**

Bootstrap with `api.me()`; on success, await `importLegacyTodos(user.id)` inside `try/catch`, then set the user. Reuse one `completeSignIn(user)` helper for login/register/restore. On logout, call `api.logout()` and always set the user to null.

- [ ] **Step 9: Run the Task 5 tests**

Run: `npx vitest run src/api/client.test.ts src/utils/legacyImport.test.ts src/hooks/useAuth.test.ts`
Expected: PASS (14 tests).

- [ ] **Step 10: Commit**

```powershell
git add src/types/user.ts src/api/client.ts src/api/client.test.ts src/test/fakeApi.ts src/utils/legacyImport.ts src/utils/legacyImport.test.ts src/hooks/useAuth.ts src/hooks/useAuth.test.ts
git commit -m "feat: add frontend auth client, session hook, and legacy import"
```

---

### Task 6: Login and registration page

**Files:**
- Create: `src/components/LoginPage.tsx`, `src/components/LoginPage.test.tsx`

**Interfaces:**
- Consumes: none (callbacks injected).
- Produces:

```ts
interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onRegister: (username: string, password: string) => Promise<void>;
}
```

- [ ] **Step 1: Write the failing LoginPage tests**

Cover:

1. Renders username/password fields and a "Sign in" submit button.
2. Switching to "Create account" reveals a confirm-password field.
3. Mismatched passwords show `Passwords do not match` and do not call `onRegister`.
4. A short registration password is rejected client-side.
5. Successful login sends the trimmed username and exact password once.
6. Successful registration sends credentials once.
7. A rejected promise displays its message in `role="alert"` and re-enables the submit button.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/components/LoginPage.test.tsx`
Expected: FAIL — cannot resolve `./LoginPage`.

- [ ] **Step 3: Implement `src/components/LoginPage.tsx`**

- Full-screen pure-black layout consistent with the app: aurora glows, gradient app icon, gradient "My Todos" heading.
- Centered `rounded-3xl` zinc-950 card with `Sign in` / `Create account` tabs (`aria-pressed`).
- Labelled inputs, `autoFocus` on username, password `minLength={8}` for registration, confirm field only when registering.
- Submit shows `Signing in…` / `Creating account…` and disables while pending.
- Errors render in a red `role="alert"` box.
- Buttons use clear focus-visible rings.
- Footer line: `Local accounts · Stored securely in SQLite`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/components/LoginPage.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```powershell
git add src/components/LoginPage.tsx src/components/LoginPage.test.tsx
git commit -m "feat: add login and registration page"
```

---

### Task 7: Authenticated, server-backed todo app

**Files:**
- Modify: `src/hooks/useTodos.ts`, `src/hooks/useTodos.test.ts`
- Create: `src/TodoApp.tsx`
- Modify: `src/App.tsx`, `src/App.test.tsx`

**Interfaces:**
- Consumes: `useAuth`, `LoginPage`, `api`, `installFakeApi`, all existing components.
- Produces:
  - `useTodos()` → `{ todos, loading, error, refresh, addTodo, toggleTodo, deleteTodo, editTodo, setDueDate, clearCompleted, totalCount, activeCount, completedCount }`
  - `addTodo(text): Promise<string | null>`; other mutations return `Promise<void>`.
  - `TodoApp({ username, onLogout })`.
  - `App` = auth gate (loading screen → LoginPage → TodoApp).

- [ ] **Step 1: Rewrite `useTodos.test.ts` for the API (failing)**

Replace localStorage tests with `installFakeApi` + `renderHook`:

1. Loads initial todos from `GET /api/todos` and clears `loading`.
2. `addTodo` posts and appends; returns the new id.
3. `toggleTodo` patches `completed` based on current state.
4. `deleteTodo`, `editTodo`, `setDueDate` (set and clear), and `clearCompleted` update the list.
5. Counts stay correct.
6. A failed `GET` sets `error`; `refresh` recovers after the fake API is fixed.
7. No legacy localStorage key is written by any action.

All actions are awaited inside `act(async () => ...)`.

- [ ] **Step 2: Run the hook tests to verify they fail**

Run: `npx vitest run src/hooks/useTodos.test.ts`
Expected: FAIL — the hook still reads localStorage and does not expose `loading/error/refresh`.

- [ ] **Step 3: Rewrite `src/hooks/useTodos.ts`**

- Fetch on mount; expose `loading` and `error`.
- Keep an up-to-date `todosRef` so toggle patches the opposite of the current value.
- Replace state with server responses for mutations; remove the localStorage read/write entirely.
- On mutation failure, set a readable error and leave existing data intact.

- [ ] **Step 4: Create `src/TodoApp.tsx` from the current `App.tsx`**

- Keep the complete existing UI and behavior: header, two-column desktop layout, filters, calendar, stats, export.
- Add props `{ username: string; onLogout: () => Promise<void> | void }`.
- Header right side: export button, date pill (`min-[1100px]:flex` so the extra controls fit), user chip showing `username` (initial-only below `sm`), and a "Log out" button with `aria-label="Log out"`.
- Add loading state (`role="status"`, "Loading your tasks…") and an error banner with a Retry button calling `refresh`.
- Make `handleAdd` async and only animate when `addTodo` returns an id.
- No behavior or styling regressions in existing features.

- [ ] **Step 5: Replace `src/App.tsx` with the auth gate**

```tsx
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/LoginPage';
import { TodoApp } from './TodoApp';

function App() {
  const { user, loading, login, register, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-300 flex items-center justify-center" role="status">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} onRegister={register} />;
  }

  return <TodoApp username={user.username} onLogout={logout} />;
}

export default App;
```

- [ ] **Step 6: Update `src/App.test.tsx`**

Install the fake API in every test and await async mounting:

- Authenticated full flow: existing add/toggle/edit/filter/delete sequence with `await`/`findBy`.
- Desktop two-column test with authenticated API.
- Calendar toggle and calendar-date filter tests.
- Header export control test.
- Unauthenticated render shows the login form.
- Login with `mimin` / `Mimin2026` (fake `loginPassword`) reaches the todo app and shows the username.
- Logout returns to the login form.
- Legacy import: seed `todos-app`, boot authenticated, assert one import call, key removed, marker set, imported task visible.
- API load failure shows the error banner and Retry recovers.

- [ ] **Step 7: Run the frontend suite**

Run: `npx vitest run src/hooks/useTodos.test.ts src/App.test.tsx src/components/LoginPage.test.tsx`
Expected: PASS.

- [ ] **Step 8: Run the complete suite and build**

Run: `npm run test:run`
Expected: PASS (all server + frontend tests).

Run: `npm run build`
Expected: PASS (app and server type-check, Vite build succeeds).

- [ ] **Step 9: Commit**

```powershell
git add src/hooks/useTodos.ts src/hooks/useTodos.test.ts src/TodoApp.tsx src/App.tsx src/App.test.tsx
git commit -m "feat: gate the app behind login and store todos per user"
```

---

### Task 8: End-to-end verification and handoff

**Files:**
- Modify: `.superpowers/sdd/2026-11-14-calendar-feature/progress.md` (ledger)
- Modify: `README.md` only if verification uncovers wrong instructions.

- [ ] **Step 1: Run the full automated suite**

```powershell
npm run test:run
npm run build
```

Expected: every test passes; build is clean.

- [ ] **Step 2: Start the real dev stack**

Stop any existing Vite/server processes, then run `npm run dev` in the background. Confirm:
- Web responds at `http://localhost:5173`.
- API health responds at `http://localhost:3001/api/health`.

- [ ] **Step 3: Verify first-run login and seeded account in the browser**

- Log in as `mimin` / `Mimin2026`.
- Confirm the header shows the username and a Log out control.
- Add a todo with a due date, reload, and confirm it persists.
- Confirm `localStorage['todos-app']` is gone and an import marker exists if legacy data was present.

- [ ] **Step 4: Verify multi-user isolation**

- Log out; create a second account (e.g. `tester` / `Testing2026`).
- Confirm the list starts empty, add a distinct todo, then log out and back in as `mimin`.
- Confirm each account sees only its own todo. Attempting to open the other user's data through the UI must not expose it.

- [ ] **Step 5: Inspect SQLite directly**

Using a read-only one-liner with `node:sqlite`, confirm:
- `users` includes `mimin` plus the test account; no column contains a plaintext password.
- `todos` rows carry the correct `user_id`.
- `sessions` contains hashed tokens only.

- [ ] **Step 6: Check existing features**

Calendar, filters, due-date picker, Google/Outlook quick-add links, `.ics` export, OLED theme, and desktop layout all still work while signed in.

- [ ] **Step 7: Update the ledger**

Append the feature summary, test counts, live verification results, DB location, and commit hashes.

- [ ] **Step 8: Commit docs/ledger**

```powershell
git add .superpowers/sdd/2026-11-14-calendar-feature/progress.md README.md
git commit -m "docs: record multi-user SQLite rollout and verification"
```

## Self-Review

- **Spec coverage:** Auth (Tasks 2, 5, 6, 7), SQLite storage and default user (Tasks 1–3), per-user isolation (Task 3 and browser check), legacy import (Tasks 3, 5, 7), dev/prod workflow (Task 4), existing features (Task 8). No gaps.
- **Step scan:** Every task begins with failing tests, then implementation, then a green run and commit. No placeholder steps.
- **Type consistency:** `AuthUser`/`User` shapes match; `dueDate` is optional in responses and nullable on PATCH; `addTodo` consistently returns `Promise<string | null>`.
- **Review Focus:** Each risk has an explicit owning test: IDOR (Task 3), credentials (Tasks 1–2), session lifecycle (Task 2), import retry (Tasks 3, 5), API outage (Tasks 5–7).
- **Proportion:** Plan is scoped to interfaces and tests; implementation bodies are left to the executor except where the security behavior must be exact.
