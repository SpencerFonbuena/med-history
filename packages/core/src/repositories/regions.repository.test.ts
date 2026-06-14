import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';

describe('regions repository', () => {
  it('lists all seeded regions and filters by zone', async () => {
    const { db } = await makeTestDb();
    const all = await db.regions.list();
    expect(all).toHaveLength(40);

    const legs = await db.regions.listByZone('leg');
    expect(legs.every((r) => r.zone === 'leg')).toBe(true);
    expect(legs.find((r) => r.code === 'knee-right')).toBeTruthy();
  });
});
