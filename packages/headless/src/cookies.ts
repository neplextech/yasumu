import { YasumuError, YasumuErrorCodes } from './errors.js';

export type CookieSameSite = 'strict' | 'lax' | 'none' | null;

export interface WorkspaceCookie {
  id: string;
  workspaceId: string;
  name: string;
  value: string;
  domain: string;
  path: string;
  expiresAt: number | null;
  secure: boolean;
  httpOnly: boolean;
  sameSite: CookieSameSite;
  hostOnly: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceCookieInput {
  id?: string;
  name: string;
  value: string;
  domain: string;
  path?: string;
  expiresAt?: number | null;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: CookieSameSite;
  hostOnly?: boolean;
}

export interface CookieIngestionResult {
  stored: WorkspaceCookie[];
  rejected: Array<{ value: string; reason: string }>;
}

export interface CookieRepository {
  list(workspaceId: string): Promise<WorkspaceCookie[]>;
  upsert(cookie: WorkspaceCookie): Promise<WorkspaceCookie>;
  delete(workspaceId: string, cookieId: string): Promise<void>;
  clear(workspaceId: string): Promise<void>;
  deleteExpired(workspaceId: string, now: number): Promise<void>;
}

export interface RequestCookieJar {
  getCookieHeader(workspaceId: string, requestUrl: string): Promise<string | null>;
  storeFromResponse(
    workspaceId: string,
    responseUrl: string,
    setCookieHeaders: readonly string[],
  ): Promise<CookieIngestionResult>;
}

export interface WorkspaceCookieJarOptions {
  now?: () => number;
  generateId?: () => string;
}

const COOKIE_NAME = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
const COOKIE_DOMAIN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const CONTROL_CHARACTER = /[\u0000-\u001F\u007F]/;

export class WorkspaceCookieJar implements RequestCookieJar {
  private readonly now: () => number;
  private readonly generateId: () => string;

  public constructor(
    private readonly repository: CookieRepository,
    options: WorkspaceCookieJarOptions = {},
  ) {
    this.now = options.now ?? (() => Date.now());
    this.generateId = options.generateId ?? (() => crypto.randomUUID());
  }

  public async list(workspaceId: string): Promise<WorkspaceCookie[]> {
    const now = this.now();
    await this.repository.deleteExpired(workspaceId, now);
    return (await this.repository.list(workspaceId)).sort(compareCookies);
  }

  public async upsert(workspaceId: string, input: WorkspaceCookieInput): Promise<WorkspaceCookie> {
    const normalized = validateCookieInput(input);
    const now = this.now();
    const cookies = await this.repository.list(workspaceId);
    const existingById = input.id ? cookies.find((cookie) => cookie.id === input.id) : undefined;
    if (input.id && !existingById) cookieError(`Cookie not found: ${input.id}`);
    const existingByIdentity = cookies.find(
      (cookie) =>
        cookie.name === normalized.name && cookie.domain === normalized.domain && cookie.path === normalized.path,
    );
    if (existingByIdentity && existingById && existingByIdentity.id !== existingById.id) {
      cookieError('A cookie with this name, domain, and path already exists');
    }
    const existing = existingById ?? existingByIdentity;
    return this.repository.upsert({
      id: input.id ?? existing?.id ?? this.generateId(),
      workspaceId,
      ...normalized,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  public delete(workspaceId: string, cookieId: string): Promise<void> {
    return this.repository.delete(workspaceId, cookieId);
  }

  public clear(workspaceId: string): Promise<void> {
    return this.repository.clear(workspaceId);
  }

  public async getCookieHeader(workspaceId: string, requestUrl: string): Promise<string | null> {
    const url = parseHttpUrl(requestUrl);
    const now = this.now();
    await this.repository.deleteExpired(workspaceId, now);
    const cookies = (await this.repository.list(workspaceId))
      .filter((cookie) => matchesRequest(cookie, url, now))
      .sort(compareRequestCookies);
    return cookies.length ? cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ') : null;
  }

  public async storeFromResponse(
    workspaceId: string,
    responseUrl: string,
    setCookieHeaders: readonly string[],
  ): Promise<CookieIngestionResult> {
    const url = parseHttpUrl(responseUrl);
    const stored: WorkspaceCookie[] = [];
    const rejected: CookieIngestionResult['rejected'] = [];

    for (const value of setCookieHeaders) {
      try {
        const parsed = parseSetCookie(value, url, this.now());
        const existing = (await this.repository.list(workspaceId)).find(
          (cookie) => cookie.name === parsed.name && cookie.domain === parsed.domain && cookie.path === parsed.path,
        );
        if (parsed.expiresAt !== null && parsed.expiresAt <= this.now()) {
          if (existing) await this.repository.delete(workspaceId, existing.id);
          continue;
        }
        stored.push(
          await this.repository.upsert({
            id: existing?.id ?? this.generateId(),
            workspaceId,
            ...parsed,
            createdAt: existing?.createdAt ?? this.now(),
            updatedAt: this.now(),
          }),
        );
      } catch (error) {
        rejected.push({ value, reason: error instanceof Error ? error.message : 'Invalid Set-Cookie value' });
      }
    }

    await this.repository.deleteExpired(workspaceId, this.now());
    return { stored, rejected };
  }
}

export function getSetCookieHeaders(headers: Headers): string[] {
  if ('getSetCookie' in headers && typeof headers.getSetCookie === 'function') return headers.getSetCookie();
  const combined = headers.get('set-cookie');
  return combined ? splitCombinedSetCookie(combined) : [];
}

export function validateCookieInput(
  input: WorkspaceCookieInput,
): Omit<WorkspaceCookie, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'> {
  const name = input.name.trim();
  const domain = normalizeDomain(input.domain);
  const path = input.path?.trim() || '/';
  const sameSite = input.sameSite ?? null;
  const secure = input.secure ?? false;
  const expiresAt = input.expiresAt ?? null;

  if (!COOKIE_NAME.test(name)) cookieError('Cookie name contains invalid characters');
  if (CONTROL_CHARACTER.test(input.value) || input.value.includes(';'))
    cookieError('Cookie value contains invalid characters');
  if (!path.startsWith('/')) cookieError('Cookie path must start with /');
  if (CONTROL_CHARACTER.test(path) || path.includes(';')) cookieError('Cookie path contains invalid characters');
  if (expiresAt !== null && !Number.isFinite(expiresAt)) cookieError('Cookie expiry must be a valid timestamp');
  if (sameSite !== null && sameSite !== 'strict' && sameSite !== 'lax' && sameSite !== 'none') {
    cookieError('Cookie SameSite value is invalid');
  }
  if (sameSite === 'none' && !secure) cookieError('SameSite=None cookies must be Secure');

  return {
    name,
    value: input.value,
    domain,
    path,
    expiresAt,
    secure,
    httpOnly: input.httpOnly ?? false,
    sameSite,
    hostOnly: input.hostOnly ?? true,
  };
}

function parseSetCookie(
  value: string,
  url: URL,
  now: number,
): Omit<WorkspaceCookie, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'> {
  const parts = value.split(';');
  const pair = parts.shift()?.trim() ?? '';
  const separator = pair.indexOf('=');
  if (separator <= 0) cookieError('Set-Cookie is missing a valid name and value');

  const name = pair.slice(0, separator).trim();
  const cookieValue = pair.slice(separator + 1).trim();
  let domain = url.hostname.toLowerCase();
  let hostOnly = true;
  let path = defaultCookiePath(url.pathname);
  let expiresAt: number | null = null;
  let maxAge: number | null = null;
  let secure = false;
  let httpOnly = false;
  let sameSite: CookieSameSite = null;

  for (const rawAttribute of parts) {
    const attribute = rawAttribute.trim();
    if (!attribute) continue;
    const attributeSeparator = attribute.indexOf('=');
    const key = (attributeSeparator < 0 ? attribute : attribute.slice(0, attributeSeparator)).trim().toLowerCase();
    const attributeValue = (attributeSeparator < 0 ? '' : attribute.slice(attributeSeparator + 1)).trim();

    if (key === 'domain' && attributeValue) {
      const candidate = normalizeDomain(attributeValue);
      if (!domainMatches(url.hostname, candidate)) cookieError('Cookie domain does not match the response URL');
      domain = candidate;
      hostOnly = false;
    } else if (key === 'path' && attributeValue.startsWith('/')) path = attributeValue;
    else if (key === 'expires') {
      const timestamp = Date.parse(attributeValue);
      if (Number.isFinite(timestamp)) expiresAt = timestamp;
    } else if (key === 'max-age' && /^-?\d+$/.test(attributeValue)) maxAge = Number(attributeValue);
    else if (key === 'secure') secure = true;
    else if (key === 'httponly') httpOnly = true;
    else if (key === 'samesite') {
      const normalized = attributeValue.toLowerCase();
      if (normalized === 'strict' || normalized === 'lax' || normalized === 'none') sameSite = normalized;
    }
  }

  if (maxAge !== null) expiresAt = maxAge <= 0 ? 0 : now + maxAge * 1_000;
  return validateCookieInput({
    name,
    value: cookieValue,
    domain,
    path,
    expiresAt,
    secure,
    httpOnly,
    sameSite,
    hostOnly,
  });
}

function matchesRequest(cookie: WorkspaceCookie, url: URL, now: number): boolean {
  if (cookie.expiresAt !== null && cookie.expiresAt <= now) return false;
  if (cookie.secure && url.protocol !== 'https:') return false;
  if (cookie.hostOnly ? url.hostname.toLowerCase() !== cookie.domain : !domainMatches(url.hostname, cookie.domain)) {
    return false;
  }
  return pathMatches(url.pathname || '/', cookie.path);
}

function normalizeDomain(value: string): string {
  const domain = value.trim().replace(/^\.+/, '').toLowerCase();
  if (!domain || (!COOKIE_DOMAIN.test(domain) && !/^\[[0-9a-f:]+\]$/i.test(domain))) {
    cookieError('Cookie domain is invalid');
  }
  return domain;
}

function domainMatches(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase();
  return host === domain || host.endsWith(`.${domain}`);
}

function pathMatches(requestPath: string, cookiePath: string): boolean {
  if (requestPath === cookiePath) return true;
  if (!requestPath.startsWith(cookiePath)) return false;
  return cookiePath.endsWith('/') || requestPath.charAt(cookiePath.length) === '/';
}

function defaultCookiePath(pathname: string): string {
  if (!pathname.startsWith('/') || pathname === '/') return '/';
  const lastSlash = pathname.lastIndexOf('/');
  return lastSlash <= 0 ? '/' : pathname.slice(0, lastSlash);
}

function compareRequestCookies(left: WorkspaceCookie, right: WorkspaceCookie): number {
  return right.path.length - left.path.length || left.createdAt - right.createdAt || left.id.localeCompare(right.id);
}

function compareCookies(left: WorkspaceCookie, right: WorkspaceCookie): number {
  return (
    left.domain.localeCompare(right.domain) ||
    left.path.localeCompare(right.path) ||
    left.name.localeCompare(right.name)
  );
}

function splitCombinedSetCookie(value: string): string[] {
  return value
    .split(/,(?=\s*[^;,=\s]+\s*=)/)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
}

function parseHttpUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') cookieError('Cookies require an HTTP or HTTPS URL');
  return url;
}

function cookieError(message: string): never {
  throw new YasumuError(YasumuErrorCodes.InvalidEntity, message);
}
