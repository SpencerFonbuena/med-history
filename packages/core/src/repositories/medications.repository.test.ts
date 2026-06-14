import { describe, it, expect } from 'vitest';
import { makeTestDb } from '../test/makeTestDb';
import type { MedicationSeedRow } from './medications.repository';

const rows: MedicationSeedRow[] = [
  { rxcui: '1', name: 'Lisinopril 10 MG Oral Tablet', type: 'generic', strength: '10 MG', doseForm: 'Oral Tablet' },
  { rxcui: '2', name: 'Lisinopril 20 MG Oral Tablet', type: 'generic', strength: '20 MG', doseForm: 'Oral Tablet' },
  { rxcui: '3', name: 'Amoxicillin 500 MG Oral Capsule', type: 'generic', strength: '500 MG', doseForm: 'Oral Capsule' },
];

describe('medications repository', () => {
  it('seeds then searches by prefix and ANDs terms', async () => {
    const { db } = await makeTestDb();
    await db.medications.seed(rows);
    expect(await db.medications.count()).toBe(3);
    const hits = await db.medications.search('lisin 10');
    expect(hits).toHaveLength(1);
    expect(hits[0].rxcui).toBe('1');
    expect(hits[0].strength).toBe('10 MG');
  });

  it('matches all products for a single prefix', async () => {
    const { db } = await makeTestDb();
    await db.medications.seed(rows);
    const hits = await db.medications.search('lisin');
    expect(hits.map((h) => h.rxcui).sort()).toEqual(['1', '2']);
  });

  it('is idempotent — a second seed does not duplicate', async () => {
    const { db } = await makeTestDb();
    await db.medications.seed(rows);
    await db.medications.seed(rows);
    expect(await db.medications.count()).toBe(3);
  });

  it('returns [] for a blank query', async () => {
    const { db } = await makeTestDb();
    await db.medications.seed(rows);
    expect(await db.medications.search('   ')).toEqual([]);
  });
});
