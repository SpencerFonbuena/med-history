import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Attachment } from '@med-history/core';
import { attachmentsCoordinator } from '../services/coordinators/attachments.coordinator.instance';
import { attachmentKeys } from '../queryKeys';
import type { PendingPick } from '../schemas/attachment.schema';

export function useEntryAttachments(profileId: string, entryId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: attachmentKeys.byEntry(entryId) });

  const query = useQuery({
    queryKey: attachmentKeys.byEntry(entryId),
    queryFn: async () => {
      const r = await attachmentsCoordinator.listByEntry(entryId);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    enabled: entryId.length > 0,
    staleTime: Infinity,
  });

  const addM = useMutation({
    mutationFn: async (pick: PendingPick) => {
      const r = await attachmentsCoordinator.add(profileId, entryId, pick);
      if (!r.ok) throw new Error(r.error);
      return r.data;
    },
    onSuccess: invalidate,
  });

  const removeM = useMutation({
    mutationFn: async (attachment: Attachment) => {
      const r = await attachmentsCoordinator.remove(attachment);
      if (!r.ok) throw new Error(r.error);
    },
    onSuccess: invalidate,
  });

  return {
    attachments: query.data ?? [],
    loading: query.isLoading,
    error: query.isError ? (query.error as Error).message : null,
    add: (pick: PendingPick) => addM.mutateAsync(pick),
    remove: (attachment: Attachment) => removeM.mutateAsync(attachment),
    busy: addM.isPending || removeM.isPending,
  };
}
