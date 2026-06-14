import type { DbDriver, SqlParam } from '../db/driver';
import { buildFtsQuery } from '../db/ftsQuery';

export interface MedicationSeedRow {
  rxcui: string;
  name: string;
  type: string;
  brand?: string;
  strength?: string;
  doseForm?: string;
}

export interface MedicationHit {
  rxcui: string;
  name: string;
  strength?: string;
  doseForm?: string;
}

interface HitRow {
  rxcui: string;
  name: string;
  strength: string | null;
  doseForm: string | null;
}

const CHUNK = 400;

export function makeMedicationsRepository(driver: DbDriver) {
  async function count(): Promise<number> {
    const row = await driver.get<{ c: number }>('SELECT count(*) AS c FROM medications');
    return row?.c ?? 0;
  }

  async function seed(rows: MedicationSeedRow[]): Promise<void> {
    if ((await count()) > 0) return;
    await driver.transaction(async () => {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const values = slice.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
        const params: SqlParam[] = [];
        for (const r of slice) {
          params.push(r.name, r.rxcui, r.type, r.brand ?? null, r.strength ?? null, r.doseForm ?? null);
        }
        await driver.run(
          `INSERT INTO medications (name, rxcui, type, brand, strength, doseForm) VALUES ${values}`,
          params,
        );
      }
    });
  }

  async function search(query: string, limit = 30): Promise<MedicationHit[]> {
    const match = buildFtsQuery(query);
    if (!match) return [];
    const found = await driver.all<HitRow>(
      'SELECT rxcui, name, strength, doseForm FROM medications WHERE medications MATCH ? ORDER BY rank LIMIT ?',
      [match, limit],
    );
    return found.map((r) => ({
      rxcui: r.rxcui,
      name: r.name,
      strength: r.strength ?? undefined,
      doseForm: r.doseForm ?? undefined,
    }));
  }

  return { count, seed, search };
}
