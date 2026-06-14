import { useQuery } from '@tanstack/react-query';
import { makeProfilesCoordinator } from '../services/coordinators/profiles.coordinator';
import { profilesRepository } from '../repositories/profiles.repository';
import { profilesKeys } from '../queryKeys';

const coordinator = makeProfilesCoordinator(profilesRepository);

export function useProfiles() {
  const query = useQuery({
    queryKey: profilesKeys.all,
    queryFn: async () => {
      const r = await coordinator.loadAll();
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
