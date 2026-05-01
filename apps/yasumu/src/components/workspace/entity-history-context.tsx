'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { EntityHistoryData } from '@yasumu/core';
import {
  useActiveWorkspace,
  useYasumu,
} from '@/components/providers/workspace-provider';

export type EntityHistoryScope = 'rest' | 'graphql';

export interface EntityHistoryContextData {
  entityId: string | null;
  setEntityId: (entityId: string) => void;
  history: string[];
  removeFromHistory: (entityId: string) => void;
  isLoadingHistory: boolean;
}

interface EntityHistoryProviderProps extends React.PropsWithChildren {
  scope: EntityHistoryScope;
  listHistory: () => Promise<EntityHistoryData[]>;
  upsertHistory: (entityId: string) => Promise<EntityHistoryData | void>;
  deleteHistory: (entityId: string) => Promise<void>;
}

const EntityHistoryContext = createContext<EntityHistoryContextData | null>(
  null,
);

export function EntityHistoryProvider({
  children,
  scope,
  listHistory,
  upsertHistory,
  deleteHistory,
}: EntityHistoryProviderProps) {
  const { yasumu } = useYasumu();
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const queryKey = useMemo(
    () => ['entityHistory', workspace.id, scope] as const,
    [scope, workspace.id],
  );

  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: listHistory,
  });

  const history = useMemo(
    () =>
      historyData ? [...new Set(historyData.map((item) => item.entityId))] : [],
    [historyData],
  );

  const entityId =
    selectedEntityId && history.includes(selectedEntityId)
      ? selectedEntityId
      : (history[0] ?? null);

  const refetchHistory = useEffectEvent(() => {
    return refetch();
  });

  useEffect(() => {
    const controller = new AbortController();

    yasumu.events.on('onEntityHistoryUpdate', refetchHistory, {
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [yasumu.events, refetchHistory]);

  const addToHistory = useCallback(
    async (id: string) => {
      if (history.includes(id)) {
        return;
      }

      queryClient.setQueryData<EntityHistoryData[]>(queryKey, (old) => {
        const now = Date.now();
        const existing = old?.filter((item) => item.entityId !== id) ?? [];

        return [
          {
            id: `temp-${scope}-${id}`,
            entityId: id,
            entityType: scope,
            workspaceId: workspace.id,
            createdAt: now,
            updatedAt: now,
          },
          ...existing,
        ];
      });

      await upsertHistory(id);
    },
    [history, queryClient, queryKey, scope, upsertHistory, workspace.id],
  );

  const removeFromHistory = useCallback(
    async (id: string) => {
      queryClient.setQueryData<EntityHistoryData[]>(queryKey, (old) =>
        old ? old.filter((item) => item.entityId !== id) : old,
      );

      if (id === entityId) {
        const nextId = history.find((item) => item !== id) ?? null;
        setSelectedEntityId(nextId);
      }

      await deleteHistory(id);
    },
    [deleteHistory, entityId, history, queryClient, queryKey],
  );

  const setEntityId = useCallback(
    (id: string) => {
      setSelectedEntityId(id);
      void addToHistory(id);
    },
    [addToHistory],
  );

  const value = useMemo(
    () => ({
      entityId,
      setEntityId,
      history,
      removeFromHistory,
      isLoadingHistory,
    }),
    [entityId, history, isLoadingHistory, removeFromHistory, setEntityId],
  );

  return (
    <EntityHistoryContext.Provider value={value}>
      {children}
    </EntityHistoryContext.Provider>
  );
}

export function useEntityHistoryContext() {
  const context = useContext(EntityHistoryContext);

  if (!context) {
    throw new Error(
      'useEntityHistoryContext() must be used within an <EntityHistoryProvider />',
    );
  }

  return context;
}
