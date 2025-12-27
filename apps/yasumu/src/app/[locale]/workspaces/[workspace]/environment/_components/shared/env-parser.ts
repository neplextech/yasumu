import { TabularPair } from '@yasumu/core';

export function parseEnvFormat(text: string): TabularPair[] {
  const lines = text.split(/\r?\n/);
  const pairs: TabularPair[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (key) {
        pairs.push({ key, value, enabled: true });
      }
    }
  }

  return pairs;
}
