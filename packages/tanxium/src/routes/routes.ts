import { Hono } from 'hono';
import { auth } from './auth/route.ts';
import { rest } from './rest/route.ts';
import { workspace } from './workspace/route.ts';

export const routes = new Hono()
  .route('/auth', auth)
  .route('/rest', rest)
  .route('/workspace', workspace);
