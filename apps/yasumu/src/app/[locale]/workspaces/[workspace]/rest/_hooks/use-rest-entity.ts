'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RestEntityData, RestEntityUpdateOptions } from '@yasumu/core';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSerializedAutosave } from '@/app/[locale]/workspaces/[workspace]/_hooks/use-serialized-autosave';
import { workspaceQueryKeys } from '@/app/[locale]/workspaces/[workspace]/_lib/workspace-query-keys';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';

const DEBOUNCE_DELAY = 500;

interface UseRestEntityOptions {
  entityId: string | null;
}

interface UseRestEntityReturn {
  data: RestEntityData | null;
  isLoading: boolean;
  error: Error | null;
  saveError: Error | null;
  isSaving: boolean;
  updateField: <K extends keyof RestEntityUpdateOptions>(field: K, value: RestEntityUpdateOptions[K]) => void;
  updateFields: (fields: Partial<RestEntityUpdateOptions>) => void;
  save: () => Promise<void>;
}

export function useRestEntity({ entityId }: UseRestEntityOptions): UseRestEntityReturn {
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const [localData, setLocalData] = useState<RestEntityData | null>(null);
  const queryKey = useMemo(() => workspaceQueryKeys.restEntity(workspace.id, entityId), [entityId, workspace.id]);

  const {
    data: serverData,
    isLoading,
    error: queryError,
    isFetched,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!entityId) return null;
      const entity = await workspace.rest.get(entityId);
      return entity.data;
    },
    enabled: !!entityId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const persist = useCallback(
    async (updates: Partial<RestEntityUpdateOptions>) => {
      if (!entityId) throw new Error('Cannot save a REST entity without an id');
      await workspace.rest.update(entityId, updates);
    },
    [entityId, workspace.rest],
  );

  const onSaved = useCallback(
    (updates: Partial<RestEntityUpdateOptions>) => {
      queryClient.setQueryData<RestEntityData | null>(queryKey, (old) => (old ? { ...old, ...updates } : old));
      if (entityId) {
        void queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.restTab(workspace.id, entityId),
        });
      }
    },
    [entityId, queryClient, queryKey, workspace.id],
  );

  const { enqueue, flush, isSaving, hasUnsavedChanges, saveError } = useSerializedAutosave<
    Partial<RestEntityUpdateOptions>
  >({
    identityKey: entityId ? `${workspace.id}:rest:${entityId}` : null,
    persist,
    onSaved,
    debounceMs: DEBOUNCE_DELAY,
  });

  useEffect(() => {
    if (!entityId) {
      setLocalData(null);
      return;
    }

    setLocalData(queryClient.getQueryData<RestEntityData>(queryKey) ?? null);
  }, [entityId, queryClient, queryKey]);

  useEffect(() => {
    if (!serverData || !isFetched || hasUnsavedChanges) return;
    setLocalData(serverData);
  }, [hasUnsavedChanges, isFetched, serverData]);

  const updateFields = useCallback(
    (fields: Partial<RestEntityUpdateOptions>) => {
      if (!entityId) return;
      setLocalData((prev) => (prev ? { ...prev, ...fields } : prev));
      queryClient.setQueryData<RestEntityData | null>(queryKey, (current) =>
        current ? { ...current, ...fields } : current,
      );
      enqueue(fields);
    },
    [enqueue, entityId, queryClient, queryKey],
  );

  const updateField = useCallback(
    <K extends keyof RestEntityUpdateOptions>(field: K, value: RestEntityUpdateOptions[K]) => {
      updateFields({ [field]: value } as Partial<RestEntityUpdateOptions>);
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
