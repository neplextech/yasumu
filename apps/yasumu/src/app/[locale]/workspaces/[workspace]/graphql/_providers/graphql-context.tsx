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

// History item type (matches REST pattern)
interface HistoryItem {
  id: string;
  entityId: string;
  entityType: 'graphql';
  workspaceId: string;
  createdAt: number;
  updatedAt: number;
}

interface GraphqlContextData {
  entityId: string | null;
  setEntityId: (entityId: string) => void;
  history: string[];
  removeFromHistory: (entityId: string) => void;
  isLoadingHistory: boolean;
}

const GraphqlContext = createContext<GraphqlContextData | null>(null);

export function GraphqlContextProvider({ children }: React.PropsWithChildren) {
  const { yasumu } = useYasumu();
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const [entityId, _setEntityId] = useState<string | null>(null);

  // GraphQL API accessor (will be implemented in core)
  const graphql = workspace.graphql;

  // Fetch history using React Query
  const {
    data: historyData,
    isLoading: isLoadingHistory,
    refetch,
  } = useQuery<HistoryItem[]>({
    queryKey: ['graphqlEntityHistory', workspace.id],
    queryFn: () => graphql?.listHistory?.() ?? Promise.resolve([]),
    enabled: !!graphql,
  });

  // Extract entity IDs from history data
  const history: string[] = historyData
    ? [...new Set(historyData.map((item: HistoryItem) => item.entityId))]
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
    queryClient.setQueryData<HistoryItem[]>(
      ['graphqlEntityHistory', workspace.id],
      (old) => {
        if (!old) return old;
        return [
          ...old,
          {
            id: `temp-${id}`,
            entityId: id,
            entityType: 'graphql' as const,
            workspaceId: workspace.id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ];
      },
    );

    // Sync with backend (this will trigger refetch via event)
    await graphql?.upsertHistory?.(id);
  };

  const removeFromHistory = async (id: string) => {
    // Optimistically update cache
    queryClient.setQueryData<HistoryItem[]>(
      ['graphqlEntityHistory', workspace.id],
      (old) => {
        if (!old) return old;
        return old.filter((item: HistoryItem) => item.entityId !== id);
      },
    );

    // If we removed the active entity, switch to the next one
    if (id === entityId) {
      const remaining = history.filter((item: string) => item !== id);
      const nextId = remaining.length > 0 ? remaining[0] : null;
      _setEntityId(nextId);
    }

    // Sync with backend (this will trigger refetch via event)
    await graphql?.deleteHistory?.(id);
  };

  const setEntityId = (id: string) => {
    _setEntityId(id);
    addToHistory(id);
  };

  return (
    <GraphqlContext.Provider
      value={{
        entityId,
        setEntityId,
        history,
        removeFromHistory,
        isLoadingHistory,
      }}
    >
      {children}
    </GraphqlContext.Provider>
  );
}

export function useGraphqlContext() {
  const context = useContext(GraphqlContext);

  if (!context) {
    throw new Error(
      'useGraphqlContext() must be used within a <GraphqlContextProvider />',
    );
  }

  return context;
}
