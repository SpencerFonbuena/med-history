import { getDatabase } from '@/lib/db/database';
import type { AttachmentMetaPort } from '../services/coordinators/attachments.coordinator';

/** Device-backed metadata port: thin 1:1 delegation to core's attachments repo. */
export const attachmentsMetaRepository: AttachmentMetaPort = {
  async create(input) {
    return (await getDatabase()).attachments.create(input);
  },
  async listByEntry(entryId) {
    return (await getDatabase()).attachments.listByEntry(entryId);
  },
  async remove(id) {
    return (await getDatabase()).attachments.remove(id);
  },
};
