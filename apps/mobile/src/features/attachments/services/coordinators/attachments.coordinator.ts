import type { Attachment, CreateAttachmentInput } from '@med-history/core';
import { ok, err, type Result } from '@/lib/result';
import type { AttachmentSource, AttachmentView, PendingPick } from '../../schemas/attachment.schema';
import { isAllowedMime, isImage, extOf } from '../providers/attachmentPaths.provider';

export interface AttachmentFilesPort {
  save(profileId: string, entryId: string, fileId: string, ext: string, sourceUri: string): Promise<{ relativePath: string; sizeBytes: number | null }>;
  resolveUri(relativePath: string): string;
  deleteFile(relativePath: string): Promise<void>;
  deleteEntryDir(profileId: string, entryId: string): Promise<void>;
  deleteProfileDir(profileId: string): Promise<void>;
  open(uri: string, mimeType: string): Promise<void>;
}

export interface AttachmentPickerPort {
  pick(source: AttachmentSource): Promise<PendingPick | null>;
}

export interface AttachmentMetaPort {
  create(input: CreateAttachmentInput): Promise<Attachment>;
  listByEntry(entryId: string): Promise<Attachment[]>;
  remove(id: string): Promise<void>;
}

export interface AttachmentDeps {
  files: AttachmentFilesPort;
  picker: AttachmentPickerPort;
  meta: AttachmentMetaPort;
  genId: () => string;
}

export function makeAttachmentsCoordinator({ files, picker, meta, genId }: AttachmentDeps) {
  async function pick(source: AttachmentSource): Promise<Result<PendingPick | null>> {
    try {
      return ok(await picker.pick(source));
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function add(profileId: string, entryId: string, picked: PendingPick): Promise<Result<Attachment>> {
    if (!isAllowedMime(picked.mimeType)) return err('Only images and PDFs can be attached.');
    const fileId = genId();
    const ext = extOf(picked.name, picked.mimeType);
    let saved: { relativePath: string; sizeBytes: number | null };
    try {
      saved = await files.save(profileId, entryId, fileId, ext, picked.uri);
    } catch (e) {
      return err((e as Error).message);
    }
    try {
      const row = await meta.create({
        entryId,
        relativePath: saved.relativePath,
        mimeType: picked.mimeType,
        originalFilename: picked.name ?? undefined,
        sizeBytes: saved.sizeBytes ?? undefined,
      });
      return ok(row);
    } catch (e) {
      await files.deleteFile(saved.relativePath); // compensate — no orphan files
      return err((e as Error).message);
    }
  }

  async function listByEntry(entryId: string): Promise<Result<AttachmentView[]>> {
    try {
      const rows = await meta.listByEntry(entryId);
      return ok(rows.map((r) => ({ ...r, uri: files.resolveUri(r.relativePath), isImage: isImage(r.mimeType) })));
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function remove(attachment: Attachment): Promise<Result<void>> {
    try {
      await meta.remove(attachment.id);
      await files.deleteFile(attachment.relativePath);
      return ok(undefined);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function removeForEntry(profileId: string, entryId: string): Promise<Result<void>> {
    try {
      await files.deleteEntryDir(profileId, entryId);
      return ok(undefined);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function removeForProfile(profileId: string): Promise<Result<void>> {
    try {
      await files.deleteProfileDir(profileId);
      return ok(undefined);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function open(uri: string, mimeType: string): Promise<Result<void>> {
    try {
      await files.open(uri, mimeType);
      return ok(undefined);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  return { pick, add, listByEntry, remove, removeForEntry, removeForProfile, open };
}
