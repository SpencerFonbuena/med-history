import { File, Directory, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { AttachmentFilesPort } from '../services/coordinators/attachments.coordinator';

/** Device file storage for attachments, under <documentDir>/attachments/{profileId}/{entryId}/. */
export const attachmentFilesRepository: AttachmentFilesPort = {
  async save(profileId, entryId, fileId, ext, sourceUri) {
    const dir = new Directory(Paths.document, 'attachments', profileId, entryId);
    if (!dir.exists) dir.create({ intermediates: true });
    const dest = new File(dir, `${fileId}.${ext}`);
    new File(sourceUri).copy(dest);
    return {
      relativePath: `attachments/${profileId}/${entryId}/${fileId}.${ext}`,
      sizeBytes: dest.size > 0 ? dest.size : null,
    };
  },

  resolveUri(relativePath) {
    return new File(Paths.document, ...relativePath.split('/')).uri;
  },

  async deleteFile(relativePath) {
    const file = new File(Paths.document, ...relativePath.split('/'));
    if (file.exists) file.delete();
  },

  async deleteEntryDir(profileId, entryId) {
    const dir = new Directory(Paths.document, 'attachments', profileId, entryId);
    if (dir.exists) dir.delete();
  },

  async deleteProfileDir(profileId) {
    const dir = new Directory(Paths.document, 'attachments', profileId);
    if (dir.exists) dir.delete();
  },

  async open(uri, mimeType) {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType });
    }
  },
};
