import { queryOptions } from '@tanstack/react-query';
import { Workspace } from '@yasumu/core';

export const restQueries = {
  getEntityOptions: (entityId: string | null, workspace: Workspace) =>
    queryOptions({
      queryKey: ['rest', entityId],
      queryFn: () => workspace.rest.get(entityId!),
      gcTime: 1 * 60 * 1000, // 1 minute
      enabled: !!entityId,
    }),
};
