import type { RestEntityData } from '@yasumu/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { tauriFetch } = vi.hoisted(() => ({ tauriFetch: vi.fn() }));

vi.mock('@tauri-apps/plugin-http', () => ({ fetch: tauriFetch }));

import { RestRequestController } from './rest-request';

const requestOptions = {
  entity: {
    url: 'https://example.com',
    method: 'GET',
    requestHeaders: [],
    searchParameters: [],
    requestBody: null,
  } as unknown as RestEntityData,
  pathParams: {},
  echoServerPort: null,
  interpolate: (value: string) => value,
};

describe('RestRequestController', () => {
  beforeEach(() => tauriFetch.mockReset());

  it('does not let an older request clear the active controller', async () => {
    let resolveFirst!: (response: Response) => void;
    let resolveSecond!: (response: Response) => void;
    tauriFetch
      .mockImplementationOnce(() => new Promise<Response>((resolve) => (resolveFirst = resolve)))
      .mockImplementationOnce(() => new Promise<Response>((resolve) => (resolveSecond = resolve)));

    const controller = new RestRequestController();
    const firstRequest = controller.execute(requestOptions);
    const secondRequest = controller.execute(requestOptions);

    resolveFirst(new Response('{}', { headers: { 'content-type': 'application/json' } }));
    await firstRequest;

    expect(controller.isActive).toBe(true);
    controller.cancel();
    expect(controller.isActive).toBe(false);

    resolveSecond(new Response('{}', { headers: { 'content-type': 'application/json' } }));
    await secondRequest;
  });
});
