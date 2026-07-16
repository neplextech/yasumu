'use client';

import { useCallback } from 'react';

import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { EntityHistoryProvider, useEntityHistoryContext } from '@/components/workspace/entity-history-context';

export function GraphqlContextProvider({ children }: React.PropsWithChildren) {
  const workspace = useActiveWorkspace();
  const graphql = workspace.graphql;
  const listHistory = useCallback(() => graphql?.listHistory?.() ?? Promise.resolve([]), [graphql]);
  const upsertHistory = useCallback(
    (entityId: string) => graphql?.upsertHistory?.(entityId) ?? Promise.resolve(),
    [graphql],
  );
  const deleteHistory = useCallback(
    (entityId: string) => graphql?.deleteHistory?.(entityId) ?? Promise.resolve(),
    [graphql],
  );

  return (
    <EntityHistoryProvider
      key={`${workspace.id}:graphql`}
      scope="graphql"
      listHistory={listHistory}
      upsertHistory={upsertHistory}
      deleteHistory={deleteHistory}
    >
      {children}
    </EntityHistoryProvider>
  );
}

export function useGraphqlContext() {
  return useEntityHistoryContext();
}
