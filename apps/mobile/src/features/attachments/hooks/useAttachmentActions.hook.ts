import { attachmentsCoordinator } from '../services/coordinators/attachments.coordinator.instance';
import type { AttachmentSource, PendingPick } from '../schemas/attachment.schema';

/** Device actions shared by staged and live attachment UIs: pick a file, open one. */
export function useAttachmentActions() {
  async function pick(source: AttachmentSource): Promise<PendingPick | null> {
    const r = await attachmentsCoordinator.pick(source);
    if (!r.ok) throw new Error(r.error);
    return r.data;
  }
  async function open(uri: string, mimeType: string): Promise<void> {
    const r = await attachmentsCoordinator.open(uri, mimeType);
    if (!r.ok) throw new Error(r.error);
  }
  return { pick, open };
}
