import { describe, it, expect } from 'vitest';
import { makeBetterSqliteDriver } from './betterSqliteDriver';

describe('betterSqliteDriver', () => {
  it('runs, reads, and rolls back transactions', async () => {
    const db = makeBetterSqliteDriver(':memory:');
    await db.exec('CREATE TABLE t (id TEXT PRIMARY KEY, n INTEGER)');
    await db.run('INSERT INTO t (id, n) VALUES (?, ?)', ['a', 1]);

    const row = await db.get<{ id: string; n: number }>('SELECT * FROM t WHERE id = ?', ['a']);
    expect(row?.n).toBe(1);

    await expect(
      db.transaction(async () => {
        await db.run('INSERT INTO t (id, n) VALUES (?, ?)', ['b', 2]);
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');

    const all = await db.all<{ id: string }>('SELECT id FROM t');
    expect(all.map((r) => r.id)).toEqual(['a']); // 'b' rolled back
  });
});
