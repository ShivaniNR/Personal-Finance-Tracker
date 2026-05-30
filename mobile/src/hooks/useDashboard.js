import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../services/dashboard';

export function useDashboard(startDate, endDate) {
  return useQuery({
    queryKey: ['dashboard', startDate, endDate],
    queryFn: () => getDashboard(startDate, endDate),
  });
}
