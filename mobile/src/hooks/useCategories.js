import { useQuery } from '@tanstack/react-query';
import { getUserCategories } from '../services/categories';

export function useCategories() {
  return useQuery({
    queryKey: ['userCategories'],
    queryFn: getUserCategories,
  });
}
