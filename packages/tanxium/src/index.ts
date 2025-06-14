import { Hono } from 'hono';
import { routes } from './routes/routes.ts';
import { Database } from './database/db.ts';

const app = new Hono();
const db = new Database();

app.route('/', routes);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

app.onError((err, c) => {
  console.error(err);
  db.errors.insert(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

const server = Deno.serve(
  {
    port: 3567,
  },
  app.fetch,
);

server.finished.then(() => db.close());
