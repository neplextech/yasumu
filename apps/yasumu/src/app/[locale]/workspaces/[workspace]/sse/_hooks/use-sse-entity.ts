'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SseEntityData, SseEntityUpdateOptions } from '@yasumu/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSerializedAutosave } from '@/app/[locale]/workspaces/[workspace]/_hooks/use-serialized-autosave';
import { workspaceQueryKeys } from '@/app/[locale]/workspaces/[workspace]/_lib/workspace-query-keys';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';

const DEBOUNCE_DELAY = 500;

export function useSseEntity({ entityId }: { entityId: string | null }) {
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const [localData, setLocalData] = useState<SseEntityData | null>(null);
  const localDataRef = useRef<SseEntityData | null>(null);
  const queryKey = useMemo(() => workspaceQueryKeys.sseEntity(workspace.id, entityId), [entityId, workspace.id]);
  const {
    data: serverData,
    isLoading,
    error: queryError,
    isFetched,
  } = useQuery({
    queryKey,
    queryFn: async () => (entityId ? (await workspace.sse.get(entityId)).data : null),
    enabled: !!entityId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const persist = useCallback(
    async (updates: Partial<SseEntityUpdateOptions>) => {
      if (!entityId) throw new Error('Cannot save an SSE entity without an id');
      await workspace.sse.update(entityId, updates);
    },
    [entityId, workspace.sse],
  );
  const onSaved = useCallback(
    (updates: Partial<SseEntityUpdateOptions>) => {
      queryClient.setQueryData<SseEntityData | null>(queryKey, (current) =>
        current ? { ...current, ...updates } : current,
      );
      if (entityId) void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.sseTab(workspace.id, entityId) });
    },
    [entityId, queryClient, queryKey, workspace.id],
  );
  const { enqueue, flush, isSaving, hasUnsavedChanges, saveError } = useSerializedAutosave<
    Partial<SseEntityUpdateOptions>
  >({
    identityKey: entityId ? `${workspace.id}:sse:${entityId}` : null,
    persist,
    onSaved,
    debounceMs: DEBOUNCE_DELAY,
  });

  const commit = useCallback((value: SseEntityData | null) => {
    localDataRef.current = value;
    setLocalData(value);
  }, []);

  useEffect(() => {
    commit(entityId ? (queryClient.getQueryData<SseEntityData>(queryKey) ?? null) : null);
  }, [commit, entityId, queryClient, queryKey]);
  useEffect(() => {
    if (serverData && isFetched && !hasUnsavedChanges) commit(serverData);
  }, [commit, hasUnsavedChanges, isFetched, serverData]);

  const updateFields = useCallback(
    (fields: Partial<SseEntityUpdateOptions>) => {
      if (!entityId) return;
      const current = localDataRef.current;
      if (current) commit({ ...current, ...fields });
      queryClient.setQueryData<SseEntityData | null>(queryKey, (cached) =>
        cached ? { ...cached, ...fields } : cached,
      );
      enqueue(fields);
    },
    [commit, enqueue, entityId, queryClient, queryKey],
  );
  const updateField = useCallback(
    <K extends keyof SseEntityUpdateOptions>(field: K, value: SseEntityUpdateOptions[K]) => {
      updateFields({ [field]: value } as Partial<SseEntityUpdateOptions>);
    },
    [updateFields],
  );

  return {
    data: localData,
    isLoading,
    error: queryError instanceof Error ? queryError : null,
    saveError,
    isSaving,
    updateField,
    updateFields,
    save: flush,
  };
}
