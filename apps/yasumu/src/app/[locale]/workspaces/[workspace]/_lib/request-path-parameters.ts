export function extractPathParameterKeys(url: string): string[] {
  const collect = (value: string) =>
    Array.from(new Set(Array.from(value.matchAll(/:([a-zA-Z_][a-zA-Z0-9_]*)/g)).map((match) => match[1])));
  try {
    return collect(new URL(url).pathname);
  } catch {
    const withoutProtocol = url.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '');
    const pathStart = withoutProtocol.indexOf('/');
    return pathStart === -1 ? [] : collect(withoutProtocol.slice(pathStart));
  }
}
