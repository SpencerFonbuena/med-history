import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateEntryInput } from '@med-history/core';
import { entriesCoordinator } from '../services/coordinators/entries.coordinator.instance';
import { entriesKeys } from '../queryKeys';

export function useUpdateEntry() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateEntryInput }) => {
      const r = await entriesCoordinator.update(id, input);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: entriesKeys.all });
    },
  });
  return {
    updateEntry: (id: string, input: UpdateEntryInput) => mutation.mutateAsync({ id, input }),
    saving: mutation.isPending,
  };
}
