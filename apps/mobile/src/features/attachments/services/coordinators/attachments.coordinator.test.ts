import { describe, it, expect } from 'vitest';
import { makeAttachmentsCoordinator, type AttachmentFilesPort, type AttachmentMetaPort, type AttachmentPickerPort } from './attachments.coordinator';
import type { Attachment } from '@med-history/core';
import type { PendingPick } from '../../schemas/attachment.schema';

function fakeFiles(over: Partial<AttachmentFilesPort> = {}) {
  const saved = new Set<string>();
  const port: AttachmentFilesPort = {
    save: async (profileId, entryId, fileId, ext) => {
      const relativePath = `attachments/${profileId}/${entryId}/${fileId}.${ext}`;
      saved.add(relativePath);
      return { relativePath, sizeBytes: 10 };
    },
    resolveUri: (rel) => `file:///docs/${rel}`,
    deleteFile: async (rel) => { saved.delete(rel); },
    deleteEntryDir: async () => {},
    deleteProfileDir: async () => {},
    open: async () => {},
    ...over,
  };
  return { port, saved };
}

function fakeMeta(over: Partial<AttachmentMetaPort> = {}) {
  let n = 0;
  const rows: Attachment[] = [];
  const port: AttachmentMetaPort = {
    create: async (input) => {
      const row: Attachment = {
        id: `a${++n}`,
        entryId: input.entryId,
        relativePath: input.relativePath,
        mimeType: input.mimeType,
        originalFilename: input.originalFilename ?? null,
        sizeBytes: input.sizeBytes ?? null,
        createdAt: 't',
      };
      rows.push(row);
      return row;
    },
    listByEntry: async (entryId) => rows.filter((r) => r.entryId === entryId),
    remove: async (id) => { const i = rows.findIndex((r) => r.id === id); if (i >= 0) rows.splice(i, 1); },
    ...over,
  };
  return { port, rows };
}

const fakePicker: AttachmentPickerPort = { pick: async () => null };
const pick: PendingPick = { uri: 'file:///cache/x.jpg', mimeType: 'image/jpeg', name: 'x.jpg', size: 10 };
const deps = (files: AttachmentFilesPort, meta: AttachmentMetaPort) => {
  let i = 0;
  return makeAttachmentsCoordinator({ files, meta, picker: fakePicker, genId: () => `f${++i}` });
};

describe('attachments coordinator', () => {
  it('add saves the file then records the row', async () => {
    const f = fakeFiles();
    const m = fakeMeta();
    const r = await deps(f.port, m.port).add('p1', 'e1', pick);
    expect(r.ok).toBe(true);
    expect(m.rows).toHaveLength(1);
    expect(m.rows[0].relativePath).toBe('attachments/p1/e1/f1.jpg');
    expect(f.saved.has('attachments/p1/e1/f1.jpg')).toBe(true);
  });

  it('add rejects an unsupported mime without writing anything', async () => {
    const f = fakeFiles();
    const m = fakeMeta();
    const r = await deps(f.port, m.port).add('p1', 'e1', { ...pick, mimeType: 'text/plain' });
    expect(r.ok).toBe(false);
    expect(f.saved.size).toBe(0);
    expect(m.rows).toHaveLength(0);
  });

  it('add deletes the saved file if the row insert fails', async () => {
    const f = fakeFiles();
    const m = fakeMeta({ create: async () => { throw new Error('db fail'); } });
    const r = await deps(f.port, m.port).add('p1', 'e1', pick);
    expect(r.ok).toBe(false);
    expect(f.saved.size).toBe(0); // compensated
  });

  it('listByEntry maps rows to views with uri and isImage', async () => {
    const f = fakeFiles();
    const m = fakeMeta();
    const c = deps(f.port, m.port);
    await c.add('p1', 'e1', pick);
    const r = await c.listByEntry('e1');
    expect(r.ok && r.data[0].uri).toBe('file:///docs/attachments/p1/e1/f1.jpg');
    expect(r.ok && r.data[0].isImage).toBe(true);
  });

  it('remove deletes the row and the file', async () => {
    const f = fakeFiles();
    const m = fakeMeta();
    const c = deps(f.port, m.port);
    await c.add('p1', 'e1', pick);
    const row = m.rows[0];
    const r = await c.remove(row);
    expect(r.ok).toBe(true);
    expect(m.rows).toHaveLength(0);
    expect(f.saved.size).toBe(0);
  });

  it('removeForEntry and removeForProfile delegate to the file ports', async () => {
    let entryDir = '';
    let profileDir = '';
    const f = fakeFiles({
      deleteEntryDir: async (p, e) => { entryDir = `${p}/${e}`; },
      deleteProfileDir: async (p) => { profileDir = p; },
    });
    const c = deps(f.port, fakeMeta().port);
    await c.removeForEntry('p1', 'e1');
    await c.removeForProfile('p1');
    expect(entryDir).toBe('p1/e1');
    expect(profileDir).toBe('p1');
  });
});
