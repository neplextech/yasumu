'use client';

import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { FileTreeStateProvider } from '@/components/workspace/file-tree-state-context';

export {
  useFileTreeClipboardActions,
  useFileTreeState as useFileTreeContext,
  type ClipboardItem,
  type ClipboardOperation,
} from '@/components/workspace/file-tree-state-context';

export function FileTreeContextProvider({ children }: React.PropsWithChildren) {
  const workspace = useActiveWorkspace();

  return <FileTreeStateProvider key={`${workspace.id}:rest`}>{children}</FileTreeStateProvider>;
}
