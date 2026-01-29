'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import {
  TabularPair,
  YasumuEmbeddedScript,
  YasumuScriptingLanguage,
} from '@yasumu/common';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const DEBOUNCE_DELAY = 500;

// GraphQL entity data structure (matches REST pattern)
export interface GraphqlEntityData {
  id: string;
  name: string | null;
  url: string | null;
  groupId: string | null;
  query: string | null;
  variables: string | null;
  operationName: string | null;
  requestHeaders: TabularPair[];
  script: YasumuEmbeddedScript;
  testScript: YasumuEmbeddedScript;
  dependencies: string[];
  metadata: Record<string, unknown> | null;
  createdAt: number;
  updatedAt: number;
}

export interface GraphqlEntityUpdateOptions {
  name?: string | null;
  url?: string | null;
  groupId?: string | null;
  query?: string | null;
  variables?: string | null;
  operationName?: string | null;
  requestHeaders?: TabularPair[];
  script?: YasumuEmbeddedScript;
  testScript?: YasumuEmbeddedScript;
  dependencies?: string[];
  metadata?: Record<string, unknown> | null;
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
    query: null,
    variables: null,
    operationName: null,
    requestHeaders: [],
    script: createDefaultScript(),
    testScript: createDefaultScript(),
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
      return entity.data as GraphqlEntityData;
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
    save,
  };
}
