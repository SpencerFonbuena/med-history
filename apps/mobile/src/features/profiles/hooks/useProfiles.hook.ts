import { useQuery } from '@tanstack/react-query';
import { profilesCoordinator } from '../services/coordinators/profiles.coordinator.instance';
import { profilesKeys } from '../queryKeys';

export function useProfiles() {
  const query = useQuery({
    queryKey: profilesKeys.all,
    queryFn: async () => {
      const r = await profilesCoordinator.loadAll();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    staleTime: Infinity,
  });
  return {
    profiles: query.data ?? [],
    loading: query.isLoading,
    error: query.isError ? (query.error as Error).message : null,
  };
}
