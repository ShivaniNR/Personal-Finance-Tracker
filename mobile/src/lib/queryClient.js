import { QueryClient } from '@tanstack/react-query';

// Mirror the web client's React Query config (30s staleTime).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
});
