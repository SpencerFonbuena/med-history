import type { Entry, CreateEntryInput, UpdateEntryInput, EntryType } from '@med-history/core';
import { ok, err, type Result } from '@/lib/result';

/** Mirrors core's entries repo. The coordinator routes region-vs-General over it. */
export interface EntriesPort {
  listByRegion(profileId: string, regionCode: string, type: EntryType): Promise<Entry[]>;
  listGeneral(profileId: string, type: EntryType): Promise<Entry[]>;
  get(id: string): Promise<Entry | undefined>;
  create(input: CreateEntryInput): Promise<Entry>;
  update(id: string, input: UpdateEntryInput): Promise<Entry>;
  remove(id: string): Promise<void>;
}

export function makeEntriesCoordinator(port: EntriesPort) {
  async function list(profileId: string, regionCode: string | null, type: EntryType): Promise<Result<Entry[]>> {
    try {
      const rows = regionCode === null
        ? await port.listGeneral(profileId, type)
        : await port.listByRegion(profileId, regionCode, type);
      return ok(rows);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function get(id: string): Promise<Result<Entry>> {
    try {
      const entry = await port.get(id);
      if (!entry) return err('Entry not found.');
      return ok(entry);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function create(input: CreateEntryInput): Promise<Result<Entry>> {
    try { return ok(await port.create(input)); } catch (e) { return err((e as Error).message); }
  }

  async function update(id: string, input: UpdateEntryInput): Promise<Result<Entry>> {
    try { return ok(await port.update(id, input)); } catch (e) { return err((e as Error).message); }
  }

  async function remove(id: string): Promise<Result<void>> {
    try { await port.remove(id); return ok(undefined); } catch (e) { return err((e as Error).message); }
  }

  return { list, get, create, update, remove };
}
