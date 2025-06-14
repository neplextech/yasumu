import { Hono } from 'hono';
import { routes } from './routes/routes.ts';
import { db } from './database/db.ts';
import { errors } from './database/schema/errors.ts';

const app = new Hono();

app.route('/', routes);

app.notFound((c) => c.json({ error: 'Not Found' }, 404));

app.onError(async (err, c) => {
  console.error(err);
  const message = err.message;
  const stack = err.stack ?? 'No stack trace';

  await db.insert(errors).values({
    message,
    stack,
  });

  return c.json({ error: 'Internal Server Error' }, 500);
});

Deno.serve(
  {
    port: 3567,
  },
  app.fetch,
);
