import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attachmentsCoordinator } from '@/features/attachments/services/coordinators/attachments.coordinator.instance';
import { profilesCoordinator } from '../services/coordinators/profiles.coordinator.instance';
import { profilesKeys } from '../queryKeys';

export function useDeleteProfile() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      // Remove the profile's entire attachment folder, then the profile row (cascades entries + attachment rows).
      await attachmentsCoordinator.removeForProfile(id);
      const r = await profilesCoordinator.remove(id);
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: profilesKeys.all });
    },
  });
  return { deleteProfile: (id: string) => mutation.mutateAsync(id), deleting: mutation.isPending };
}
