'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { YasumuScriptingLanguage } from '@yasumu/common';
import type {
  GraphqlEntityData,
  GraphqlEntityRequestBody,
  GraphqlEntityUpdateOptions,
  YasumuEmbeddedScript,
} from '@yasumu/common';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type { GraphqlEntityData, GraphqlEntityUpdateOptions };

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

function createDefaultScript(): YasumuEmbeddedScript {
  return {
    language: YasumuScriptingLanguage.JavaScript,
    code: '',
  };
}

function createDefaultEntity(): GraphqlEntityData {
  return {
    id: '',
    name: null,
    url: null,
    groupId: null,
    requestHeaders: [],
    requestParameters: [],
    searchParameters: [],
    requestBody: {
      type: 'json',
      value: { query: '', variables: '', operationName: '' },
      metadata: {},
    },
    script: createDefaultScript(),
    dependencies: [],
    metadata: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
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

  // GraphQL API accessor (will be implemented in core)
  const graphql = workspace.graphql;

  const queryKey = useMemo(() => ['graphql-entity', entityId], [entityId]);

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
    if (serverData && isFetched) {
      setLocalData(serverData);
      pendingUpdates.current = {};
    }
  }, [serverData, isFetched, entityId]);

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
  }, [entityId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        return {
          ...prev,
          requestBody: updateGraphqlBodyValue(prev.requestBody, updates),
        };
      });

      // We need to read current requestBody to build the full update
      setLocalData((prev) => {
        if (prev) {
          const newBody = updateGraphqlBodyValue(prev.requestBody, updates);
          pendingUpdates.current = {
            ...pendingUpdates.current,
            requestBody: newBody,
          };
        }
        return prev;
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
