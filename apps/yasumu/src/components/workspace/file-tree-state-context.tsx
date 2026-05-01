'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

export type ClipboardOperation = 'copy' | 'cut';

export interface ClipboardItem {
  id: string;
  type: 'file' | 'folder';
  operation: ClipboardOperation;
}

interface FileTreeStateContextData {
  clipboard: ClipboardItem | null;
  setClipboard: (item: ClipboardItem | null) => void;
  clearClipboard: () => void;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
}

const FileTreeStateContext = createContext<FileTreeStateContextData | null>(
  null,
);

export function FileTreeStateProvider({ children }: React.PropsWithChildren) {
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const clearClipboard = useCallback(() => {
    setClipboard(null);
  }, []);

  const value = useMemo(
    () => ({
      clipboard,
      setClipboard,
      clearClipboard,
      selectedFolderId,
      setSelectedFolderId,
    }),
    [clearClipboard, clipboard, selectedFolderId],
  );

  return (
    <FileTreeStateContext.Provider value={value}>
      {children}
    </FileTreeStateContext.Provider>
  );
}

export function useFileTreeState() {
  const context = useContext(FileTreeStateContext);

  if (!context) {
    throw new Error(
      'useFileTreeState() must be used within a <FileTreeStateProvider />',
    );
  }

  return context;
}

export function useFileTreeClipboardActions() {
  const { setClipboard } = useFileTreeState();

  return useMemo(
    () => ({
      handleFileCopy: (id: string) =>
        setClipboard({ id, type: 'file', operation: 'copy' }),
      handleFolderCopy: (id: string) =>
        setClipboard({ id, type: 'folder', operation: 'copy' }),
      handleFileCut: (id: string) =>
        setClipboard({ id, type: 'file', operation: 'cut' }),
      handleFolderCut: (id: string) =>
        setClipboard({ id, type: 'folder', operation: 'cut' }),
    }),
    [setClipboard],
  );
}
