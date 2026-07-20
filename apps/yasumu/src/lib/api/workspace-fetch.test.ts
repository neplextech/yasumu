import { beforeEach, describe, expect, it, vi } from 'vitest';

import { workspaceFetch } from './workspace-fetch';

const mocks = vi.hoisted(() => ({ tauriFetch: vi.fn() }));

vi.mock('@tauri-apps/plugin-http', () => ({ fetch: mocks.tauriFetch }));

describe('workspaceFetch', () => {
  beforeEach(() => mocks.tauriFetch.mockReset());

  it('sends matching workspace cookies and ingests response cookies', async () => {
    const resolve = vi.fn().mockResolvedValue('session=workspace');
    const ingest = vi.fn().mockResolvedValue({ stored: [], rejected: [] });
    mocks.tauriFetch.mockResolvedValue(
      new Response('{}', {
        headers: { 'content-type': 'application/json', 'set-cookie': 'refreshed=true; Path=/' },
      }),
    );

    await workspaceFetch({ cookies: { resolve, ingest } }, 'https://example.test/profile');

    expect(resolve).toHaveBeenCalledWith('https://example.test/profile');
    const request = mocks.tauriFetch.mock.calls[0]?.[0] as Request;
    expect(request.headers.get('cookie')).toBe('session=workspace');
    expect(ingest).toHaveBeenCalledWith('https://example.test/profile', ['refreshed=true; Path=/']);
  });

  it('preserves a manually supplied Cookie header', async () => {
    const resolve = vi.fn();
    const ingest = vi.fn();
    mocks.tauriFetch.mockResolvedValue(new Response('{}'));

    await workspaceFetch({ cookies: { resolve, ingest } }, 'https://example.test/profile', {
      headers: { cookie: 'manual=true' },
    });

    const request = mocks.tauriFetch.mock.calls[0]?.[0] as Request;
    expect(request.headers.get('cookie')).toBe('manual=true');
    expect(resolve).not.toHaveBeenCalled();
    expect(ingest).not.toHaveBeenCalled();
  });
});
