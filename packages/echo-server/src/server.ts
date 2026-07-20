import { setTimeout } from 'node:timers/promises';

import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const echoServer = new Hono();

function getRejectionMessage(reject: string): string {
  if (reject === 'true') return 'Request rejected via ?reject=true';
  return decodeURIComponent(reject);
}

function shouldReject(reject: string): boolean {
  return !!reject && reject !== 'false';
}

// Middleware to handle delay and status simulation
echoServer.use('*', async (c, next) => {
  const query = c.req.query();

  // Handle Delay
  if (query.delay) {
    const delay = parseInt(query.delay, 10);

    if (!isNaN(delay) && delay > 0) {
      await setTimeout(delay);
    }
  }

  let status: ContentfulStatusCode | null = null;
  if (query.status) {
    status = parseInt(query.status, 10) as ContentfulStatusCode;
    if (!isNaN(status) && status >= 100 && status <= 599) {
      c.status(status);
    }
  }

  // Handle Reject/Status
  if (shouldReject(query.reject)) {
    return c.json({ error: getRejectionMessage(query.reject) }, status ?? 500);
  }

  await next();
});

// Specific Utilities
echoServer.get('/ip', (c) => {
  // Try to get IP from headers usually provided by proxies
  const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';
  return c.json({ ip });
});

// Auth Helpers
echoServer.get('/basic-auth', (c) => {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Basic ')) {
    return c.json({ authenticated: false, message: 'No Basic Auth header found' }, 401);
  }
  const [username, password] = atob(auth.split(' ')[1]).split(':');
  return c.json({ authenticated: true, user: username, pass: password });
});

echoServer.get('/bearer-auth', (c) => {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ authenticated: false, message: 'No Bearer Token found' }, 401);
  }
  const token = auth.split(' ')[1];
  return c.json({ authenticated: true, token });
});

/** Deterministic event stream used by the GUI and CLI SSE integration tests. */
echoServer.all('/sse', async (c) => {
  const encoder = new TextEncoder();
  const headers = c.req.header();
  const query = c.req.query();
  const body = await c.req.text();
  const retry = Number(query.retry) || 100;
  const count = Math.max(1, Math.min(Number(query.count) || 3, 100));
  const lastEventId = Number(c.req.header('last-event-id')) || 0;
  let index = 0;
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (index >= count) return controller.close();
      index += 1;
      const sequence = lastEventId + index;
      const payload = JSON.stringify({ method: c.req.method, headers, query, body, sequence });
      controller.enqueue(encoder.encode(`id: ${sequence}\nevent: echo\nretry: ${retry}\ndata: ${payload}\n\n`));
      if (index < count) await setTimeout(Number(query.interval) || 10);
    },
  });
  return new Response(stream, {
    headers: { 'cache-control': 'no-cache', connection: 'keep-alive', 'content-type': 'text/event-stream' },
  });
});

// Main Catch-all Echo Handler
echoServer.all('*', async (c) => {
  const method = c.req.method;
  const headers = c.req.header();
  const query = c.req.query();
  const url = c.req.url;
  const path = c.req.path;

  // Parse Body
  let body: unknown = null;
  let json: unknown = null;
  let form: unknown = null;
  const files: Record<string, unknown> = {};
  let data: string | null = null;

  const contentType = c.req.header('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      json = await c.req.json();
      body = json;
    } else if (
      contentType.includes('multipart/form-data') ||
      contentType.includes('application/x-www-form-urlencoded')
    ) {
      const parsedForm = await c.req.parseBody({ all: true }); // capture files too

      // Separate files from fields
      const formFields: Record<string, unknown> = {};
      const rawForm = parsedForm as Record<string, unknown>;

      for (const [key, value] of Object.entries(rawForm)) {
        if (value instanceof File) {
          files[key] = {
            name: value.name,
            type: value.type,
            size: value.size,
            lastModified: value.lastModified,
          };
        } else {
          formFields[key] = value;
        }
      }
      form = formFields;
      body = { ...formFields, ...files };
    } else {
      // Raw text/other
      data = await c.req.text();
      body = data;
    }
  } catch (_e) {
    // Body parsing failed or empty
  }

  // Cookies
  const cookies = getCookie(c);

  const response = {
    url,
    path,
    method,
    headers,
    args: query,
    cookies,
    body,
    json,
    form,
    files,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      source: 'tanxium-echo-server',
    },
  };

  return c.json(response);
});
