import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesCoordinator } from '../services/coordinators/profiles.coordinator.instance';
import { profilesKeys } from '../queryKeys';

export function useDeleteProfile() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await profilesCoordinator.remove(id);
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: profilesKeys.all });
    },
  });
  return { deleteProfile: (id: string) => mutation.mutateAsync(id), deleting: mutation.isPending };
}
