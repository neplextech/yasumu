import { QueryClientProvider as ReactQueryClientProvider, QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 30_000,
      gcTime: 30 * 60_000,
      retry: 2,
    },
  },
});

export function QueryClientProvider({ children }: React.PropsWithChildren) {
  return <ReactQueryClientProvider client={queryClient}>{children}</ReactQueryClientProvider>;
}
