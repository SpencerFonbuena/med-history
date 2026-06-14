import { describe, it, expect } from 'vitest';
import { makeBetterSqliteDriver } from '../../test/betterSqliteDriver';
import { migrate } from '../migrate';
import { migrations } from './index';

describe('migration 2 (theme)', () => {
  it('adds a theme column defaulting to dark, and stays idempotent', async () => {
    const d = makeBetterSqliteDriver(':memory:');
    await migrate(d, migrations);

    const v = await d.get<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(3);

    const row = await d.get<{ theme: string }>('SELECT theme FROM app_settings WHERE id = 1');
    expect(row?.theme).toBe('dark');

    await migrate(d, migrations); // second run is a no-op
    const v2 = await d.get<{ user_version: number }>('PRAGMA user_version');
    expect(v2?.user_version).toBe(3);
  });
});
