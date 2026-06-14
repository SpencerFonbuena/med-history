import type { Profile, CreateProfileInput } from '@med-history/core';
import { ok, err, type Result } from '@/lib/result';

/** The slice of core's profiles repository this coordinator drives. */
export interface ProfilesPort {
  list(): Promise<Profile[]>;
  create(input: CreateProfileInput): Promise<Profile>;
  remove(id: string): Promise<void>;
}

export function makeProfilesCoordinator(port: ProfilesPort) {
  async function loadAll(): Promise<Result<Profile[]>> {
    try {
      return ok(await port.list());
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function create(input: CreateProfileInput): Promise<Result<Profile>> {
    try {
      return ok(await port.create(input));
    } catch (e) {
      return err((e as Error).message);
    }
  }

  async function remove(id: string): Promise<Result<void>> {
    try {
      await port.remove(id);
      return ok(undefined);
    } catch (e) {
      return err((e as Error).message);
    }
  }

  return { loadAll, create, remove };
}
