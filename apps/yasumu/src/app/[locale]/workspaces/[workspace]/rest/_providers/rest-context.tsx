'use client';
import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useState,
} from 'react';
import {
  useActiveWorkspace,
  useYasumu,
} from '@/components/providers/workspace-provider';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface RestContextData {
  entityId: string | null;
  setEntityId: (entityId: string) => void;
  history: string[];
  removeFromHistory: (entityId: string) => void;
  isLoadingHistory: boolean;
}

const RestContext = createContext<RestContextData | null>(null);

export function RestContextProvider({ children }: React.PropsWithChildren) {
  const { yasumu } = useYasumu();
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const [entityId, _setEntityId] = useState<string | null>(null);

  // Fetch history using React Query
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch,
  } = useQuery({
    queryKey: ['entityHistory', workspace.id],
    queryFn: () => workspace.rest.listHistory(),
  });

  // Extract entity IDs from history data
  const history = historyData
    ? [...new Set(historyData.map((item) => item.entityId))]
    : [];

  // Set initial active entity when history loads
  useEffect(() => {
    if (historyData && historyData.length > 0 && entityId === null) {
      // Set the most recent entity as active (first in the list since it's sorted by updatedAt DESC)
      _setEntityId(historyData[0].entityId);
    }
  }, [historyData, entityId]);

  // Refetch handler for event subscription
  const refetchHistory = useEffectEvent(() => {
    return refetch();
  });

  // Subscribe to entity history update events
  useEffect(() => {
    const controller = new AbortController();

    yasumu.events.on('onEntityHistoryUpdate', refetchHistory, {
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [yasumu.events, refetchHistory]);

  const addToHistory = async (id: string) => {
    // If already in history, just switch tabs - don't reorder
    if (history.includes(id)) {
      return;
    }

    // Optimistically add new entry to cache (at the end to maintain tab order)
    queryClient.setQueryData(
      ['entityHistory', workspace.id],
      (old: typeof historyData) => {
        if (!old) return old;
        return [
          ...old,
          {
            id: `temp-${id}`,
            entityId: id,
            entityType: 'rest' as const,
            workspaceId: workspace.id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ];
      },
    );

    // Sync with backend (this will trigger refetch via event)
    await workspace.rest.upsertHistory(id);
  };

  const removeFromHistory = async (id: string) => {
    // Optimistically update cache
    queryClient.setQueryData(
      ['entityHistory', workspace.id],
      (old: typeof historyData) => {
        if (!old) return old;
        return old.filter((item) => item.entityId !== id);
      },
    );

    // If we removed the active entity, switch to the next one
    if (id === entityId) {
      const remaining = history.filter((item) => item !== id);
      const nextId = remaining.length > 0 ? remaining[0] : null;
      _setEntityId(nextId);
    }

    // Sync with backend (this will trigger refetch via event)
    await workspace.rest.deleteHistory(id);
  };

  const setEntityId = (id: string) => {
    _setEntityId(id);
    addToHistory(id);
  };

  return (
    <RestContext.Provider
      value={{
        entityId,
        setEntityId,
        history,
        removeFromHistory,
        isLoadingHistory,
      }}
    >
      {children}
    </RestContext.Provider>
  );
}

export function useRestContext() {
  const context = useContext(RestContext);

  if (!context) {
    throw new Error(
      'useRestContext() must be used within a <RestContextProvider />',
    );
  }

  return context;
}
