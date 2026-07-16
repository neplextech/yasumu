import type { TabularPair } from '@yasumu/core';

export interface ToggleableValue {
  value: string;
  enabled: boolean;
}

export type ToggleableValueRecord = Record<string, ToggleableValue>;

export function tabularPairsToRecord(pairs: TabularPair[] | undefined): ToggleableValueRecord {
  const result: ToggleableValueRecord = {};

  for (const pair of pairs ?? []) {
    if (pair.key) result[pair.key] = { value: pair.value, enabled: pair.enabled };
  }

  return result;
}

export function recordToTabularPairs(record: ToggleableValueRecord): TabularPair[] {
  return Object.entries(record).map(([key, entry]) => ({
    key,
    value: entry.value,
    enabled: entry.enabled,
  }));
}
