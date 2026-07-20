'use client';

import { useCallback } from 'react';

import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { EntityHistoryProvider, useEntityHistoryContext } from '@/components/workspace/entity-history-context';

export function SseContextProvider({ children }: React.PropsWithChildren) {
  const workspace = useActiveWorkspace();
  const sse = workspace.sse;
  const listHistory = useCallback(() => sse.listHistory(), [sse]);
  const upsertHistory = useCallback((entityId: string) => sse.upsertHistory(entityId), [sse]);
  const deleteHistory = useCallback((entityId: string) => sse.deleteHistory(entityId), [sse]);

  return (
    <EntityHistoryProvider
      key={`${workspace.id}:sse`}
      scope="sse"
      listHistory={listHistory}
      upsertHistory={upsertHistory}
      deleteHistory={deleteHistory}
    >
      {children}
    </EntityHistoryProvider>
  );
}

export function useSseContext() {
  return useEntityHistoryContext();
}
