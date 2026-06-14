import { useMutation, useQueryClient } from '@tanstack/react-query';
import { makeProfilesCoordinator } from '../services/coordinators/profiles.coordinator';
import { profilesRepository } from '../repositories/profiles.repository';
import { profilesKeys } from '../queryKeys';

const coordinator = makeProfilesCoordinator(profilesRepository);

export function useDeleteProfile() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await coordinator.remove(id);
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: profilesKeys.all });
    },
  });
  return { deleteProfile: (id: string) => mutation.mutateAsync(id), deleting: mutation.isPending };
}
