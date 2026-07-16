'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { GraphqlEntityData, GraphqlEntityRequestBody, GraphqlEntityUpdateOptions } from '@yasumu/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useSerializedAutosave } from '@/app/[locale]/workspaces/[workspace]/_hooks/use-serialized-autosave';
import { workspaceQueryKeys } from '@/app/[locale]/workspaces/[workspace]/_lib/workspace-query-keys';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';

const DEBOUNCE_DELAY = 500;

export interface GraphqlBodyValue {
  query: string;
  variables: string;
  operationName: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getGraphqlBodyValue(requestBody: GraphqlEntityRequestBody | null | undefined): GraphqlBodyValue {
  const defaultValue: GraphqlBodyValue = {
    query: '',
    variables: '',
    operationName: '',
  };
  if (!isRecord(requestBody?.value)) return defaultValue;
  const value = requestBody.value;
  return {
    query: typeof value.query === 'string' ? value.query : '',
    variables: typeof value.variables === 'string' ? value.variables : '',
    operationName: typeof value.operationName === 'string' ? value.operationName : '',
  };
}

export function updateGraphqlBodyValue(
  current: GraphqlEntityRequestBody | null | undefined,
  updates: Partial<GraphqlBodyValue>,
): GraphqlEntityRequestBody {
  return {
    type: 'json',
    value: { ...getGraphqlBodyValue(current), ...updates },
    metadata: current?.metadata || {},
  };
}

interface UseGraphqlEntityOptions {
  entityId: string | null;
}

interface UseGraphqlEntityReturn {
  data: GraphqlEntityData | null;
  isLoading: boolean;
  error: Error | null;
  saveError: Error | null;
  isSaving: boolean;
  updateField: <K extends keyof GraphqlEntityUpdateOptions>(field: K, value: GraphqlEntityUpdateOptions[K]) => void;
  updateFields: (fields: Partial<GraphqlEntityUpdateOptions>) => void;
  updateBodyValue: (updates: Partial<GraphqlBodyValue>) => void;
  save: () => Promise<void>;
}

export function useGraphqlEntity({ entityId }: UseGraphqlEntityOptions): UseGraphqlEntityReturn {
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const [localData, setLocalData] = useState<GraphqlEntityData | null>(null);
  const localDataRef = useRef<GraphqlEntityData | null>(null);
  const graphql = workspace.graphql;
  const queryKey = useMemo(() => workspaceQueryKeys.graphqlEntity(workspace.id, entityId), [entityId, workspace.id]);

  const {
    data: serverData,
    isLoading,
    error: queryError,
    isFetched,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!entityId) return null;
      const entity = await graphql.get(entityId);
      return entity.data;
    },
    enabled: !!entityId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const persist = useCallback(
    async (updates: Partial<GraphqlEntityUpdateOptions>) => {
      if (!entityId) throw new Error('Cannot save a GraphQL entity without an id');
      await graphql.update(entityId, updates);
    },
    [entityId, graphql],
  );

  const onSaved = useCallback(
    (updates: Partial<GraphqlEntityUpdateOptions>) => {
      queryClient.setQueryData<GraphqlEntityData | null>(queryKey, (old) => (old ? { ...old, ...updates } : old));
      if (entityId) {
        void queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.graphqlTab(workspace.id, entityId),
        });
      }
    },
    [entityId, queryClient, queryKey, workspace.id],
  );

  const { enqueue, flush, isSaving, hasUnsavedChanges, saveError } = useSerializedAutosave<
    Partial<GraphqlEntityUpdateOptions>
  >({
    identityKey: entityId ? `${workspace.id}:graphql:${entityId}` : null,
    persist,
    onSaved,
    debounceMs: DEBOUNCE_DELAY,
  });

  const commitLocalData = useCallback((next: GraphqlEntityData | null) => {
    localDataRef.current = next;
    setLocalData(next);
  }, []);

  useEffect(() => {
    if (!entityId) {
      commitLocalData(null);
      return;
    }

    commitLocalData(queryClient.getQueryData<GraphqlEntityData>(queryKey) ?? null);
  }, [commitLocalData, entityId, queryClient, queryKey]);

  useEffect(() => {
    if (!serverData || !isFetched || hasUnsavedChanges) return;
    commitLocalData(serverData);
  }, [commitLocalData, hasUnsavedChanges, isFetched, serverData]);

  const updateFields = useCallback(
    (fields: Partial<GraphqlEntityUpdateOptions>) => {
      if (!entityId) return;
      const current = localDataRef.current;
      if (current) commitLocalData({ ...current, ...fields });
      queryClient.setQueryData<GraphqlEntityData | null>(queryKey, (cached) =>
        cached ? { ...cached, ...fields } : cached,
      );
      enqueue(fields);
    },
    [commitLocalData, enqueue, entityId, queryClient, queryKey],
  );

  const updateField = useCallback(
    <K extends keyof GraphqlEntityUpdateOptions>(field: K, value: GraphqlEntityUpdateOptions[K]) => {
      updateFields({ [field]: value } as Partial<GraphqlEntityUpdateOptions>);
    },
    [updateFields],
  );

  const updateBodyValue = useCallback(
    (updates: Partial<GraphqlBodyValue>) => {
      if (!entityId) return;
      const current = localDataRef.current;
      if (!current) return;

      const requestBody = updateGraphqlBodyValue(current.requestBody, updates);
      commitLocalData({ ...current, requestBody });
      queryClient.setQueryData<GraphqlEntityData | null>(queryKey, (cached) =>
        cached ? { ...cached, requestBody } : cached,
      );
      enqueue({ requestBody });
    },
    [commitLocalData, enqueue, entityId, queryClient, queryKey],
  );

  return {
    data: localData,
    isLoading,
    error: queryError instanceof Error ? queryError : null,
    saveError,
    isSaving,
    updateField,
    updateFields,
    updateBodyValue,
    save: flush,
  };
}
