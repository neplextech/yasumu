'use client';

import {
  EntityHistoryProvider,
  useEntityHistoryContext,
} from '@/components/workspace/entity-history-context';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';

export function GraphqlContextProvider({ children }: React.PropsWithChildren) {
  const workspace = useActiveWorkspace();
  const graphql = workspace.graphql;

  return (
    <EntityHistoryProvider
      scope="graphql"
      listHistory={() => graphql?.listHistory?.() ?? Promise.resolve([])}
      upsertHistory={(entityId) =>
        graphql?.upsertHistory?.(entityId) ?? Promise.resolve()
      }
      deleteHistory={(entityId) =>
        graphql?.deleteHistory?.(entityId) ?? Promise.resolve()
      }
    >
      {children}
    </EntityHistoryProvider>
  );
}

export function useGraphqlContext() {
  return useEntityHistoryContext();
}
