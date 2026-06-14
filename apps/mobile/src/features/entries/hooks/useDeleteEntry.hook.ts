import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bodyKeys } from '@/features/body/queryKeys';
import { entriesCoordinator } from '../services/coordinators/entries.coordinator.instance';
import { entriesKeys } from '../queryKeys';

export function useDeleteEntry() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await entriesCoordinator.remove(id);
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: entriesKeys.all });
      await qc.invalidateQueries({ queryKey: bodyKeys.all });
    },
  });
  return { deleteEntry: (id: string) => mutation.mutateAsync(id), deleting: mutation.isPending };
}
