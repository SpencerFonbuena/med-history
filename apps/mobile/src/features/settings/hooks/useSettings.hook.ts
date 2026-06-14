import { useQuery } from '@tanstack/react-query';
import { makeSettingsCoordinator } from '../services/coordinators/settings.coordinator';
import { settingsRepository } from '../repositories/settings.repository';
import { settingsKeys } from '../queryKeys';

const coordinator = makeSettingsCoordinator(settingsRepository);

export function useSettings() {
  const query = useQuery({
    queryKey: settingsKeys.all,
    queryFn: async () => {
      const r = await coordinator.load();
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    staleTime: Infinity,
  });
  return {
    settings: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? (query.error as Error).message : null,
  };
}
