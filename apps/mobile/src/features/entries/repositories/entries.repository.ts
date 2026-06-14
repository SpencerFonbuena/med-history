import { getDatabase } from '@/lib/db/database';
import type { EntriesPort } from '../services/coordinators/entries.coordinator';

/** Device-backed entries port: thin 1:1 delegation to core's entries repo. */
export const entriesRepository: EntriesPort = {
  async listByRegion(profileId, regionCode, type) {
    return (await getDatabase()).entries.listByRegion(profileId, regionCode, type);
  },
  async listGeneral(profileId, type) {
    return (await getDatabase()).entries.listGeneral(profileId, type);
  },
  async get(id) {
    return (await getDatabase()).entries.get(id);
  },
  async create(input) {
    return (await getDatabase()).entries.create(input);
  },
  async update(id, input) {
    return (await getDatabase()).entries.update(id, input);
  },
  async remove(id) {
    return (await getDatabase()).entries.remove(id);
  },
};
