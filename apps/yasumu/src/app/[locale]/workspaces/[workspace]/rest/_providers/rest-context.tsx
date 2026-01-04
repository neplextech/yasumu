'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';

interface RestContextData {
  entityId: string | null;
  setEntityId: (entityId: string) => void;
  history: string[];
  removeFromHistory: (entityId: string) => void;
  isLoadingHistory: boolean;
}

const RestContext = createContext<RestContextData | null>(null);

export function RestContextProvider({ children }: React.PropsWithChildren) {
  const workspace = useActiveWorkspace();
  const [entityId, _setEntityId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load history from backend on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const historyData = await workspace.rest.listHistory();
        const entityIds = [
          ...new Set(historyData.map((item) => item.entityId)),
        ].reverse();
        setHistory(entityIds);

        // Set the most recent entity as active (last in the array after reverse)
        if (entityIds.length > 0) {
          _setEntityId(entityIds[entityIds.length - 1]);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [workspace]);

  const addToHistory = async (id: string) => {
    // Optimistically update local state
    setHistory((prev) => {
      if (prev.includes(id)) {
        return [...prev.filter((item) => item !== id), id];
      }
      return [...prev, id];
    });

    // Sync with backend
    await workspace.rest.upsertHistory(id);
  };

  const removeFromHistory = async (id: string) => {
    // Optimistically update local state
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item !== id);
      if (id === entityId) {
        const nextId =
          newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
        _setEntityId(nextId);
      }
      return newHistory;
    });

    // Sync with backend
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
