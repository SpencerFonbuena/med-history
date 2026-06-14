import { useQuery } from '@tanstack/react-query';
import type { EntryType } from '@med-history/core';
import { regionParamToCode } from '@/features/body/utils/regionParam';
import { entriesCoordinator } from '../services/coordinators/entries.coordinator.instance';
import { entriesKeys } from '../queryKeys';

export function useRegionEntries(profileId: string, code: string, type: EntryType) {
  const query = useQuery({
    queryKey: entriesKeys.list(profileId, code, type),
    queryFn: async () => {
      const r = await entriesCoordinator.list(profileId, regionParamToCode(code), type);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    enabled: profileId.length > 0,
    staleTime: Infinity,
  });
  return {
    entries: query.data ?? [],
    loading: query.isLoading,
    error: query.isError ? (query.error as Error).message : null,
  };
}
