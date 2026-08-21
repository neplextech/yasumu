const EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const WEB_PROTOCOLS = new Set(['http:', 'https:']);

export interface ExternalUrlResolutionOptions {
  appOrigin: string;
  baseUrl: string;
}

export function resolveExternalUrl(href: string, { appOrigin, baseUrl }: ExternalUrlResolutionOptions): string | null {
  const value = href.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value, baseUrl);
  } catch {
    return null;
  }

  if (!EXTERNAL_PROTOCOLS.has(url.protocol)) return null;
  if (WEB_PROTOCOLS.has(url.protocol) && url.origin === appOrigin) return null;

  return url.toString();
}
