import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Theme } from '@med-history/core';
import type { SizeLevel } from '@/constants/appearance';
import { makeSettingsCoordinator } from '../services/coordinators/settings.coordinator';
import { settingsRepository } from '../repositories/settings.repository';
import { settingsKeys } from '../queryKeys';

const coordinator = makeSettingsCoordinator(settingsRepository);

export function useUpdateAppearance() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: settingsKeys.all });

  const onboardingMutation = useMutation({
    mutationFn: async (input: { sizeLevel: SizeLevel; theme: Theme }) => {
      const r = await coordinator.commitOnboarding(input);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    // Await the refetch so mutateAsync does not resolve until the settings cache
    // reflects the new values (onboardingDone=true). Otherwise the onboarding gate
    // reads stale data after navigation and bounces back to onboarding.
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { sizeLevel: SizeLevel; theme: Theme }) => {
      const r = await coordinator.updateAppearance(input);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: invalidate,
  });

  return {
    commitOnboarding: (input: { sizeLevel: SizeLevel; theme: Theme }) => onboardingMutation.mutateAsync(input),
    update: (input: { sizeLevel: SizeLevel; theme: Theme }) => updateMutation.mutateAsync(input),
    saving: onboardingMutation.isPending || updateMutation.isPending,
  };
}
