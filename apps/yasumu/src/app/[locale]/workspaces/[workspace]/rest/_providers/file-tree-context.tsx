'use client';

export {
  FileTreeStateProvider as FileTreeContextProvider,
  useFileTreeClipboardActions,
  useFileTreeState as useFileTreeContext,
  type ClipboardItem,
  type ClipboardOperation,
} from '@/components/workspace/file-tree-state-context';
