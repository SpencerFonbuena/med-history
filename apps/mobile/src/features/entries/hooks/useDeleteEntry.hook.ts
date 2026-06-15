import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bodyKeys } from '@/features/body/queryKeys';
import { attachmentsCoordinator } from '@/features/attachments/services/coordinators/attachments.coordinator.instance';
import { entriesCoordinator } from '../services/coordinators/entries.coordinator.instance';
import { entriesKeys } from '../queryKeys';

export function useDeleteEntry() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (entry: { id: string; profileId: string }) => {
      // Files first (idempotent), then the DB row (which cascades attachment rows).
      await attachmentsCoordinator.removeForEntry(entry.profileId, entry.id);
      const r = await entriesCoordinator.remove(entry.id);
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: entriesKeys.all });
      await qc.invalidateQueries({ queryKey: bodyKeys.all });
    },
  });
  return {
    deleteEntry: (entry: { id: string; profileId: string }) => mutation.mutateAsync(entry),
    deleting: mutation.isPending,
  };
}
