import { hc } from 'hono/client';
import type { AppType } from '@yasumu/tanxium';
import { fetch } from '@tauri-apps/plugin-http';

export const createClient = (port: number) => {
  return hc<AppType>(`http://localhost:${port}`, {
    fetch(input, requestInit, _Env, _executionCtx) {
      return fetch(input, requestInit);
    },
  });
};
