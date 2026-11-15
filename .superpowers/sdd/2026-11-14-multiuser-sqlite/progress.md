# SDD ledger — plan: docs/superpowers/plans/2026-11-14-multiuser-sqlite.md

## Pre-flight
- Task 1 → Tasks 2–4: `createDatabase`, `seedDefaultUser`, `hashPassword`/`verifyPassword` signatures match consumers — OK.
- Task 2 → Tasks 3–4: `createApp`, `requireAuth`, `AuthUser` match router/app consumers — OK.
- Task 3 → Tasks 5, 7: todo response shape (`dueDate?`, boolean `completed`, numeric `createdAt`) matches frontend types — OK.
- Task 5 → Tasks 6–7: `useAuth`, `api`, `importLegacyTodos`, `installFakeApi` interfaces match consumers — OK.
- Task 7 consumes all prior frontend outputs — OK.
- Ruling: execute inline on `master`, not a worktree — user said “process”, all prior app work is on master, and a worktree would need a second install/dev stack — cost if wrong: feature shares history with earlier commits, each task still separately revertible.
- Ruling: use a new ledger folder for this plan instead of appending to the calendar ledger named in Task 8 — the calendar ledger is another plan’s workspace — cost if wrong: verification notes live in a new location.

## Task log
- Task 1: complete (commits 2cc3345..fb1887c, tests: `npx vitest run server/password.test.ts server/seed.test.ts` → 5 passed).
- Task 2: complete (commits fb1887c..1a52f86, tests: `npx vitest run server` → 12 passed).
- Task 3: complete (commits 1a52f86..9ac2970, tests: `npx vitest run server` → 21 passed).
- Task 4: complete (commits 9ac2970..8187b20, verified `node server/index.ts` → health `{ok:true}`, `data/todos.db` created; `npm run build` clean; `npm run test:run` → 90 passed).
