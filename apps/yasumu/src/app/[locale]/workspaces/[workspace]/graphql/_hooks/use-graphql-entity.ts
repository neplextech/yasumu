'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import type {
  GraphqlEntityData,
  GraphqlEntityRequestBody,
  GraphqlEntityUpdateOptions,
} from '@yasumu/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const DEBOUNCE_DELAY = 500;

/**
 * The structured value inside GraphqlEntityRequestBody.value for GraphQL requests.
 */
export interface GraphqlBodyValue {
  query: string;
  variables: string;
  operationName: string;
}

/**
 * Extract query/variables/operationName from a GraphQL entity's requestBody.
 */
export function getGraphqlBodyValue(
  requestBody: GraphqlEntityRequestBody | null | undefined,
): GraphqlBodyValue {
  const defaultValue: GraphqlBodyValue = {
    query: '',
    variables: '',
    operationName: '',
  };
  if (!requestBody?.value || typeof requestBody.value !== 'object')
    return defaultValue;
  const val = requestBody.value as Partial<GraphqlBodyValue>;
  return {
    query: val.query || '',
    variables: val.variables || '',
    operationName: val.operationName || '',
  };
}

/**
 * Create a new GraphqlEntityRequestBody with updated body value fields.
 */
export function updateGraphqlBodyValue(
  current: GraphqlEntityRequestBody | null | undefined,
  updates: Partial<GraphqlBodyValue>,
): GraphqlEntityRequestBody {
  const currentValue = getGraphqlBodyValue(current);
  return {
    type: 'json',
    value: { ...currentValue, ...updates },
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
  isSaving: boolean;
  updateField: <K extends keyof GraphqlEntityUpdateOptions>(
    field: K,
    value: GraphqlEntityUpdateOptions[K],
  ) => void;
  updateFields: (fields: Partial<GraphqlEntityUpdateOptions>) => void;
  updateBodyValue: (updates: Partial<GraphqlBodyValue>) => void;
  save: () => Promise<void>;
}

export function useGraphqlEntity({
  entityId,
}: UseGraphqlEntityOptions): UseGraphqlEntityReturn {
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const [localData, setLocalData] = useState<GraphqlEntityData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const pendingUpdates = useRef<Partial<GraphqlEntityUpdateOptions>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // GraphQL API accessor
  const graphql = workspace.graphql;

  const queryKey = useMemo(
    () => ['graphql-entity', workspace.id, entityId],
    [entityId, workspace.id],
  );

  const {
    data: serverData,
    isLoading,
    error,
    isFetched,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!entityId || !graphql) return null;
      const entity = await graphql.get(entityId);
      return entity.data;
    },
    enabled: !!entityId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    pendingUpdates.current = {};
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (!entityId) {
      setLocalData(null);
      return;
    }
    const cached = queryClient.getQueryData<GraphqlEntityData>(queryKey);
    if (cached) {
      setLocalData(cached);
    }
  }, [entityId, queryClient, queryKey]);

  useEffect(() => {
    if (!serverData || !isFetched) return;

    setLocalData((current) => {
      if (current?.id === serverData.id) {
        return current;
      }

      return serverData;
    });
  }, [serverData, isFetched]);

  const flushSave = useCallback(async () => {
    if (
      !entityId ||
      !graphql ||
      Object.keys(pendingUpdates.current).length === 0
    )
      return;

    const updates = { ...pendingUpdates.current };
    pendingUpdates.current = {};

    try {
      setIsSaving(true);
      await graphql.update(entityId, updates);
      queryClient.setQueryData(queryKey, (old: GraphqlEntityData | null) => {
        if (!old) return old;
        return { ...old, ...updates };
      });
    } catch (err) {
      console.error('Failed to save GraphQL entity:', err);
      // Restore pending updates if failed
      pendingUpdates.current = { ...pendingUpdates.current, ...updates };
    } finally {
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  }, [entityId, graphql, queryClient, queryKey]);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      flushSave();
    }, DEBOUNCE_DELAY);
  }, [flushSave]);

  const updateFields = useCallback(
    (fields: Partial<GraphqlEntityUpdateOptions>) => {
      if (!entityId) return;

      setLocalData((prev) => {
        if (!prev) return prev;
        return { ...prev, ...fields };
      });

      pendingUpdates.current = { ...pendingUpdates.current, ...fields };
      scheduleSave();
    },
    [entityId, scheduleSave],
  );

  const updateField = useCallback(
    <K extends keyof GraphqlEntityUpdateOptions>(
      field: K,
      value: GraphqlEntityUpdateOptions[K],
    ) => {
      updateFields({ [field]: value } as Partial<GraphqlEntityUpdateOptions>);
    },
    [updateFields],
  );

  const updateBodyValue = useCallback(
    (updates: Partial<GraphqlBodyValue>) => {
      if (!entityId) return;

      setLocalData((prev) => {
        if (!prev) return prev;
        const pendingBody = updateGraphqlBodyValue(prev.requestBody, updates);
        pendingUpdates.current = {
          ...pendingUpdates.current,
          requestBody: pendingBody,
        };

        return {
          ...prev,
          requestBody: pendingBody,
        };
      });

      scheduleSave();
    },
    [entityId, scheduleSave],
  );

  const save = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await flushSave();
  }, [flushSave]);

  return {
    data: localData,
    isLoading,
    error: error as Error | null,
    isSaving,
    updateField,
    updateFields,
    updateBodyValue,
    save,
  };
}
