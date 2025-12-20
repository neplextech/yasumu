'use client';
import { createContext, useContext, useState } from 'react';

interface RestContextData {
  entityId: string | null;
  setEntityId: (entityId: string) => void;
}

const RestContext = createContext<RestContextData | null>(null);

export function RestContextProvider({ children }: React.PropsWithChildren) {
  const [entityId, setEntityId] = useState<string | null>(null);

  return (
    <RestContext.Provider value={{ entityId, setEntityId }}>
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
