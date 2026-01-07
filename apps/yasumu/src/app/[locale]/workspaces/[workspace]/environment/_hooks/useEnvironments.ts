import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useActiveWorkspace } from '@/components/providers/workspace-provider';
import { Environment } from '@yasumu/core';
import { useCallback } from 'react';

const QUERY_KEY = ['environments'] as const;

export function useEnvironments() {
  const workspace = useActiveWorkspace();

  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => workspace.environments.list(),
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always' as const,
  });
}

export function useUpdateEnvironments() {
  const workspace = useActiveWorkspace();
  const queryClient = useQueryClient();

  return useCallback(
    async (newEnvironments: Array<Environment>) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEY,
      });
      const environments =
        (await queryClient.getQueryData<Array<Environment>>(QUERY_KEY)) || [];
      await queryClient.setQueryData(QUERY_KEY, newEnvironments);
      return environments;
    },
    [queryClient, workspace],
  );
}
