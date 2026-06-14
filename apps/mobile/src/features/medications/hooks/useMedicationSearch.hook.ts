import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { medicationSearchCoordinator } from '../services/coordinators/medicationSearch.coordinator.instance';
import { medicationKeys } from '../queryKeys';
import { useDebouncedValue } from './useDebouncedValue.hook';

export function useMedicationSearch(query: string) {
  const seed = useQuery({
    queryKey: medicationKeys.seed,
    queryFn: async () => {
      const r = await medicationSearchCoordinator.ensureSeeded();
      if (!r.ok) throw new Error(r.error);
      return true;
    },
    staleTime: Infinity,
  });

  const debounced = useDebouncedValue(query, 200);

  const results = useQuery({
    queryKey: medicationKeys.search(debounced),
    queryFn: async () => {
      const r = await medicationSearchCoordinator.search(debounced);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    enabled: seed.isSuccess && debounced.trim().length > 0,
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });

  return {
    results: results.data ?? [],
    seeding: seed.isLoading,
    searching: results.isFetching,
    error: seed.isError ? (seed.error as Error).message : results.isError ? (results.error as Error).message : null,
  };
}
