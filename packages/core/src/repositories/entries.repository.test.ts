import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';

async function seedProfile(db: Awaited<ReturnType<typeof makeTestDb>>['db']) {
  return db.profiles.create({ name: 'P', dob: '1990-01-01', sex: 'male' });
}

describe('entries repository', () => {
  it('creates an entry with extras and round-trips details JSON', async () => {
    const { db } = await makeTestDb();
    const p = await seedProfile(db);
    const e = await db.entries.create({
      profileId: p.id,
      regionCode: 'knee-right',
      type: 'visit',
      date: '2026-02-18',
      title: 'Ortho',
      body: 'knee pain',
      doctor: 'Dr. Park',
      diagnosis: 'Tendinopathy',
      details: { followUpWeeks: 6 },
    });
    expect(e.id).toBe('id-2'); // id-1 was the profile
    expect(e.regionCode).toBe('knee-right');
    expect(e.details).toEqual({ followUpWeeks: 6 });

    const fetched = await db.entries.get(e.id);
    expect(fetched?.doctor).toBe('Dr. Park');
    expect(fetched?.details).toEqual({ followUpWeeks: 6 });
  });

  it('lists by region + type, newest first', async () => {
    const { db, deps } = await makeTestDb();
    const p = await seedProfile(db);
    await db.entries.create({ profileId: p.id, regionCode: 'knee-right', type: 'note', date: '2026-01-01', title: 'old', body: 'b' });
    deps.advance(1000);
    await db.entries.create({ profileId: p.id, regionCode: 'knee-right', type: 'note', date: '2026-03-01', title: 'new', body: 'b' });

    const notes = await db.entries.listByRegion(p.id, 'knee-right', 'note');
    expect(notes.map((n) => n.title)).toEqual(['new', 'old']);
  });

  it('supports region-less General entries', async () => {
    const { db } = await makeTestDb();
    const p = await seedProfile(db);
    await db.entries.create({ profileId: p.id, regionCode: null, type: 'prescription', date: '2026-01-01', title: 'Flu shot', body: 'b' });
    const general = await db.entries.listGeneral(p.id, 'prescription');
    expect(general).toHaveLength(1);
  });

  it('returns per-region counts including a null (General) bucket', async () => {
    const { db } = await makeTestDb();
    const p = await seedProfile(db);
    await db.entries.create({ profileId: p.id, regionCode: 'knee-right', type: 'note', date: '2026-01-01', title: 'a', body: 'b' });
    await db.entries.create({ profileId: p.id, regionCode: 'knee-right', type: 'visit', date: '2026-01-02', title: 'c', body: 'b' });
    await db.entries.create({ profileId: p.id, regionCode: null, type: 'note', date: '2026-01-03', title: 'g', body: 'b' });

    const counts = await db.entries.countsByRegion(p.id);
    expect(counts.get('knee-right')).toBe(2);
    expect(counts.get(null)).toBe(1);
  });
});
