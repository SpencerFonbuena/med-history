import { describe, it, expect } from 'vitest';
import { makeBetterSqliteDriver } from '../../test/betterSqliteDriver';
import { migrate } from '../migrate';
import { migrations } from './index';

describe('migration 1', () => {
  it('creates tables, seeds 40 regions, and one settings row', async () => {
    const d = makeBetterSqliteDriver(':memory:');
    await migrate(d, migrations);

    const tables = (await d.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type='table'")).map((r) => r.name);
    for (const t of ['app_settings', 'profiles', 'body_regions', 'entries', 'attachments']) {
      expect(tables).toContain(t);
    }

    const regions = await d.get<{ c: number }>('SELECT COUNT(*) AS c FROM body_regions');
    expect(regions?.c).toBe(40);

    const settings = await d.get<{ c: number; size_level: number }>('SELECT COUNT(*) AS c, size_level FROM app_settings');
    expect(settings?.c).toBe(1);
    expect(settings?.size_level).toBe(1);
  });
});
