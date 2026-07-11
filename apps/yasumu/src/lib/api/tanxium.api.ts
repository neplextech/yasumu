import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import type { AppType } from '@yasumu/tanxium';
import { hc } from 'hono/client';

export const createClient = (port: number) => {
  return hc<AppType>(`http://localhost:${port}`, {
    fetch(input, requestInit, _Env, _executionCtx) {
      return tauriFetch(input, requestInit);
    },
  });
};
