import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { getSetCookieHeaders, type Workspace } from '@yasumu/core';

type CookieAwareWorkspace = {
  cookies: Pick<Workspace['cookies'], 'resolve' | 'ingest'>;
};

/** Executes a renderer-side HTTP request with the active workspace's canonical cookie jar. */
export async function workspaceFetch(
  workspace: CookieAwareWorkspace,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const request = new Request(input, init);
  const headers = new Headers(request.headers);
  if (!headers.has('cookie')) {
    const cookieHeader = await workspace.cookies.resolve(request.url);
    if (cookieHeader) headers.set('cookie', cookieHeader);
  }

  const response = await tauriFetch(new Request(request, { headers }));
  const setCookieHeaders = getSetCookieHeaders(response.headers);
  if (setCookieHeaders.length) {
    await workspace.cookies.ingest(response.url || request.url, setCookieHeaders);
  }
  return response;
}
