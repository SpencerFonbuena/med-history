/** Pure helpers for attachment file paths and mime handling. No I/O. */

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
};

const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  gif: 'image/gif',
  pdf: 'application/pdf',
};

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

export function isAllowedMime(mimeType: string): boolean {
  return isImage(mimeType) || mimeType === 'application/pdf';
}

export function extFromMime(mimeType: string): string {
  return MIME_TO_EXT[mimeType] ?? 'bin';
}

export function extFromName(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

/** Best extension for a pick: the filename's, else derived from the mime. */
export function extOf(name: string | null, mimeType: string): string {
  return (name && extFromName(name)) || extFromMime(mimeType);
}

/** Best-effort mime for a pick that arrived without one (e.g. some images). */
export function inferMime(name: string, fallback: string | undefined): string {
  if (fallback) return fallback;
  return EXT_TO_MIME[extFromName(name)] ?? 'application/octet-stream';
}

export function buildRelativePath(
  profileId: string,
  entryId: string,
  fileId: string,
  ext: string,
): string {
  return `attachments/${profileId}/${entryId}/${fileId}.${ext}`;
}
