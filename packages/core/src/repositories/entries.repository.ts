import type { DbDriver } from '../db/driver';
import type { CoreDeps } from '../db/database';
import { createEntryInput, type CreateEntryInput, type Entry } from '../schemas/entry.schema';
import type { EntryType, ImagingSubtype } from '../schemas/enums';

interface EntryRow {
  id: string;
  profile_id: string;
  region_code: string | null;
  type: string;
  subtype: string | null;
  date: string;
  title: string;
  body: string;
  doctor: string | null;
  diagnosis: string | null;
  prescriber: string | null;
  duration: string | null;
  facility: string | null;
  details: string | null;
  created_at: string;
  updated_at: string;
}

const toEntry = (r: EntryRow): Entry => ({
  id: r.id,
  profileId: r.profile_id,
  regionCode: r.region_code,
  type: r.type as EntryType,
  subtype: (r.subtype as ImagingSubtype | null) ?? null,
  date: r.date,
  title: r.title,
  body: r.body,
  doctor: r.doctor,
  diagnosis: r.diagnosis,
  prescriber: r.prescriber,
  duration: r.duration,
  facility: r.facility,
  details: r.details ? (JSON.parse(r.details) as Record<string, unknown>) : null,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// Order by entry date desc, then creation time desc as a tiebreaker.
const ORDER = 'ORDER BY date DESC, created_at DESC';

export function makeEntriesRepository(driver: DbDriver, deps: CoreDeps) {
  async function create(input: CreateEntryInput): Promise<Entry> {
    const data = createEntryInput.parse(input);
    if (!data.profileId) throw new Error('profileId is required');
    const id = deps.genId();
    const ts = deps.now();
    await driver.run(
      `INSERT INTO entries
        (id, profile_id, region_code, type, subtype, date, title, body,
         doctor, diagnosis, prescriber, duration, facility, details, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.profileId,
        data.regionCode ?? null,
        data.type,
        data.subtype ?? null,
        data.date,
        data.title,
        data.body,
        data.doctor ?? null,
        data.diagnosis ?? null,
        data.prescriber ?? null,
        data.duration ?? null,
        data.facility ?? null,
        data.details ? JSON.stringify(data.details) : null,
        ts,
        ts,
      ],
    );
    const created = await get(id);
    if (!created) throw new Error('entry insert failed');
    return created;
  }

  async function get(id: string): Promise<Entry | undefined> {
    const row = await driver.get<EntryRow>('SELECT * FROM entries WHERE id = ?', [id]);
    return row ? toEntry(row) : undefined;
  }

  async function listByRegion(profileId: string, regionCode: string, type: EntryType): Promise<Entry[]> {
    const rows = await driver.all<EntryRow>(
      `SELECT * FROM entries WHERE profile_id = ? AND region_code = ? AND type = ? ${ORDER}`,
      [profileId, regionCode, type],
    );
    return rows.map(toEntry);
  }

  async function listGeneral(profileId: string, type: EntryType): Promise<Entry[]> {
    const rows = await driver.all<EntryRow>(
      `SELECT * FROM entries WHERE profile_id = ? AND region_code IS NULL AND type = ? ${ORDER}`,
      [profileId, type],
    );
    return rows.map(toEntry);
  }

  /** Map of region_code (or null for General) → entry count, for the body screen dots. */
  async function countsByRegion(profileId: string): Promise<Map<string | null, number>> {
    const rows = await driver.all<{ region_code: string | null; c: number }>(
      'SELECT region_code, COUNT(*) AS c FROM entries WHERE profile_id = ? GROUP BY region_code',
      [profileId],
    );
    return new Map(rows.map((r) => [r.region_code, r.c]));
  }

  async function remove(id: string): Promise<void> {
    await driver.run('DELETE FROM entries WHERE id = ?', [id]);
  }

  return { create, get, listByRegion, listGeneral, countsByRegion, remove };
}
