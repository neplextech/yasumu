'use client';

import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { FileTreeStateProvider } from '@/components/workspace/file-tree-state-context';

export {
  useFileTreeClipboardActions,
  useFileTreeState as useSseFileTreeContext,
} from '@/components/workspace/file-tree-state-context';

export function SseFileTreeContextProvider({ children }: React.PropsWithChildren) {
  const workspace = useActiveWorkspace();
  return <FileTreeStateProvider key={`${workspace.id}:sse`}>{children}</FileTreeStateProvider>;
}
