'use client';
import { createContext, useContext, useState } from 'react';

interface RestContextData {
  entityId: string | null;
  setEntityId: (entityId: string) => void;
  history: string[];
  addToHistory: (entityId: string) => void;
  removeFromHistory: (entityId: string) => void;
}

const RestContext = createContext<RestContextData | null>(null);

export function RestContextProvider({ children }: React.PropsWithChildren) {
  const [entityId, _setEntityId] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const addToHistory = (id: string) => {
    setHistory((prev) => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
  };

  const removeFromHistory = (id: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((item) => item !== id);
      // If we removed the active entity, switch to the last one or null
      if (id === entityId) {
        const nextId =
          newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;
        // We can't call setEntityId here directly because it would trigger another addToHistory
        // But actually setEntityId just sets state.
        // Let's handle the selection switch in the UI or here carefully.
        // If we rely on the component using this context to react, we should update entityId state.
        if (nextId) {
          _setEntityId(nextId);
        } else {
          _setEntityId(null);
        }
      }
      return newHistory;
    });
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
        addToHistory,
        removeFromHistory,
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
