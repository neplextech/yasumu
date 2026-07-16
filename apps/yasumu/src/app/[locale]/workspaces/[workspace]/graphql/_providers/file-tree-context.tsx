'use client';

import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { FileTreeStateProvider } from '@/components/workspace/file-tree-state-context';

export {
  useFileTreeClipboardActions,
  useFileTreeState as useGraphqlFileTreeContext,
  type ClipboardItem,
  type ClipboardOperation,
} from '@/components/workspace/file-tree-state-context';

export function GraphqlFileTreeContextProvider({ children }: React.PropsWithChildren) {
  const workspace = useActiveWorkspace();

  return <FileTreeStateProvider key={`${workspace.id}:graphql`}>{children}</FileTreeStateProvider>;
}
