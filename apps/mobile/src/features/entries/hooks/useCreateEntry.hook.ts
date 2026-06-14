import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateEntryInput } from '@med-history/core';
import { bodyKeys } from '@/features/body/queryKeys';
import { entriesCoordinator } from '../services/coordinators/entries.coordinator.instance';
import { entriesKeys } from '../queryKeys';

export function useCreateEntry() {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (input: CreateEntryInput) => {
      const r = await entriesCoordinator.create(input);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: entriesKeys.all });
      await qc.invalidateQueries({ queryKey: bodyKeys.all });
    },
  });
  return { createEntry: (input: CreateEntryInput) => mutation.mutateAsync(input), saving: mutation.isPending };
}
