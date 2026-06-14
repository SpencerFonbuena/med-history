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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: settingsKeys.all });
    },
  });
  return {
    commitOnboarding: (input: { sizeLevel: SizeLevel; theme: Theme }) => mutation.mutateAsync(input),
    saving: mutation.isPending,
  };
}
