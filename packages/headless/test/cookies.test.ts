import { describe, expect, it } from 'vitest';

import { InMemoryCookieRepository, WorkspaceCookieJar } from '../src/index.js';

function jar(now = 1_000) {
  let id = 0;
  const repository = new InMemoryCookieRepository();
  return {
    repository,
    jar: new WorkspaceCookieJar(repository, { now: () => now, generateId: () => `cookie-${++id}` }),
  };
}

describe('WorkspaceCookieJar', () => {
  it('stores response cookies and selects them by workspace, domain, path, and security', async () => {
    const { jar: cookies } = jar();
    await cookies.storeFromResponse('one', 'https://api.example.test/v1/session', [
      'root=one; Path=/; HttpOnly; SameSite=Lax',
      'scoped=two; Path=/v1; Secure',
      'parent=three; Domain=example.test; Path=/',
    ]);
    await cookies.storeFromResponse('two', 'https://api.example.test/', ['other=workspace; Path=/']);

    expect(await cookies.getCookieHeader('one', 'https://api.example.test/v1/users')).toBe(
      'scoped=two; root=one; parent=three',
    );
    expect(await cookies.getCookieHeader('one', 'http://api.example.test/v1/users')).toBe('root=one; parent=three');
    expect(await cookies.getCookieHeader('one', 'https://child.example.test/')).toBe('parent=three');
    expect(await cookies.getCookieHeader('two', 'https://api.example.test/')).toBe('other=workspace');
  });

  it('replaces cookie identities and honors Max-Age deletion and expiry', async () => {
    const { jar: cookies } = jar();
    await cookies.storeFromResponse('one', 'https://example.test/a', ['token=old; Path=/; Max-Age=10']);
    await cookies.storeFromResponse('one', 'https://example.test/a', ['token=new; Path=/; Max-Age=10']);
    expect(await cookies.list('one')).toMatchObject([{ id: 'cookie-1', value: 'new', expiresAt: 11_000 }]);

    await cookies.storeFromResponse('one', 'https://example.test/a', ['token=gone; Path=/; Max-Age=0']);
    expect(await cookies.list('one')).toEqual([]);
  });

  it('validates manual cookies and rejects invalid response cookies without losing valid values', async () => {
    const { jar: cookies } = jar();
    await expect(
      cookies.upsert('one', {
        name: 'session',
        value: 'value',
        domain: 'example.test',
        sameSite: 'none',
      }),
    ).rejects.toThrow('SameSite=None cookies must be Secure');

    const result = await cookies.storeFromResponse('one', 'https://api.example.test/', [
      'valid=yes; Path=/',
      'foreign=no; Domain=elsewhere.test',
    ]);
    expect(result.stored).toHaveLength(1);
    expect(result.rejected).toMatchObject([{ reason: 'Cookie domain does not match the response URL' }]);
  });

  it('updates cookies by stable ID and prevents identity collisions', async () => {
    const { jar: cookies } = jar();
    const first = await cookies.upsert('one', { name: 'a', value: '1', domain: 'example.test' });
    await cookies.upsert('one', { name: 'b', value: '2', domain: 'example.test' });
    const updated = await cookies.upsert('one', { ...first, name: 'renamed', value: 'next' });

    expect(updated).toMatchObject({ id: first.id, name: 'renamed', value: 'next' });
    await expect(cookies.upsert('one', { ...updated, name: 'b' })).rejects.toThrow(
      'A cookie with this name, domain, and path already exists',
    );
  });
});
