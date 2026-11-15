# My Todos

A multi-user todo app with a React front end and an Express + SQLite backend.
Each account has its own private todo list; sessions are stored server-side and
referenced by an HTTP-only cookie.

## Requirements

- Node.js 26 or newer (the server runs TypeScript directly and uses the built-in
  `node:sqlite` driver)

## Getting started

```powershell
npm install
npm run dev
```

- Web app: <http://localhost:5173>
- API: <http://localhost:3001> (Vite proxies `/api` to it)

Create your own account from the login page — there is no pre-defined default
user.

## Data

Accounts, sessions, and todos live in `data/todos.db` (SQLite). The file and its
directory are created on first start and are ignored by git. Delete the file to
reset the app; it starts empty, so register a new account on next start.

Passwords are stored as salted scrypt hashes, and session tokens are stored only
as SHA-256 hashes. Todos left in the old browser `localStorage` list are imported
once into the first account you sign in with in that browser.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Runs the API with watch mode and the Vite dev server together |
| `npm run dev:server` | Runs only the API (`node --watch server/index.ts`) |
| `npm run dev:client` | Runs only the Vite dev server |
| `npm run build` | Type-checks the app and server, then builds `dist/` |
| `npm start` | Runs the API and serves the built app from `dist/` |
| `npm test` | Runs the Vitest suite in watch mode |
| `npm run test:run` | Runs the Vitest suite once |
| `npm run lint` | Runs Oxlint |

## Production

```powershell
npm run build
npm start
```

Express serves the API and the built front end from one server (port 3001 by
default). Set `PORT` to change the port. When serving over HTTPS, set
`COOKIE_SECURE=true` so session cookies are marked `Secure`.

Environment variables:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `DB_PATH` | `data/todos.db` | SQLite database location |
| `COOKIE_SECURE` | unset | Set to `true` behind HTTPS |
