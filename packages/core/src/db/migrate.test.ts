import { describe, it, expect } from 'vitest';
import { makeBetterSqliteDriver } from '../test/betterSqliteDriver';
import { migrate, type Migration } from './migrate';

const migrations: Migration[] = [
  { version: 1, up: async (d) => d.exec('CREATE TABLE a (id TEXT)') },
  { version: 2, up: async (d) => d.exec('CREATE TABLE b (id TEXT)') },
];

describe('migrate', () => {
  it('applies pending migrations and records user_version', async () => {
    const d = makeBetterSqliteDriver(':memory:');
    await migrate(d, migrations);

    const v = await d.get<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(2);
    const names = (await d.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'")).map((r) => r.name);
    expect(names).toContain('a');
    expect(names).toContain('b');
  });

  it('is idempotent — second run applies nothing', async () => {
    const d = makeBetterSqliteDriver(':memory:');
    await migrate(d, migrations);
    await migrate(d, migrations); // must not throw "table already exists"
    const v = await d.get<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(2);
  });
});
