import type { DbDriver } from '../db/driver';
import type { CoreDeps } from '../db/database';
import { createAttachmentInput, type CreateAttachmentInput, type Attachment } from '../schemas/attachment.schema';

interface AttachmentRow {
  id: string;
  entry_id: string;
  relative_path: string;
  mime_type: string;
  original_filename: string | null;
  size_bytes: number | null;
  created_at: string;
}

const toAttachment = (r: AttachmentRow): Attachment => ({
  id: r.id,
  entryId: r.entry_id,
  relativePath: r.relative_path,
  mimeType: r.mime_type,
  originalFilename: r.original_filename,
  sizeBytes: r.size_bytes,
  createdAt: r.created_at,
});

export function makeAttachmentsRepository(driver: DbDriver, deps: CoreDeps) {
  async function create(input: CreateAttachmentInput): Promise<Attachment> {
    const data = createAttachmentInput.parse(input);
    const id = deps.genId();
    const ts = deps.now();
    await driver.run(
      `INSERT INTO attachments (id, entry_id, relative_path, mime_type, original_filename, size_bytes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, data.entryId, data.relativePath, data.mimeType, data.originalFilename ?? null, data.sizeBytes ?? null, ts],
    );
    return {
      id,
      entryId: data.entryId,
      relativePath: data.relativePath,
      mimeType: data.mimeType,
      originalFilename: data.originalFilename ?? null,
      sizeBytes: data.sizeBytes ?? null,
      createdAt: ts,
    };
  }

  async function listByEntry(entryId: string): Promise<Attachment[]> {
    const rows = await driver.all<AttachmentRow>(
      'SELECT * FROM attachments WHERE entry_id = ? ORDER BY created_at ASC',
      [entryId],
    );
    return rows.map(toAttachment);
  }

  async function remove(id: string): Promise<void> {
    await driver.run('DELETE FROM attachments WHERE id = ?', [id]);
  }

  return { create, listByEntry, remove };
}
