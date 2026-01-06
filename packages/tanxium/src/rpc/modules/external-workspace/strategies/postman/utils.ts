import { PostmanEnvironment } from './types.ts';

export function looksLikeJson(str: string): boolean {
  const trimmed = str.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
}

export function isPostmanEnvironment(
  parsed: unknown,
): parsed is PostmanEnvironment {
  return (
    typeof parsed === 'object' &&
    parsed !== null &&
    'values' in parsed &&
    Array.isArray((parsed as PostmanEnvironment).values)
  );
}

export function prepend(str: string, prefix: string): string {
  if (!str) return '';
  if (str.startsWith(prefix)) return str;
  return `${prefix}${str}`;
}
