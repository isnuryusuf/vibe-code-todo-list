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
