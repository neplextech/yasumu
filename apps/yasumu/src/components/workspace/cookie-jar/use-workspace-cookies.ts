'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceCookieInput } from '@yasumu/core';
import { useEffect } from 'react';

import { workspaceQueryKeys } from '@/app/[locale]/workspaces/[workspace]/_lib/workspace-query-keys';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';

export function useWorkspaceCookies() {
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const queryKey = workspaceQueryKeys.cookies(workspace.id);
  const query = useQuery({
    queryKey,
    queryFn: () => workspace.cookies.list(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 5_000,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey });

  useEffect(
    () =>
      workspace.manager.yasumu.events.on('onExecutionEvent', (_eventWorkspace, event) => {
        if (event.workspaceId === workspace.id && event.type === 'response-received') {
          void queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.cookies(workspace.id) });
        }
      }),
    [queryClient, workspace.id, workspace.manager.yasumu.events],
  );

  const upsert = useMutation({
    mutationFn: (input: WorkspaceCookieInput) => workspace.cookies.upsert(input),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (cookieId: string) => workspace.cookies.delete(cookieId),
    onSuccess: refresh,
  });
  const clear = useMutation({
    mutationFn: () => workspace.cookies.clear(),
    onSuccess: refresh,
  });

  return { ...query, upsert, remove, clear };
}
