import type { Attachment } from '@med-history/core';

/** Source the user picks an attachment from. */
export type AttachmentSource = 'library' | 'camera' | 'files';

/** A picked-but-not-yet-persisted file (from a picker). mimeType is always resolved. */
export interface PendingPick {
  uri: string;
  mimeType: string;
  name: string | null;
  size: number | null;
}

/** A persisted attachment enriched for display. */
export type AttachmentView = Attachment & {
  uri: string;
  isImage: boolean;
};
