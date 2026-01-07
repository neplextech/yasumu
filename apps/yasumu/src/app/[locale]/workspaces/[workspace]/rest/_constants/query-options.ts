import { queryOptions } from '@tanstack/react-query';

export const restQueryOptions = {
  environments: () =>
    queryOptions({
      queryKey: ['environments'],
    }),
};
