import { attachmentsCoordinator } from '../services/coordinators/attachments.coordinator.instance';
import type { PendingPick } from '../schemas/attachment.schema';

/** Persists staged picks against a freshly-created entry. Returns how many failed. */
export function useCommitStagedAttachments() {
  async function commit(profileId: string, entryId: string, picks: PendingPick[]): Promise<{ failures: number }> {
    let failures = 0;
    for (const pick of picks) {
      const r = await attachmentsCoordinator.add(profileId, entryId, pick);
      if (!r.ok) failures += 1;
    }
    return { failures };
  }
  return { commit };
}
