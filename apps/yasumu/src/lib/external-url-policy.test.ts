import { describe, expect, it } from 'vitest';

import { resolveExternalUrl } from './external-url-policy';

const options = {
  appOrigin: 'https://app.example.test',
  baseUrl: 'https://app.example.test/en/workspaces/demo',
};

describe('resolveExternalUrl', () => {
  it.each([
    ['https://example.com/docs', 'https://example.com/docs'],
    ['http://example.com/docs', 'http://example.com/docs'],
    ['mailto:hello@example.com', 'mailto:hello@example.com'],
    ['tel:+15551234567', 'tel:+15551234567'],
    ['//example.com/docs', 'https://example.com/docs'],
  ])('resolves supported external URL %s', (href, expected) => {
    expect(resolveExternalUrl(href, options)).toBe(expected);
  });

  it.each(['/settings', '#details', 'https://app.example.test/docs'])('keeps internal URL %s in-app', (href) => {
    expect(resolveExternalUrl(href, options)).toBeNull();
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<h1>unsafe</h1>',
    'file:///tmp/example.txt',
    'blob:https://example.com/id',
  ])('rejects unsafe URL %s', (href) => {
    expect(resolveExternalUrl(href, options)).toBeNull();
  });

  it('rejects malformed URLs', () => {
    expect(resolveExternalUrl('https://[invalid', options)).toBeNull();
  });
});
