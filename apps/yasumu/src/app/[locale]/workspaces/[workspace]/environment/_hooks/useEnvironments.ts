import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Environment } from '@yasumu/core';
import { useCallback } from 'react';

import { useActiveWorkspace } from '@/components/providers/workspace-provider';

import { workspaceQueryKeys } from '../../_lib/workspace-query-keys';

export function useEnvironments() {
  const workspace = useActiveWorkspace();

  return useQuery({
    queryKey: workspaceQueryKeys.environments(workspace.id),
    queryFn: () => workspace.environments.list(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always' as const,
  });
}

export function useActiveEnvironment() {
  const workspace = useActiveWorkspace();

  return useQuery({
    queryKey: workspaceQueryKeys.activeEnvironment(workspace.id),
    queryFn: () => workspace.environments.getActiveEnvironment(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always' as const,
  });
}

export function useUpdateEnvironments() {
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();
  const workspaceId = workspace.id;

  return useCallback(
    async (newEnvironments: Array<Environment>) => {
      const queryKey = workspaceQueryKeys.environments(workspaceId);
      await queryClient.cancelQueries({
        queryKey,
      });
      const environments = queryClient.getQueryData<Array<Environment>>(queryKey) || [];
      queryClient.setQueryData(queryKey, newEnvironments);
      return environments;
    },
    [queryClient, workspaceId],
  );
}
