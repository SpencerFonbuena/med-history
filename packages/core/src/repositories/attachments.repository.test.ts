import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';

describe('attachments repository', () => {
  it('stores metadata, lists by entry, and cascades on entry delete', async () => {
    const { db } = await makeTestDb();
    const p = await db.profiles.create({ name: 'P', dob: '1990-01-01', sex: 'male' });
    const e = await db.entries.create({
      profileId: p.id, regionCode: 'ribs', type: 'imaging_test', subtype: 'imaging',
      date: '2024-10-05', title: 'X-ray', body: 'no fracture', facility: 'Valley',
    });

    const a = await db.attachments.create({
      entryId: e.id,
      relativePath: `attachments/${e.id}/scan.jpg`,
      mimeType: 'image/jpeg',
      originalFilename: 'scan.jpg',
      sizeBytes: 1024,
    });
    expect(a.relativePath).toContain(e.id);

    const list = await db.attachments.listByEntry(e.id);
    expect(list).toHaveLength(1);

    await db.entries.remove(e.id);
    expect(await db.attachments.listByEntry(e.id)).toHaveLength(0); // FK cascade
  });
});
