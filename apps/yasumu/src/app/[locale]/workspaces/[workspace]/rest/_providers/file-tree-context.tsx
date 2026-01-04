'use client';
import { createContext, useCallback, useContext, useState } from 'react';

export type ClipboardOperation = 'copy' | 'cut';

export interface ClipboardItem {
  id: string;
  type: 'file' | 'folder';
  operation: ClipboardOperation;
}

interface FileTreeContextData {
  clipboard: ClipboardItem | null;
  setClipboard: (item: ClipboardItem | null) => void;
  clearClipboard: () => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
}

const FileTreeContext = createContext<FileTreeContextData | null>(null);

export function FileTreeContextProvider({ children }: React.PropsWithChildren) {
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const clearClipboard = useCallback(() => {
    setClipboard(null);
  }, []);

  return (
    <FileTreeContext.Provider
      value={{
        clipboard,
        setClipboard,
        clearClipboard,
        selectedFolderId,
        setSelectedFolderId,
      }}
    >
      {children}
    </FileTreeContext.Provider>
  );
}

export function useFileTreeContext() {
  const context = useContext(FileTreeContext);

  if (!context) {
    throw new Error(
      'useFileTreeContext() must be used within a <FileTreeContextProvider />',
    );
  }

  return context;
}
