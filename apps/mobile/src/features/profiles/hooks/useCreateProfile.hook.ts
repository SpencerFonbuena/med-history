import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateProfileInput } from '@med-history/core';
import { makeProfilesCoordinator } from '../services/coordinators/profiles.coordinator';
import { profilesRepository } from '../repositories/profiles.repository';
import { profilesKeys } from '../queryKeys';

const coordinator = makeProfilesCoordinator(profilesRepository);

export function useCreateProfile() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: CreateProfileInput) => {
      const r = await coordinator.create(input);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    // Await the refetch so callers that navigate after creating see the fresh list.
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: profilesKeys.all });
    },
  });
  return { createProfile: (input: CreateProfileInput) => mutation.mutateAsync(input), saving: mutation.isPending };
}
