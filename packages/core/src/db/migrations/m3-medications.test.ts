import { describe, it, expect } from 'vitest';
import { makeBetterSqliteDriver } from '../../test/betterSqliteDriver';
import { migrate } from '../migrate';
import { migrations } from './index';

describe('migration 3 (medications)', () => {
  it('creates a MATCH-queryable medications FTS5 table, and stays idempotent', async () => {
    const d = makeBetterSqliteDriver(':memory:');
    await migrate(d, migrations);

    const v = await d.get<{ user_version: number }>('PRAGMA user_version');
    expect(v?.user_version).toBe(3);

    await d.run(
      'INSERT INTO medications (name, rxcui, type, brand, strength, doseForm) VALUES (?, ?, ?, ?, ?, ?)',
      ['Lisinopril 10 MG Oral Tablet', '1', 'generic', null, '10 MG', 'Oral Tablet'],
    );
    const hit = await d.get<{ rxcui: string }>(
      "SELECT rxcui FROM medications WHERE medications MATCH 'lisin*'",
    );
    expect(hit?.rxcui).toBe('1');

    await migrate(d, migrations); // second run is a no-op
    const v2 = await d.get<{ user_version: number }>('PRAGMA user_version');
    expect(v2?.user_version).toBe(3);
  });
});
