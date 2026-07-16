'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

interface RegisteredPendingSave {
  updates: object;
  persist: (updates: object) => Promise<void>;
  onSaved?: (updates: object) => Promise<void> | void;
}

interface AutosaveEntry {
  pending: RegisteredPendingSave | null;
  inFlight: Promise<void> | null;
  error: Error | null;
  version: number;
  listeners: Set<() => void>;
}

interface UseSerializedAutosaveOptions<TUpdates extends object> {
  identityKey: string | null;
  persist: (updates: TUpdates) => Promise<void>;
  onSaved?: (updates: TUpdates) => Promise<void> | void;
  debounceMs: number;
}

interface UseSerializedAutosaveReturn<TUpdates extends object> {
  enqueue: (updates: TUpdates) => void;
  flush: () => Promise<void>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveError: Error | null;
}

const autosaveEntries = new Map<string, AutosaveEntry>();

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Failed to save changes');
}

function getOrCreateEntry(identityKey: string): AutosaveEntry {
  const existing = autosaveEntries.get(identityKey);
  if (existing) return existing;

  const entry: AutosaveEntry = {
    pending: null,
    inFlight: null,
    error: null,
    version: 0,
    listeners: new Set(),
  };
  autosaveEntries.set(identityKey, entry);
  return entry;
}

function publish(entry: AutosaveEntry): void {
  entry.version += 1;
  for (const listener of entry.listeners) listener();
}

function removeSettledEntry(identityKey: string, entry: AutosaveEntry): void {
  if (!entry.pending && !entry.inFlight && !entry.error && entry.listeners.size === 0) {
    autosaveEntries.delete(identityKey);
  }
}

function subscribe(identityKey: string, listener: () => void): () => void {
  const entry = getOrCreateEntry(identityKey);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
    removeSettledEntry(identityKey, entry);
  };
}

function getVersion(identityKey: string | null): number {
  return identityKey ? (autosaveEntries.get(identityKey)?.version ?? 0) : 0;
}

function getPendingSave(entry: AutosaveEntry): RegisteredPendingSave | null {
  return entry.pending;
}

function enqueueSave<TUpdates extends object>(
  identityKey: string,
  updates: TUpdates,
  persist: (updates: TUpdates) => Promise<void>,
  onSaved?: (updates: TUpdates) => Promise<void> | void,
): void {
  const entry = getOrCreateEntry(identityKey);
  entry.pending = {
    updates: {
      ...entry.pending?.updates,
      ...updates,
    },
    persist: (queuedUpdates) => persist(queuedUpdates as TUpdates),
    onSaved: onSaved ? (queuedUpdates) => onSaved(queuedUpdates as TUpdates) : undefined,
  };
  entry.error = null;
  publish(entry);
}

async function flushSave(identityKey: string): Promise<void> {
  const entry = getOrCreateEntry(identityKey);
  if (entry.inFlight) {
    await entry.inFlight;
    return;
  }
  if (!entry.pending) {
    removeSettledEntry(identityKey, entry);
    return;
  }

  entry.inFlight = (async () => {
    while (entry.pending) {
      const pending = entry.pending;
      entry.pending = null;

      try {
        await pending.persist(pending.updates);
        await pending.onSaved?.(pending.updates);
        entry.error = null;
        publish(entry);
      } catch (error) {
        // An enqueue can happen while the awaited persistence call is running.
        const newer = getPendingSave(entry);
        entry.pending = {
          updates: {
            ...pending.updates,
            ...newer?.updates,
          },
          persist: newer?.persist ?? pending.persist,
          onSaved: newer?.onSaved ?? pending.onSaved,
        };
        entry.error = toError(error);
        publish(entry);
        throw entry.error;
      }
    }
  })().finally(() => {
    entry.inFlight = null;
    publish(entry);
    removeSettledEntry(identityKey, entry);
  });

  publish(entry);
  await entry.inFlight;
}

/**
 * Coalesces edits by identity and persists them serially. The registry lives
 * outside React so a final save and its retry state survive tab unmounts.
 */
export function useSerializedAutosave<TUpdates extends object>({
  identityKey,
  persist,
  onSaved,
  debounceMs,
}: UseSerializedAutosaveOptions<TUpdates>): UseSerializedAutosaveReturn<TUpdates> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subscribeToIdentity = useCallback(
    (listener: () => void) => (identityKey ? subscribe(identityKey, listener) : () => undefined),
    [identityKey],
  );
  const getIdentityVersion = useCallback(() => getVersion(identityKey), [identityKey]);
  useSyncExternalStore(subscribeToIdentity, getIdentityVersion, getIdentityVersion);

  const clearScheduledSave = useCallback(() => {
    if (!timeoutRef.current) return;
    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const enqueue = useCallback(
    (updates: TUpdates) => {
      if (!identityKey) return;
      enqueueSave(identityKey, updates, persist, onSaved);

      clearScheduledSave();
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        void flushSave(identityKey).catch(() => undefined);
      }, debounceMs);
    },
    [clearScheduledSave, debounceMs, identityKey, onSaved, persist],
  );

  const flush = useCallback(async () => {
    clearScheduledSave();
    if (!identityKey) return;
    await flushSave(identityKey);
  }, [clearScheduledSave, identityKey]);

  useEffect(() => {
    return () => {
      clearScheduledSave();
      if (identityKey) void flushSave(identityKey).catch(() => undefined);
    };
  }, [clearScheduledSave, identityKey]);

  const entry = identityKey ? autosaveEntries.get(identityKey) : null;
  const hasPendingSave = !!entry?.pending;
  const hasSaveInFlight = !!entry?.inFlight;
  return {
    enqueue,
    flush,
    // A debounced save is still active work. Once it fails, leave it dirty but
    // stop reporting it as busy so the caller can offer an enabled retry.
    isSaving: hasSaveInFlight || (hasPendingSave && !entry?.error),
    hasUnsavedChanges: hasPendingSave || hasSaveInFlight || !!entry?.error,
    saveError: entry?.error ?? null,
  };
}
