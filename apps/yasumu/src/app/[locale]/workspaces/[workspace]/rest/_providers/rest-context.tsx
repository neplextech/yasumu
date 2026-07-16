'use client';

import { useCallback } from 'react';

import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { EntityHistoryProvider, useEntityHistoryContext } from '@/components/workspace/entity-history-context';

export function RestContextProvider({ children }: React.PropsWithChildren) {
  const workspace = useActiveWorkspace();
  const listHistory = useCallback(() => workspace.rest.listHistory(), [workspace.rest]);
  const upsertHistory = useCallback((entityId: string) => workspace.rest.upsertHistory(entityId), [workspace.rest]);
  const deleteHistory = useCallback((entityId: string) => workspace.rest.deleteHistory(entityId), [workspace.rest]);

  return (
    <EntityHistoryProvider
      key={`${workspace.id}:rest`}
      scope="rest"
      listHistory={listHistory}
      upsertHistory={upsertHistory}
      deleteHistory={deleteHistory}
    >
      {children}
    </EntityHistoryProvider>
  );
}

export function useRestContext() {
  return useEntityHistoryContext();
}
