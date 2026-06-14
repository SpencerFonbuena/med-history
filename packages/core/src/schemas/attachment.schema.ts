// packages/core/src/schemas/attachment.schema.ts
import { z } from 'zod';

export const createAttachmentInput = z.object({
  entryId: z.string().min(1),
  relativePath: z.string().min(1),
  mimeType: z.string().min(1),
  originalFilename: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
});
export type CreateAttachmentInput = z.infer<typeof createAttachmentInput>;

export interface Attachment {
  id: string;
  entryId: string;
  relativePath: string;
  mimeType: string;
  originalFilename: string | null;
  sizeBytes: number | null;
  createdAt: string;
}
