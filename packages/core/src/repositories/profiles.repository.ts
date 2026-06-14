// packages/core/src/repositories/profiles.repository.ts
import type { DbDriver } from '../db/driver';
import type { CoreDeps } from '../db/database';
import {
  createProfileInput,
  updateProfileInput,
  type CreateProfileInput,
  type UpdateProfileInput,
  type Profile,
} from '../schemas/profile.schema';
import type { Sex } from '../schemas/enums';

interface ProfileRow {
  id: string;
  name: string;
  dob: string;
  sex: string;
  created_at: string;
  updated_at: string;
}

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  name: r.name,
  dob: r.dob,
  sex: r.sex as Sex,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export function makeProfilesRepository(driver: DbDriver, deps: CoreDeps) {
  async function create(input: CreateProfileInput): Promise<Profile> {
    const data = createProfileInput.parse(input);
    const id = deps.genId();
    const ts = deps.now();
    await driver.run(
      'INSERT INTO profiles (id, name, dob, sex, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.name, data.dob, data.sex, ts, ts],
    );
    return { id, ...data, createdAt: ts, updatedAt: ts };
  }

  async function list(): Promise<Profile[]> {
    const rows = await driver.all<ProfileRow>('SELECT * FROM profiles ORDER BY created_at ASC');
    return rows.map(toProfile);
  }

  async function get(id: string): Promise<Profile | undefined> {
    const row = await driver.get<ProfileRow>('SELECT * FROM profiles WHERE id = ?', [id]);
    return row ? toProfile(row) : undefined;
  }

  async function update(id: string, input: UpdateProfileInput): Promise<Profile> {
    const data = updateProfileInput.parse(input);
    const ts = deps.now();
    const fields: string[] = [];
    const params: (string | null)[] = [];
    for (const key of ['name', 'dob', 'sex'] as const) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key] as string);
      }
    }
    fields.push('updated_at = ?');
    params.push(ts, id);
    await driver.run(`UPDATE profiles SET ${fields.join(', ')} WHERE id = ?`, params);
    const updated = await get(id);
    if (!updated) throw new Error(`profile ${id} not found`);
    return updated;
  }

  async function remove(id: string): Promise<void> {
    await driver.run('DELETE FROM profiles WHERE id = ?', [id]);
  }

  return { create, list, get, update, remove };
}
