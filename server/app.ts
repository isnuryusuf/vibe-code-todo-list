import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';
import { resolve } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { createAuthRouter } from './auth.ts';
import { createTodosRouter } from './todos.ts';

export interface AppOptions {
  staticDir?: string;
}

export function createApp(db: DatabaseSync, options: AppOptions = {}): Express {
  const app = express();

  // CORS for dev (Vite on 5173 calls API on 3001 directly)
  const corsOrigins = (process.env.CORS_ORIGIN || '').split(',').filter(Boolean);
  if (corsOrigins.length > 0) {
    app.use((_req, res, next) => {
      const origin = _req.headers.origin;
      if (origin && corsOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      if (_req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      next();
    });
  }

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', createAuthRouter(db));
  app.use('/api/todos', createTodosRouter(db));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  if (options.staticDir) {
    const root = resolve(options.staticDir);
    app.use(express.static(root));
    app.use((req, res, next) => {
      if (req.method !== 'GET') {
        next();
        return;
      }
      res.sendFile(resolve(root, 'index.html'));
    });
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
