import { useQuery } from '@tanstack/react-query';
import { entriesCoordinator } from '../services/coordinators/entries.coordinator.instance';
import { entriesKeys } from '../queryKeys';

export function useEntry(id: string) {
  const query = useQuery({
    queryKey: entriesKeys.detail(id),
    queryFn: async () => {
      const r = await entriesCoordinator.get(id);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    enabled: id.length > 0,
    staleTime: Infinity,
  });
  return {
    entry: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? (query.error as Error).message : null,
  };
}
