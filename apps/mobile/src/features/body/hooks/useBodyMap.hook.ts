import { useQuery } from '@tanstack/react-query';
import { bodyMapCoordinator } from '../services/coordinators/bodyMap.coordinator.instance';
import { bodyKeys } from '../queryKeys';

export function useBodyMap(profileId: string) {
  const query = useQuery({
    queryKey: bodyKeys.map(profileId),
    queryFn: async () => {
      const r = await bodyMapCoordinator.loadMap(profileId);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    enabled: profileId.length > 0,
    staleTime: Infinity,
  });
  return {
    bodyMap: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? (query.error as Error).message : null,
  };
}
