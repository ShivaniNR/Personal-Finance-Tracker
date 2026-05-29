import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../services/transactions';

// Matches the web client's query key so Phase 3 mutations can invalidate it.
export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: () => getTransactions({ limit: 200 }),
  });
}
