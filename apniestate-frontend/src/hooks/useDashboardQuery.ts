import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export function useDashboardQuery<T>(endpoint: string, options = {}) {
  return useQuery<T, Error>({
    queryKey: ['dashboard', endpoint],
    queryFn: async () => {
      const res = await apiClient.get<T>(endpoint);
      if (!res.success || res.data === undefined) {
        throw new Error(res.message || 'Failed to fetch dashboard data');
      }
      return res.data;
    },
    staleTime: 5000, // 5 seconds cache fresh period
    ...options
  });
}
