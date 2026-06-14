import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Theme } from '@med-history/core';
import type { SizeLevel } from '@/constants/appearance';
import { makeSettingsCoordinator } from '../services/coordinators/settings.coordinator';
import { settingsRepository } from '../repositories/settings.repository';
import { settingsKeys } from '../queryKeys';

const coordinator = makeSettingsCoordinator(settingsRepository);

export function useUpdateAppearance() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: { sizeLevel: SizeLevel; theme: Theme }) => {
      const r = await coordinator.commitOnboarding(input);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    // Await the refetch so mutateAsync does not resolve until the settings cache
    // reflects the new values (onboardingDone=true). Otherwise the onboarding gate
    // reads stale data after navigation and bounces back to onboarding.
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
  return {
    commitOnboarding: (input: { sizeLevel: SizeLevel; theme: Theme }) => mutation.mutateAsync(input),
    saving: mutation.isPending,
  };
}
