'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import {
  RestEntityData,
  RestEntityRequestBody,
  RestEntityUpdateOptions,
  TabularPair,
  YasumuEmbeddedScript,
  YasumuScriptingLanguage,
} from '@yasumu/common';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const DEBOUNCE_DELAY = 500;

interface UseRestEntityOptions {
  entityId: string | null;
}

interface UseRestEntityReturn {
  data: RestEntityData | null;
  isLoading: boolean;
  error: Error | null;
  isSaving: boolean;
  updateField: <K extends keyof RestEntityUpdateOptions>(
    field: K,
    value: RestEntityUpdateOptions[K],
  ) => void;
  updateFields: (fields: Partial<RestEntityUpdateOptions>) => void;
  save: () => Promise<void>;
}

function createDefaultScript(): YasumuEmbeddedScript {
  return {
    language: YasumuScriptingLanguage.JavaScript,
    code: '',
  };
}

function createDefaultEntity(): RestEntityData {
  return {
    id: '',
    name: null,
    method: 'GET',
    url: null,
    groupId: null,
    requestHeaders: [],
    requestParameters: [],
    searchParameters: [],
    requestBody: null,
    script: createDefaultScript(),
    testScript: createDefaultScript(),
    dependencies: [],
    metadata: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function useRestEntity({
  entityId,
}: UseRestEntityOptions): UseRestEntityReturn {
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const [localData, setLocalData] = useState<RestEntityData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const pendingUpdates = useRef<Partial<RestEntityUpdateOptions>>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const queryKey = useMemo(() => ['rest-entity', entityId], [entityId]);

  const {
    data: serverData,
    isLoading,
    error,
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
    const cached = queryClient.getQueryData<RestEntityData>(queryKey);
    if (cached) {
      setLocalData(cached);
    }
    // Note: Don't set localData to null here - let the query fetch handle it
    // This prevents flickering when switching entities
  }, [entityId]); // eslint-disable-line react-hooks/exhaustive-deps

  const flushSave = useCallback(async () => {
    if (!entityId || Object.keys(pendingUpdates.current).length === 0) return;

    const updates = { ...pendingUpdates.current };
    pendingUpdates.current = {};

    try {
      setIsSaving(true);
      await workspace.rest.update(entityId, updates);
      queryClient.setQueryData(queryKey, (old: RestEntityData | null) => {
        if (!old) return old;
        return { ...old, ...updates };
      });
    } catch (err) {
      console.error('Failed to save entity:', err);
      pendingUpdates.current = { ...pendingUpdates.current, ...updates };
    } finally {
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  }, [entityId, workspace, queryClient, queryKey]);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      flushSave();
    }, DEBOUNCE_DELAY);
  }, [flushSave]);

  const updateFields = useCallback(
    (fields: Partial<RestEntityUpdateOptions>) => {
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
    <K extends keyof RestEntityUpdateOptions>(
      field: K,
      value: RestEntityUpdateOptions[K],
    ) => {
      updateFields({ [field]: value } as Partial<RestEntityUpdateOptions>);
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
