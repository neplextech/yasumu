import { hc } from 'hono/client';
import type { AppType } from '@yasumu/tanxium';

export const createClient = (port: number) => {
  return hc<AppType>(`http://localhost:${port}`);
};
