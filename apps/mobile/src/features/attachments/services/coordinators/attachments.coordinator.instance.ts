import * as Crypto from 'expo-crypto';
import { makeAttachmentsCoordinator } from './attachments.coordinator';
import { attachmentFilesRepository } from '../../repositories/attachmentFiles.repository';
import { mediaPickerRepository } from '../../repositories/mediaPicker.repository';
import { attachmentsMetaRepository } from '../../repositories/attachmentsMeta.repository';

/** App-wide attachments coordinator wired to device-backed repositories. */
export const attachmentsCoordinator = makeAttachmentsCoordinator({
  files: attachmentFilesRepository,
  picker: mediaPickerRepository,
  meta: attachmentsMetaRepository,
  genId: () => Crypto.randomUUID(),
});
