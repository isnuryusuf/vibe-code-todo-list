import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import type { DatabaseSync } from 'node:sqlite';
import type { AuthUser } from './types.ts';
import { requireAuth } from './auth.ts';

interface TodoRow {
  id: string;
  text: string;
  completed: number;
  created_at: number;
  due_date: string | null;
}

interface TodoPayload {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string;
}

interface ImportItem {
  id?: string;
  text: string;
  completed: boolean;
  createdAt: number;
  dueDate?: string;
}

const MAX_TEXT_LENGTH = 500;
const MAX_IMPORT_ITEMS = 500;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function toTodo(row: TodoRow): TodoPayload {
  return {
    id: row.id,
    text: row.text,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    ...(row.due_date ? { dueDate: row.due_date } : {}),
  };
}

function isValidISODate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function readText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (text.length === 0 || text.length > MAX_TEXT_LENGTH) return null;
  return text;
}

function readDueDate(value: unknown): { ok: true; value: string | null } | { ok: false } {
  if (value === null || value === undefined) return { ok: true, value: null };
  if (typeof value !== 'string' || !isValidISODate(value)) return { ok: false };
  return { ok: true, value };
}

function findTodo(db: DatabaseSync, userId: number, id: string): TodoRow | undefined {
  return db
    .prepare(
      'SELECT id, text, completed, created_at, due_date FROM todos WHERE id = ? AND user_id = ?'
    )
    .get(id, userId) as TodoRow | undefined;
}

export function createTodosRouter(db: DatabaseSync): Router {
  const router = Router();
  router.use(requireAuth(db));

  router.get('/', (_req, res) => {
    const user = res.locals.user as AuthUser;
    const rows = db
      .prepare(
        `SELECT id, text, completed, created_at, due_date
         FROM todos
         WHERE user_id = ?
         ORDER BY created_at ASC, rowid ASC`
      )
      .all(user.id) as unknown as TodoRow[];

    res.json(rows.map(toTodo));
  });

  router.post('/', (req, res) => {
    const user = res.locals.user as AuthUser;
    const text = readText(req.body?.text);
    if (!text) {
      res.status(400).json({ error: 'Task text is required and must be 500 characters or fewer' });
      return;
    }

    const dueDate = readDueDate(req.body?.dueDate);
    if (!dueDate.ok) {
      res.status(400).json({ error: 'Invalid due date' });
      return;
    }

    const id = randomUUID();
    db.prepare(
      'INSERT INTO todos (id, user_id, text, completed, created_at, due_date) VALUES (?, ?, ?, 0, ?, ?)'
    ).run(id, user.id, text, Date.now(), dueDate.value);

    const row = findTodo(db, user.id, id);
    res.status(201).json(toTodo(row as TodoRow));
  });

  router.post('/import', (req, res) => {
    const user = res.locals.user as AuthUser;
    const items = req.body?.todos;

    if (!Array.isArray(items) || items.length > MAX_IMPORT_ITEMS) {
      res.status(400).json({ error: `Import must contain at most ${MAX_IMPORT_ITEMS} todos` });
      return;
    }

    const validated: ImportItem[] = [];
    for (const item of items) {
      if (!item || typeof item !== 'object') {
        res.status(400).json({ error: 'Invalid import item' });
        return;
      }

      const text = readText((item as { text?: unknown }).text);
      const dueDate = readDueDate((item as { dueDate?: unknown }).dueDate);
      if (!text || !dueDate.ok) {
        res.status(400).json({ error: 'Invalid import item' });
        return;
      }

      const rawId = (item as { id?: unknown }).id;
      if (rawId !== undefined && (typeof rawId !== 'string' || rawId.length === 0 || rawId.length > 100)) {
        res.status(400).json({ error: 'Invalid import item id' });
        return;
      }

      const rawCreatedAt = (item as { createdAt?: unknown }).createdAt;
      validated.push({
        id: rawId,
        text,
        completed: Boolean((item as { completed?: unknown }).completed),
        createdAt:
          typeof rawCreatedAt === 'number' && Number.isFinite(rawCreatedAt)
            ? rawCreatedAt
            : Date.now(),
        dueDate: dueDate.value ?? undefined,
      });
    }

    const insert = db.prepare(
      'INSERT OR IGNORE INTO todos (id, user_id, text, completed, created_at, due_date) VALUES (?, ?, ?, ?, ?, ?)'
    );

    let imported = 0;
    db.exec('BEGIN');
    try {
      for (const item of validated) {
        const result = insert.run(
          item.id ?? randomUUID(),
          user.id,
          item.text,
          item.completed ? 1 : 0,
          item.createdAt,
          item.dueDate ?? null
        );
        imported += Number(result.changes);
      }
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }

    res.json({ imported });
  });

  router.delete('/completed', (_req, res) => {
    const user = res.locals.user as AuthUser;
    const result = db
      .prepare('DELETE FROM todos WHERE user_id = ? AND completed = 1')
      .run(user.id);
    res.json({ deleted: Number(result.changes) });
  });

  router.patch('/:id', (req, res) => {
    const user = res.locals.user as AuthUser;
    const existing = findTodo(db, user.id, req.params.id);
    if (!existing) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const assignments: string[] = [];
    const values: (string | number | null)[] = [];

    if ('text' in body) {
      const text = readText(body.text);
      if (!text) {
        res.status(400).json({ error: 'Task text is required and must be 500 characters or fewer' });
        return;
      }
      assignments.push('text = ?');
      values.push(text);
    }

    if ('completed' in body) {
      if (typeof body.completed !== 'boolean') {
        res.status(400).json({ error: 'Completed must be a boolean' });
        return;
      }
      assignments.push('completed = ?');
      values.push(body.completed ? 1 : 0);
    }

    if ('dueDate' in body) {
      const dueDate = readDueDate(body.dueDate);
      if (!dueDate.ok) {
        res.status(400).json({ error: 'Invalid due date' });
        return;
      }
      assignments.push('due_date = ?');
      values.push(dueDate.value);
    }

    if (assignments.length > 0) {
      db.prepare(
        `UPDATE todos SET ${assignments.join(', ')} WHERE id = ? AND user_id = ?`
      ).run(...values, req.params.id, user.id);
    }

    res.json(toTodo(findTodo(db, user.id, req.params.id) as TodoRow));
  });

  router.delete('/:id', (req, res) => {
    const user = res.locals.user as AuthUser;
    const result = db
      .prepare('DELETE FROM todos WHERE id = ? AND user_id = ?')
      .run(req.params.id, user.id);

    if (Number(result.changes) === 0) {
      res.status(404).json({ error: 'Todo not found' });
      return;
    }

    res.status(204).end();
  });

  return router;
}
