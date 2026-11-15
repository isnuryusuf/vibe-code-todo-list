// @vitest-environment node
import { beforeEach, describe, test, expect } from 'vitest';
import request from 'supertest';
import { createDatabase } from './db.ts';
import { createApp } from './app.ts';

let db: ReturnType<typeof createDatabase>;
let app: ReturnType<typeof createApp>;

beforeEach(async () => {
  db = createDatabase(':memory:');
  app = createApp(db);
  await request(app).post('/api/auth/register').send({ username: 'alice', password: 'password1' }).expect(201);
});

async function loginAs(username = 'alice', password = 'password1') {
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username, password }).expect(200);
  return agent;
}

async function registerAs(username: string, password = 'password1') {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send({ username, password }).expect(201);
  return agent;
}

describe('todos API', () => {
  test('requires authentication for every route', async () => {
    await request(app).get('/api/todos').expect(401);
    await request(app).post('/api/todos').send({ text: 'x' }).expect(401);
    await request(app).patch('/api/todos/some-id').send({ text: 'x' }).expect(401);
    await request(app).delete('/api/todos/some-id').expect(401);
    await request(app).delete('/api/todos/completed').expect(401);
    await request(app).post('/api/todos/import').send({ todos: [] }).expect(401);
  });

  test('creates and lists an owned todo', async () => {
    const agent = await loginAs();

    const created = await agent
      .post('/api/todos')
      .send({ text: 'Buy milk', dueDate: '2026-12-25' })
      .expect(201);

    expect(created.body).toMatchObject({
      text: 'Buy milk',
      completed: false,
      dueDate: '2026-12-25',
    });
    expect(typeof created.body.id).toBe('string');
    expect(typeof created.body.createdAt).toBe('number');

    await agent.get('/api/todos').expect(200).expect(({ body }) => {
      expect(body).toEqual([created.body]);
    });
  });

  test('validates todo text and due dates', async () => {
    const agent = await loginAs();

    await agent.post('/api/todos').send({ text: '   ' }).expect(400);
    await agent.post('/api/todos').send({ text: 'x'.repeat(501) }).expect(400);
    await agent
      .post('/api/todos')
      .send({ text: 'Impossible date', dueDate: '2026-02-30' })
      .expect(400);
    await agent
      .post('/api/todos')
      .send({ text: 'Bad format', dueDate: 'not-a-date' })
      .expect(400);
  });

  test('updates text, completion, and due date', async () => {
    const agent = await loginAs();
    const created = await agent.post('/api/todos').send({ text: 'Buy milk' }).expect(201);

    const updated = await agent
      .patch(`/api/todos/${created.body.id}`)
      .send({ text: 'Buy oat milk', completed: true, dueDate: '2027-01-02' })
      .expect(200);

    expect(updated.body).toMatchObject({
      text: 'Buy oat milk',
      completed: true,
      dueDate: '2027-01-02',
    });

    const cleared = await agent
      .patch(`/api/todos/${created.body.id}`)
      .send({ dueDate: null })
      .expect(200);
    expect(cleared.body.dueDate).toBeUndefined();

    await agent.patch('/api/todos/does-not-exist').send({ text: 'Nope' }).expect(404);
  });

  test('deletes an owned todo', async () => {
    const agent = await loginAs();
    const created = await agent.post('/api/todos').send({ text: 'Delete me' }).expect(201);

    await agent.delete(`/api/todos/${created.body.id}`).expect(204);
    await agent.get('/api/todos').expect(200).expect(({ body }) => {
      expect(body).toEqual([]);
    });
    await agent.delete(`/api/todos/${created.body.id}`).expect(404);
  });

  test('isolates todos between users', async () => {
    const agentA = await loginAs();
    const agentB = await registerAs('other');

    const todo = await agentA.post('/api/todos').send({ text: 'Private' }).expect(201);

    await agentB.get('/api/todos').expect(200).expect(({ body }) => {
      expect(body).toEqual([]);
    });
    await agentB.patch(`/api/todos/${todo.body.id}`).send({ text: 'Hijacked' }).expect(404);
    await agentB.delete(`/api/todos/${todo.body.id}`).expect(404);

    await agentA.get('/api/todos').expect(200).expect(({ body }) => {
      expect(body).toHaveLength(1);
      expect(body[0].text).toBe('Private');
    });
  });

  test('clears only the current user completed todos', async () => {
    const agentA = await loginAs();
    const agentB = await registerAs('other');

    const first = await agentA.post('/api/todos').send({ text: 'Done A' }).expect(201);
    await agentA.patch(`/api/todos/${first.body.id}`).send({ completed: true }).expect(200);
    const second = await agentA.post('/api/todos').send({ text: 'Done B' }).expect(201);
    await agentA.patch(`/api/todos/${second.body.id}`).send({ completed: true }).expect(200);
    await agentA.post('/api/todos').send({ text: 'Still active' }).expect(201);

    const other = await agentB.post('/api/todos').send({ text: 'Other done' }).expect(201);
    await agentB.patch(`/api/todos/${other.body.id}`).send({ completed: true }).expect(200);

    await agentA.delete('/api/todos/completed').expect(200, { deleted: 2 });
    await agentA.get('/api/todos').expect(200).expect(({ body }) => {
      expect(body).toHaveLength(1);
      expect(body[0].text).toBe('Still active');
    });
    await agentB.get('/api/todos').expect(200).expect(({ body }) => {
      expect(body).toHaveLength(1);
    });
  });

  test('imports legacy todos idempotently and preserves their fields', async () => {
    const agent = await loginAs();

    const legacy = {
      todos: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          text: 'Old A',
          completed: true,
          createdAt: 100,
          dueDate: '2026-01-02',
        },
        {
          id: '22222222-2222-4222-8222-222222222222',
          text: 'Old B',
          completed: false,
          createdAt: 200,
        },
      ],
    };

    await agent.post('/api/todos/import').send(legacy).expect(200, { imported: 2 });
    await agent.post('/api/todos/import').send(legacy).expect(200, { imported: 0 });

    await agent.get('/api/todos').expect(200).expect(({ body }) => {
      expect(body).toHaveLength(2);
      expect(body[0]).toMatchObject({ text: 'Old A', completed: true, dueDate: '2026-01-02' });
      expect(body[1]).toMatchObject({ text: 'Old B', completed: false });
      expect(body[1].dueDate).toBeUndefined();
    });
  });

  test('rejects oversized or invalid import batches', async () => {
    const agent = await loginAs();
    const tooMany = Array.from({ length: 501 }, (_, index) => ({
      text: `Task ${index}`,
      completed: false,
      createdAt: index,
    }));

    await agent.post('/api/todos/import').send({ todos: tooMany }).expect(400);
    await agent
      .post('/api/todos/import')
      .send({ todos: [{ text: '   ', completed: false, createdAt: 1 }] })
      .expect(400);
  });
});
