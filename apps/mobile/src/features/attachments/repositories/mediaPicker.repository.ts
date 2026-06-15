import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { AttachmentPickerPort } from '../services/coordinators/attachments.coordinator';
import type { PendingPick } from '../schemas/attachment.schema';
import { inferMime } from '../services/providers/attachmentPaths.provider';

async function fromLibrary(): Promise<PendingPick | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Photo library permission was denied.');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    mimeType: inferMime(a.fileName ?? a.uri, a.mimeType ?? undefined),
    name: a.fileName ?? null,
    size: a.fileSize ?? null,
  };
}

async function fromCamera(): Promise<PendingPick | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Camera permission was denied.');
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    mimeType: inferMime(a.fileName ?? a.uri, a.mimeType ?? undefined),
    name: a.fileName ?? null,
    size: a.fileSize ?? null,
  };
}

async function fromFiles(): Promise<PendingPick | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    mimeType: inferMime(a.name, a.mimeType ?? undefined),
    name: a.name,
    size: a.size ?? null,
  };
}

export const mediaPickerRepository: AttachmentPickerPort = {
  pick(source) {
    if (source === 'library') return fromLibrary();
    if (source === 'camera') return fromCamera();
    return fromFiles();
  },
};
