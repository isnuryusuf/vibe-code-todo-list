// @vitest-environment node
import { beforeEach, describe, test, expect } from 'vitest';
import request from 'supertest';
import { createDatabase } from './db.ts';
import { createApp } from './app.ts';

let db: ReturnType<typeof createDatabase>;
let app: ReturnType<typeof createApp>;

const credentials = { username: 'alice', password: 'password1' };

beforeEach(async () => {
  db = createDatabase(':memory:');
  app = createApp(db);
  await request(app).post('/api/auth/register').send(credentials).expect(201);
});

describe('auth API', () => {
  test('logs in a registered user and returns the session user', async () => {
    const agent = request.agent(app);

    const login = await agent.post('/api/auth/login').send(credentials).expect(200);
    expect(login.body.user).toEqual({ id: expect.any(Number), username: 'alice' });
    expect(login.body.user.password_hash).toBeUndefined();

    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.user.username).toBe('alice');
  });

  test('sets an HTTP-only session cookie', async () => {
    const res = await request(app).post('/api/auth/login').send(credentials).expect(200);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    const header = cookies.join(';');

    expect(header).toContain('todo_session=');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Path=/');
  });

  test('rejects bad credentials and unauthenticated /me', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'wrong-password' })
      .expect(401, { error: 'Invalid username or password' });

    await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'whatever1' })
      .expect(401, { error: 'Invalid username or password' });

    await request(app).get('/api/auth/me').expect(401);
  });

  test('registers a new user and rejects a case-insensitive duplicate', async () => {
    const agent = request.agent(app);

    const created = await agent
      .post('/api/auth/register')
      .send({ username: 'bob', password: 'password1' })
      .expect(201);
    expect(created.body.user.username).toBe('bob');

    await agent.get('/api/auth/me').expect(200).expect(({ body }) => {
      expect(body.user.username).toBe('bob');
    });

    await request(app)
      .post('/api/auth/register')
      .send({ username: 'BOB', password: 'password1' })
      .expect(409, { error: 'Username already taken' });
  });

  test('validates registration input', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'ab', password: 'password1' })
      .expect(400);

    await request(app)
      .post('/api/auth/register')
      .send({ username: 'bad user', password: 'password1' })
      .expect(400);

    await request(app)
      .post('/api/auth/register')
      .send({ username: 'validname', password: 'short' })
      .expect(400);
  });

  test('logs out and invalidates the session', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send(credentials).expect(200);

    const logout = await agent.post('/api/auth/logout').expect(204);
    const header = (logout.headers['set-cookie'] as unknown as string[]).join(';');
    expect(header).toContain('Max-Age=0');

    await agent.get('/api/auth/me').expect(401);
  });

  test('rejects expired sessions', async () => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send(credentials).expect(200);

    db.prepare('UPDATE sessions SET expires_at = 0').run();

    await agent.get('/api/auth/me').expect(401);
  });
});
