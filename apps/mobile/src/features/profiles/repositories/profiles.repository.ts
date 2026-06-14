import { getDatabase } from '@/lib/db/database';
import type { ProfilesPort } from '../services/coordinators/profiles.coordinator';

/** Device-backed profiles port: resolves the singleton DB then delegates to core. */
export const profilesRepository: ProfilesPort = {
  async list() {
    return (await getDatabase()).profiles.list();
  },
  async create(input) {
    return (await getDatabase()).profiles.create(input);
  },
  async remove(id) {
    return (await getDatabase()).profiles.remove(id);
  },
};
