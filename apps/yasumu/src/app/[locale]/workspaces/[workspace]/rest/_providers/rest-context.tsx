'use client';

import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { EntityHistoryProvider, useEntityHistoryContext } from '@/components/workspace/entity-history-context';

export function RestContextProvider({ children }: React.PropsWithChildren) {
  const workspace = useActiveWorkspace();

  return (
    <EntityHistoryProvider
      scope="rest"
      listHistory={() => workspace.rest.listHistory()}
      upsertHistory={(entityId) => workspace.rest.upsertHistory(entityId)}
      deleteHistory={(entityId) => workspace.rest.deleteHistory(entityId)}
    >
      {children}
    </EntityHistoryProvider>
  );
}

export function useRestContext() {
  return useEntityHistoryContext();
}
