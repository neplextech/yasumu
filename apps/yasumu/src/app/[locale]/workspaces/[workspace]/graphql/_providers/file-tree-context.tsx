'use client';
import { createContext, useCallback, useContext, useState } from 'react';

export type ClipboardOperation = 'copy' | 'cut';

export interface ClipboardItem {
  id: string;
  type: 'file' | 'folder';
  operation: ClipboardOperation;
}

interface GraphqlFileTreeContextData {
  clipboard: ClipboardItem | null;
  setClipboard: (item: ClipboardItem | null) => void;
  clearClipboard: () => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
}

const GraphqlFileTreeContext = createContext<GraphqlFileTreeContextData | null>(
  null,
);

export function GraphqlFileTreeContextProvider({
  children,
}: React.PropsWithChildren) {
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const clearClipboard = useCallback(() => {
    setClipboard(null);
  }, []);

  return (
    <GraphqlFileTreeContext.Provider
      value={{
        clipboard,
        setClipboard,
        clearClipboard,
        selectedFolderId,
        setSelectedFolderId,
      }}
    >
      {children}
    </GraphqlFileTreeContext.Provider>
  );
}

export function useGraphqlFileTreeContext() {
  const context = useContext(GraphqlFileTreeContext);

  if (!context) {
    throw new Error(
      'useGraphqlFileTreeContext() must be used within a <GraphqlFileTreeContextProvider />',
    );
  }

  return context;
}
