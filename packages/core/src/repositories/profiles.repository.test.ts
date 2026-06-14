// packages/core/src/repositories/profiles.repository.test.ts
import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';

describe('profiles repository', () => {
  it('creates, lists, gets, updates, and deletes', async () => {
    const { db } = await makeTestDb();
    const created = await db.profiles.create({ name: 'Marcus Chen', dob: '1987-03-14', sex: 'male' });
    expect(created.id).toBe('id-1');
    expect(created.createdAt).toBe(created.updatedAt);

    const list = await db.profiles.list();
    expect(list).toHaveLength(1);

    const got = await db.profiles.get('id-1');
    expect(got?.name).toBe('Marcus Chen');

    const updated = await db.profiles.update('id-1', { name: 'Marcus C.' });
    expect(updated.name).toBe('Marcus C.');

    await db.profiles.remove('id-1');
    expect(await db.profiles.get('id-1')).toBeUndefined();
  });

  it('rejects invalid input', async () => {
    const { db } = await makeTestDb();
    await expect(db.profiles.create({ name: '', dob: 'nope', sex: 'male' } as never)).rejects.toThrow();
  });
});
